/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { PricingService } from '../common/services/pricing.service';
import { NotificationService } from '../notification/notification.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { TrackingGateway } from '../common/gateways/tracking.gateway';
import { ParcelStatus, UserRole } from '../../generated/prisma';

@Injectable()
export class ParcelService {
  private readonly logger = new Logger(ParcelService.name);

  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
    private pricingService: PricingService,
    private notificationService: NotificationService,
    private trackingGateway: TrackingGateway,
  ) {}

  async createParcel(dto: CreateParcelDto) {
    const trackingCode =
      'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const [pickupAddress, deliveryAddress] = await Promise.all([
      dto.pickupAddressId
        ? this.prisma.address.findUnique({ where: { id: dto.pickupAddressId } })
        : null,
      dto.deliveryAddressId
        ? this.prisma.address.findUnique({
            where: { id: dto.deliveryAddressId },
          })
        : null,
    ]);

    let pricingData = {
      baseRate: 5.0,
      weightCharge: 0.0,
      distanceCharge: 0.0,
      totalCost: 5.0,
      distanceKm: 0.0,
      estimatedDeliveryTime: null as number | null, // Explicitly typed
    };

    if (
      pickupAddress &&
      deliveryAddress &&
      pickupAddress.formattedAddress &&
      deliveryAddress.formattedAddress
    ) {
      const pricing = this.pricingService.calculatePricingFromCoordinates(
        { lat: pickupAddress.latitude || 0, lng: pickupAddress.longitude || 0 },
        {
          lat: deliveryAddress.latitude || 0,
          lng: deliveryAddress.longitude || 0,
        },
        dto.weight || 0.5,
      );
      pricingData = {
        baseRate: pricing.baseRate,
        weightCharge: pricing.weightCharge,
        distanceCharge: pricing.distanceCharge,
        totalCost: pricing.totalCost,
        distanceKm: pricing.distanceKm,
        estimatedDeliveryTime: pricing.estimatedDeliveryTime,
      };
    }

    const parcel = await this.prisma.parcel.create({
      data: {
        ...dto,
        trackingCode,
        status: ParcelStatus.PENDING,
        ...pricingData,
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    // Send notifications for parcel creation asynchronously (don't wait for email)
    setImmediate(() => {
      this.notificationService
        .notifyParcelCreated(parcel.id, parcel.senderId, parcel.receiverId)
        .catch((error) => {
          this.logger.error(
            'Failed to send parcel creation notifications:',
            error,
          );
        });
    });

    return parcel;
  }

  async createParcelComprehensive(dto: any, senderId: string) {
    const trackingCode =
      'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Find or create receiver user
    let receiver = await this.prisma.user.findUnique({
      where: { email: dto.receiverEmail },
    });

    if (!receiver) {
      // Create new user for receiver
      receiver = await this.prisma.user.create({
        data: {
          email: dto.receiverEmail,
          name: dto.receiverName,
          phone: dto.receiverPhone,
          role: 'USER',
          password:
            'temp-password-' + Math.random().toString(36).substring(2, 10), // Temporary password
        },
      });
    }

    // Geocode pickup address
    let pickupCoords = { lat: -1.286389, lng: 36.817223 }; // Default Nairobi
    let pickupFormattedAddress = `${dto.pickupAddress.street}, ${dto.pickupAddress.city}, ${dto.pickupAddress.country}`;

    try {
      const pickupGeocode = await this.geocodingService.geocodeAddress(
        `${dto.pickupAddress.street}, ${dto.pickupAddress.city}, ${dto.pickupAddress.country}`,
      );
      pickupCoords = { lat: pickupGeocode.lat, lng: pickupGeocode.lng };
      pickupFormattedAddress = pickupGeocode.formattedAddress;
      console.log(
        '✅ Pickup geocoded:',
        pickupFormattedAddress,
        'at',
        pickupCoords,
      );
    } catch (error) {
      console.warn(
        '⚠️ Failed to geocode pickup address, using default:',
        error.message,
      );
    }

    // Geocode delivery address
    let deliveryCoords = { lat: -1.286389, lng: 36.817223 }; // Default Nairobi
    let deliveryFormattedAddress = `${dto.deliveryAddress.street}, ${dto.deliveryAddress.city}, ${dto.deliveryAddress.country}`;

    try {
      const deliveryGeocode = await this.geocodingService.geocodeAddress(
        `${dto.deliveryAddress.street}, ${dto.deliveryAddress.city}, ${dto.deliveryAddress.country}`,
      );
      deliveryCoords = { lat: deliveryGeocode.lat, lng: deliveryGeocode.lng };
      deliveryFormattedAddress = deliveryGeocode.formattedAddress;
      console.log(
        '✅ Delivery geocoded:',
        deliveryFormattedAddress,
        'at',
        deliveryCoords,
      );
    } catch (error) {
      console.warn(
        '⚠️ Failed to geocode delivery address, using default:',
        error.message,
      );
    }

    // Create pickup address
    const pickupAddress = await this.prisma.address.create({
      data: {
        line1: dto.pickupAddress.street,
        city: dto.pickupAddress.city,
        state: dto.pickupAddress.state,
        postalCode: dto.pickupAddress.postalCode,
        country: dto.pickupAddress.country,
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        formattedAddress: pickupFormattedAddress,
      },
    });

    // Create delivery address
    const deliveryAddress = await this.prisma.address.create({
      data: {
        line1: dto.deliveryAddress.street,
        city: dto.deliveryAddress.city,
        state: dto.deliveryAddress.state,
        postalCode: dto.deliveryAddress.postalCode,
        country: dto.deliveryAddress.country,
        latitude: deliveryCoords.lat,
        longitude: deliveryCoords.lng,
        formattedAddress: deliveryFormattedAddress,
      },
    });

    // Calculate pricing
    const pricing = this.pricingService.calculatePricingFromCoordinates(
      { lat: pickupAddress.latitude || 0, lng: pickupAddress.longitude || 0 },
      {
        lat: deliveryAddress.latitude || 0,
        lng: deliveryAddress.longitude || 0,
      },
      dto.weight || 0.5,
    );

    const parcel = await this.prisma.parcel.create({
      data: {
        senderId,
        receiverId: receiver.id,
        description: dto.description,
        weight: dto.weight,
        trackingCode,
        status: ParcelStatus.PENDING,
        pickupAddressId: pickupAddress.id,
        deliveryAddressId: deliveryAddress.id,
        baseRate: pricing.baseRate,
        weightCharge: pricing.weightCharge,
        distanceCharge: pricing.distanceCharge,
        totalCost: pricing.totalCost,
        distanceKm: pricing.distanceKm,
        estimatedDeliveryTime: pricing.estimatedDeliveryTime,
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    // Send notifications for parcel creation asynchronously
    setImmediate(() => {
      this.notificationService
        .notifyParcelCreated(parcel.id, parcel.senderId, parcel.receiverId)
        .catch((error) => {
          this.logger.error(
            'Failed to send parcel creation notifications:',
            error,
          );
        });
    });

    return parcel;
  }

  async getParcelById(id: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
        pickupAddress: true,
        deliveryAddress: true,
        courier: {
          select: {
            id: true,
            locationLat: true,
            locationLng: true,
            currentLocation: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!parcel) throw new NotFoundException('Parcel not found');
    return parcel;
  }

  async getParcelByTrackingCode(trackingCode: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { trackingCode },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
        pickupAddress: true,
        deliveryAddress: true,
        courier: {
          select: {
            id: true,
            locationLat: true,
            locationLng: true,
            currentLocation: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!parcel) throw new NotFoundException('Parcel not found');
    return parcel;
  }

  async getParcels(
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
    courierId?: string,
    userId?: string,
    role?: UserRole,
    trackingCode?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Handle tracking code search (exact match)
    if (trackingCode) {
      where.trackingCode = trackingCode;
    } else if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { trackingCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (courierId) where.courierId = courierId;
    if (role === 'USER' && userId) {
      where.OR = [{ senderId: userId }, { receiverId: userId }];
    }
    if (role === 'COURIER' && courierId) {
      where.courierId = courierId;
    }

    const [parcels, total] = await Promise.all([
      this.prisma.parcel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } },
          pickupAddress: true,
          deliveryAddress: true,
          courier: {
            select: {
              id: true,
              locationLat: true,
              locationLng: true,
              currentLocation: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      this.prisma.parcel.count({ where }),
    ]);
    return {
      parcels,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async updateParcel(id: string, dto: UpdateParcelDto) {
    // Remove undefined fields
    const data: any = {};
    for (const key in dto) {
      if (dto[key] !== undefined) {
        data[key] = dto[key];
      }
    }
    await this.getParcelById(id);
    return this.prisma.parcel.update({ where: { id }, data });
  }

  async deleteParcel(id: string) {
    await this.getParcelById(id);
    return this.prisma.parcel.delete({ where: { id } });
  }

  async updateStatus(parcelId: string, statusData: UpdateStatusDto) {
    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        status: statusData.status as ParcelStatus,
        updatedAt: new Date(),
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        courier: { select: { user: { select: { name: true, email: true } } } },
      },
    });

    // Create status history record
    await this.prisma.parcelStatusHistory.create({
      data: {
        parcelId,
        status: statusData.status as ParcelStatus,
        note: statusData.notes || `Status updated to ${statusData.status}`,
      },
    });

    // Broadcast status update to all clients tracking this parcel (asynchronously)
    setImmediate(() => {
      try {
        this.trackingGateway.broadcastStatusUpdate(parcelId, statusData.status);
      } catch (error) {
        this.logger.error(
          `Failed to broadcast status update for parcel ${parcelId}:`,
          error,
        );
      }
    });

    // Send notification asynchronously (don't wait for it)
    setImmediate(async () => {
      try {
        await this.notificationService.notifyParcelStatusUpdate(
          parcelId,
          statusData.status,
          statusData.notes || `Status updated to ${statusData.status}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send notification for parcel ${parcelId}:`,
          error,
        );
      }
    });

    this.logger.log(
      `Status updated for parcel ${parcelId}: ${statusData.status}`,
    );
    return parcel;
  }

  async assignCourier(parcelId: string, assignData: AssignCourierDto) {
    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        courierId: assignData.courierId,
        status: 'IN_TRANSIT' as ParcelStatus,
        updatedAt: new Date(),
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        courier: { select: { user: { select: { name: true, email: true } } } },
      },
    });

    // Create status history record
    await this.prisma.parcelStatusHistory.create({
      data: {
        parcelId,
        status: 'IN_TRANSIT' as ParcelStatus,
        note: assignData.notes || `Parcel assigned to courier`,
      },
    });

    // Broadcast status update to all clients tracking this parcel (asynchronously)
    setImmediate(() => {
      try {
        this.trackingGateway.broadcastStatusUpdate(
          parcelId,
          'IN_TRANSIT',
          assignData.courierId,
        );
      } catch (error) {
        this.logger.error(
          `Failed to broadcast status update for parcel ${parcelId}:`,
          error,
        );
      }
    });

    // Send notification asynchronously (don't wait for it)
    setImmediate(async () => {
      try {
        await this.notificationService.notifyParcelAssigned(
          parcelId,
          assignData.courierId,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send notification for parcel ${parcelId}:`,
          error,
        );
      }
    });

    this.logger.log(
      `Courier assigned to parcel ${parcelId}: ${assignData.courierId}`,
    );
    return parcel;
  }

  /**
   * Calculate pricing for a parcel before creation
   */
  async calculatePricing(
    pickupAddressId: string,
    deliveryAddressId: string,
    weight: number,
    options: {
      express?: boolean;
      insuranceValue?: number;
    } = {},
  ) {
    const [pickupAddress, deliveryAddress] = await Promise.all([
      this.prisma.address.findUnique({ where: { id: pickupAddressId } }),
      this.prisma.address.findUnique({ where: { id: deliveryAddressId } }),
    ]);

    if (!pickupAddress || !deliveryAddress) {
      throw new BadRequestException('Invalid address IDs');
    }

    if (!pickupAddress.formattedAddress || !deliveryAddress.formattedAddress) {
      throw new BadRequestException('Addresses must have formatted addresses');
    }

    return this.pricingService.calculatePricing(
      pickupAddress.formattedAddress,
      deliveryAddress.formattedAddress,
      weight,
      options,
    );
  }

  /**
   * Get parcel with pricing breakdown
   */
  async getParcelWithPricing(id: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        pickupAddress: true,
        deliveryAddress: true,
        courier: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    // Add pricing breakdown if addresses exist
    let pricingBreakdown: any = null;
    if (parcel.pickupAddress && parcel.deliveryAddress) {
      pricingBreakdown = this.pricingService.calculatePricingFromCoordinates(
        {
          lat: parcel.pickupAddress.latitude || 0,
          lng: parcel.pickupAddress.longitude || 0,
        },
        {
          lat: parcel.deliveryAddress.latitude || 0,
          lng: parcel.deliveryAddress.longitude || 0,
        },
        parcel.weight || 0.5,
      );
    }

    return {
      ...parcel,
      pricingBreakdown,
    };
  }
}
