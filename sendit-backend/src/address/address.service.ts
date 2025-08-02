import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
  ) {}

  async createAddress(dto: CreateAddressDto) {
    // Validate address format
    this.validateAddress(dto);

    // Geocode the address to get coordinates
    const addressString = this.formatAddressString(dto);
    const geocodingResult =
      await this.geocodingService.geocodeAddress(addressString);

    return this.prisma.address.create({
      data: {
        ...dto,
        latitude: geocodingResult.lat,
        longitude: geocodingResult.lng,
        formattedAddress: geocodingResult.formattedAddress,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { line1: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    const [addresses, total] = await Promise.all([
      this.prisma.address.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.address.count({ where }),
    ]);

    return {
      addresses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async findByUserId(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAddress(id: string, dto: UpdateAddressDto) {
    await this.findById(id);

    // If address fields are being updated, re-geocode
    if (dto.line1 || dto.city || dto.state || dto.country) {
      const existingAddress = await this.findById(id);
      const updatedAddress = { ...existingAddress, ...dto };
      this.validateAddress(updatedAddress);

      const addressString = this.formatAddressString(updatedAddress);
      const geocodingResult =
        await this.geocodingService.geocodeAddress(addressString);

      dto.latitude = geocodingResult.lat;
      dto.longitude = geocodingResult.lng;
      dto.formattedAddress = geocodingResult.formattedAddress;
    }

    return this.prisma.address.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteAddress(id: string) {
    await this.findById(id);

    // Check if address is being used by any parcels
    const usedInParcels = await this.prisma.parcel.count({
      where: {
        OR: [{ pickupAddressId: id }, { deliveryAddressId: id }],
      },
    });

    if (usedInParcels > 0) {
      throw new BadRequestException(
        'Cannot delete address that is being used by parcels',
      );
    }

    return this.prisma.address.delete({ where: { id } });
  }

  // Calculate distance between two addresses
  async calculateDistance(address1Id: string, address2Id: string) {
    const [address1, address2] = await Promise.all([
      this.findById(address1Id),
      this.findById(address2Id),
    ]);

    if (
      !address1.latitude ||
      !address1.longitude ||
      !address2.latitude ||
      !address2.longitude
    ) {
      throw new BadRequestException(
        'Both addresses must have valid coordinates',
      );
    }

    const distance = this.geocodingService.calculateDistance(
      address1.latitude,
      address1.longitude,
      address2.latitude,
      address2.longitude,
    );

    const travelTime = this.geocodingService.calculateTravelTime(distance);

    return {
      distance: Math.round(distance * 100) / 100, // km
      distanceMiles: Math.round(distance * 0.621371 * 100) / 100,
      estimatedTravelTime: travelTime, // minutes
      address1: {
        id: address1.id,
        formattedAddress: address1.formattedAddress,
      },
      address2: {
        id: address2.id,
        formattedAddress: address2.formattedAddress,
      },
    };
  }

  // Get addresses within a certain radius
  async findNearbyAddresses(lat: number, lng: number, radiusKm: number = 10) {
    const addresses = await this.prisma.address.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const nearbyAddresses = addresses
      .map((address) => {
        if (!address.latitude || !address.longitude) return null;

        const distance = this.geocodingService.calculateDistance(
          lat,
          lng,
          address.latitude,
          address.longitude,
        );
        return { ...address, distance };
      })
      .filter(
        (address): address is NonNullable<typeof address> => address !== null,
      )
      .filter((address) => address.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return nearbyAddresses;
  }

  // Validate address format
  private validateAddress(address: any) {
    if (!address.line1 || !address.city || !address.state || !address.country) {
      throw new BadRequestException(
        'Address must include line1, city, state, and country',
      );
    }

    if (address.line1.length < 5) {
      throw new BadRequestException(
        'Address line1 must be at least 5 characters',
      );
    }

    // More flexible postal code validation for international addresses
    if (address.postalCode) {
      // Allow various international postal code formats
      // US: 12345 or 12345-6789
      // Kenya: 00100, 80100, etc.
      // UK: A1A 1AA, A1 1AA, etc.
      // Canada: A1A 1A1
      // And many other international formats
      const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
      if (!postalCodeRegex.test(address.postalCode)) {
        throw new BadRequestException(
          'Invalid postal code format. Please enter a valid postal/zip code.',
        );
      }
    }
  }

  // Format address string for geocoding
  private formatAddressString(address: any): string {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter((part) => part);

    return parts.join(', ');
  }

  // Format address for display
  private formatAddress(address: any): string {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter((part) => part);

    return parts.join(', ');
  }

  // Get address statistics
  async getAddressStats() {
    const [totalAddresses, addressesWithCoordinates, addressesByCountry] =
      await Promise.all([
        this.prisma.address.count(),
        this.prisma.address.count({
          where: {
            latitude: { not: null },
            longitude: { not: null },
          },
        }),
        this.prisma.address.groupBy({
          by: ['country'],
          _count: {
            country: true,
          },
          orderBy: {
            _count: {
              country: 'desc',
            },
          },
        }),
      ]);

    return {
      totalAddresses,
      addressesWithCoordinates,
      geocodingRate:
        totalAddresses > 0
          ? (addressesWithCoordinates / totalAddresses) * 100
          : 0,
      addressesByCountry: addressesByCountry.map((item) => ({
        country: item.country,
        count: item._count.country,
      })),
    };
  }
}
