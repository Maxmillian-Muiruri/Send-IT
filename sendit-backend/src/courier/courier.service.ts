/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { CreateCourierComprehensiveDto } from './dto/create-courier-comprehensive.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { UpdateCourierComprehensiveDto } from './dto/update-courier-comprehensive.dto';
import { ResetCourierPasswordDto } from './dto/reset-courier-password.dto';
import { LocationUpdateDto } from './dto/location-update.dto';
import { CourierStatus, UserRole } from '../../generated/prisma';
import { TrackingGateway } from '../common/gateways/tracking.gateway';
import { GeocodingService } from '../common/services/geocoding.service';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);

  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
    private geocodingService: GeocodingService,
    private emailService: EmailService,
  ) {}

  async createCourier(dto: CreateCourierDto) {
    // Check if user exists and has COURIER role
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'COURIER') {
      throw new BadRequestException('User must have COURIER role');
    }

    // Check if courier already exists for this user
    const existingCourier = await this.prisma.courier.findFirst({
      where: { userId: dto.userId },
    });

    if (existingCourier) {
      throw new BadRequestException('Courier already exists for this user');
    }

    return this.prisma.courier.create({
      data: {
        userId: dto.userId,
        vehicleType: dto.vehicleType,
        licensePlate: dto.licensePlate,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        currentLocation: dto.currentLocation,
        status: dto.status || CourierStatus.AVAILABLE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async createCourierComprehensive(dto: CreateCourierComprehensiveDto) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Generate a predictable default password
    const defaultPassword = 'courier123';

    // Hash the password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create user first
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: 'COURIER',
        password: hashedPassword, // Hashed password
      },
    });

    // Create courier profile
    const courier = await this.prisma.courier.create({
      data: {
        userId: user.id,
        vehicleType: dto.vehicleType || 'MOTORCYCLE',
        licensePlate: dto.licensePlate || '',
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        currentLocation: dto.currentLocation,
        status: dto.status || CourierStatus.AVAILABLE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(`Created courier with user: ${user.id} - ${user.email}`);

    // Send onboarding email to courier (completely non-blocking)
    Promise.resolve().then(() => {
      this.emailService
        .sendCourierOnboardingEmail(user.email, {
          name: user.name || 'Courier',
          email: user.email,
          password: defaultPassword,
          vehicleType: courier.vehicleType || 'MOTORCYCLE',
          licensePlate: courier.licensePlate || undefined,
        })
        .then(() => {
          this.logger.log(`Onboarding email sent to courier: ${user.email}`);
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send onboarding email to courier ${user.email}:`,
            error,
          );
        });
    });

    // Return courier with login credentials
    return {
      ...courier,
      loginCredentials: {
        email: user.email,
        password: defaultPassword,
        message:
          'Please share these credentials with the courier. They should change their password after first login.',
      },
    };
  }

  async findAll(page = 1, limit = 10, search?: string, status?: CourierStatus) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { vehicleType: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [couriers, total] = await Promise.all([
      this.prisma.courier.findMany({
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
              phone: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.courier.count({ where }),
    ]);

    return {
      couriers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        assignedParcels: {
          where: { status: { not: 'DELIVERED' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    return courier;
  }

  async findByUserId(userId: string) {
    const courier = await this.prisma.courier.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        assignedParcels: {
          where: { status: { not: 'DELIVERED' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException('Courier not found for this user');
    }

    return courier;
  }

  async updateCourier(id: string, dto: UpdateCourierDto) {
    await this.findById(id);

    return this.prisma.courier.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async updateCourierComprehensive(
    id: string,
    dto: UpdateCourierComprehensiveDto,
  ) {
    const courier = await this.findById(id);

    // Prepare user update data
    const userUpdateData: any = {};
    if (dto.name !== undefined) userUpdateData.name = dto.name;
    if (dto.email !== undefined) userUpdateData.email = dto.email;
    if (dto.phone !== undefined) userUpdateData.phone = dto.phone;

    // Prepare courier update data
    const courierUpdateData: any = {};
    if (dto.vehicleType !== undefined)
      courierUpdateData.vehicleType = dto.vehicleType;
    if (dto.licensePlate !== undefined)
      courierUpdateData.licensePlate = dto.licensePlate;
    if (dto.locationLat !== undefined)
      courierUpdateData.locationLat = dto.locationLat;
    if (dto.locationLng !== undefined)
      courierUpdateData.locationLng = dto.locationLng;
    if (dto.currentLocation !== undefined)
      courierUpdateData.currentLocation = dto.currentLocation;
    if (dto.status !== undefined) courierUpdateData.status = dto.status;

    // Update both user and courier in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Update user if user fields are provided
      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: courier.userId },
          data: userUpdateData,
        });
      }

      // Update courier
      return prisma.courier.update({
        where: { id },
        data: courierUpdateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });
    });
  }

  async updateLocation(courierId: string, locationData: LocationUpdateDto) {
    let formattedAddress = locationData.currentLocation;

    // Update location immediately, then geocode asynchronously
    const courier = await this.prisma.courier.update({
      where: { id: courierId },
      data: {
        locationLat: locationData.locationLat,
        locationLng: locationData.locationLng,
        currentLocation: formattedAddress,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { name: true, email: true } },
        assignedParcels: {
          where: { status: { in: ['IN_TRANSIT'] } },
          select: { id: true, trackingCode: true },
        },
      },
    });

    // Geocode asynchronously (don't block the response)
    if (locationData.locationLat && locationData.locationLng) {
      Promise.resolve().then(async () => {
        try {
          const reverse = await this.geocodingService.reverseGeocode(
            locationData.locationLat,
            locationData.locationLng,
          );
          const newFormattedAddress =
            reverse.formattedAddress ||
            reverse.city ||
            reverse.state ||
            reverse.country ||
            formattedAddress;

          // Update the courier with the geocoded address
          await this.prisma.courier.update({
            where: { id: courierId },
            data: { currentLocation: newFormattedAddress },
          });

          this.logger.log(
            `Geocoded address updated for courier ${courierId}: ${newFormattedAddress}`,
          );
        } catch (err) {
          this.logger.warn(`Reverse geocoding failed: ${err.message}`);
        }
      });
    }

    // Broadcast location update to all clients tracking parcels assigned to this courier (asynchronously)
    setImmediate(() => {
      courier.assignedParcels.forEach((parcel) => {
        try {
          this.trackingGateway.broadcastLocationUpdate(
            parcel.id,
            courierId,
            locationData.locationLat,
            locationData.locationLng,
          );
        } catch (error) {
          this.logger.error(
            `Failed to broadcast location update for parcel ${parcel.id}:`,
            error,
          );
        }
      });
    });

    this.logger.log(
      `Location updated for courier ${courierId}: ${formattedAddress}`,
    );
    return courier;
  }

  async updateStatus(courierId: string, status: CourierStatus) {
    const courier = await this.prisma.courier.update({
      where: { id: courierId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        assignedParcels: {
          where: { status: { in: ['IN_TRANSIT'] } },
          select: { id: true, trackingCode: true },
        },
      },
    });

    // Broadcast status update to all clients tracking parcels assigned to this courier
    courier.assignedParcels.forEach((parcel) => {
      this.trackingGateway.broadcastStatusUpdate(parcel.id, status, courierId);
    });

    this.logger.log(`Status updated for courier ${courierId}: ${status}`);
    return courier;
  }

  async deleteCourier(id: string) {
    await this.findById(id);

    // Check if courier has active parcels
    const activeParcels = await this.prisma.parcel.count({
      where: {
        courierId: id,
        status: { not: 'DELIVERED' },
      },
    });

    if (activeParcels > 0) {
      throw new BadRequestException(
        'Cannot delete courier with active parcels',
      );
    }

    return this.prisma.courier.delete({ where: { id } });
  }

  async resetCourierPassword(courierId: string) {
    const courier = await this.findById(courierId);
    const defaultPassword = 'courier123';

    // Hash the password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.update({
      where: { id: courier.userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Reset password for courier: ${courierId}`);

    // Send password reset notification email (completely non-blocking)
    Promise.resolve().then(() => {
      this.emailService
        .sendCourierOnboardingEmail(courier.user.email, {
          name: courier.user.name || 'Courier',
          email: courier.user.email,
          password: defaultPassword,
          vehicleType: courier.vehicleType || 'MOTORCYCLE',
          licensePlate: courier.licensePlate || undefined,
        })
        .then(() => {
          this.logger.log(
            `Password reset email sent to courier: ${courier.user.email}`,
          );
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send password reset email to courier ${courier.user.email}:`,
            error,
          );
        });
    });

    return {
      message: 'Courier password reset successfully',
      loginCredentials: {
        email: courier.user.email,
        password: defaultPassword,
        message:
          'Password has been reset to default. Please share these credentials with the courier.',
      },
    };
  }

  async getAvailableCouriers() {
    return this.prisma.courier.findMany({
      where: { status: CourierStatus.AVAILABLE },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourierStats(id: string) {
    const courier = await this.findById(id);

    // Get all parcels for this courier
    const allParcels = await this.prisma.parcel.findMany({
      where: { courierId: id },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        pickupAddress: true,
        deliveryAddress: true,
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    const totalParcels = allParcels.length;
    const deliveredParcels = allParcels.filter((p) => p.status === 'DELIVERED');
    const pendingParcels = allParcels.filter((p) => p.status !== 'DELIVERED');

    // Calculate delivery performance metrics
    const deliveryRate =
      totalParcels > 0 ? (deliveredParcels.length / totalParcels) * 100 : 0;

    // Calculate average delivery time
    const deliveryTimes = deliveredParcels
      .map((parcel) => {
        const pickupTime = parcel.statusHistory.find(
          (h) => h.status === 'IN_TRANSIT',
        )?.changedAt;
        const deliveryTime = parcel.statusHistory.find(
          (h) => h.status === 'DELIVERED',
        )?.changedAt;
        if (pickupTime && deliveryTime) {
          return (
            new Date(deliveryTime).getTime() - new Date(pickupTime).getTime()
          );
        }
        return 0;
      })
      .filter((time) => time > 0);

    const avgDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + time, 0) /
          deliveryTimes.length
        : 0;

    // Calculate earnings (assuming $5 per delivery)
    const baseRate = 5;
    const totalEarnings = deliveredParcels.length * baseRate;

    // Calculate distance metrics (if addresses are available)
    const totalDistance = allParcels.reduce((sum, parcel) => {
      if (parcel.pickupAddress && parcel.deliveryAddress) {
        // Simple distance calculation (you can use a proper geocoding service)
        const distance = this.calculateDistance(
          parcel.pickupAddress.latitude || 0,
          parcel.pickupAddress.longitude || 0,
          parcel.deliveryAddress.latitude || 0,
          parcel.deliveryAddress.longitude || 0,
        );
        return sum + distance;
      }
      return sum;
    }, 0);

    // Monthly statistics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyParcels = deliveredParcels.filter((parcel) => {
      const deliveryDate = new Date(parcel.updatedAt);
      return (
        deliveryDate.getMonth() === currentMonth &&
        deliveryDate.getFullYear() === currentYear
      );
    });
    const monthlyEarnings = monthlyParcels.length * baseRate;

    // Performance rating (based on delivery rate and time)
    const performanceRating = Math.min(
      5,
      deliveryRate / 20 + (avgDeliveryTime < 3600000 ? 2 : 1),
    ); // 1 hour = 3600000ms

    return {
      courier,
      stats: {
        // Basic metrics
        totalParcels,
        deliveredParcels: deliveredParcels.length,
        pendingParcels: pendingParcels.length,
        deliveryRate: Math.round(deliveryRate * 100) / 100,

        // Time metrics
        avgDeliveryTimeMinutes: Math.round(avgDeliveryTime / 60000),
        avgDeliveryTimeHours:
          Math.round((avgDeliveryTime / 3600000) * 100) / 100,

        // Financial metrics
        totalEarnings,
        monthlyEarnings,
        avgEarningsPerDelivery:
          deliveredParcels.length > 0
            ? totalEarnings / deliveredParcels.length
            : 0,

        // Route metrics
        totalDistanceKm: Math.round(totalDistance * 100) / 100,
        avgDistancePerDelivery:
          deliveredParcels.length > 0
            ? totalDistance / deliveredParcels.length
            : 0,

        // Performance rating
        performanceRating: Math.round(performanceRating * 100) / 100,

        // Recent activity
        recentDeliveries: deliveredParcels.slice(0, 5).map((p) => ({
          id: p.id,
          trackingCode: p.trackingCode,
          deliveredAt: p.updatedAt,
          sender: p.sender.name,
          receiver: p.receiver.name,
        })),
      },
    };
  }

  // Helper method to calculate distance between two points
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get courier performance analytics
  async getCourierAnalytics(
    id: string,
    period: 'week' | 'month' | 'year' = 'month',
  ) {
    const courier = await this.findById(id);

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const parcels = await this.prisma.parcel.findMany({
      where: {
        courierId: id,
        createdAt: { gte: startDate },
      },
      include: {
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    // Daily delivery trends
    const dailyStats = this.calculateDailyStats(parcels, startDate, now);

    // Status distribution
    const statusDistribution = this.calculateStatusDistribution(parcels);

    // Performance trends
    const performanceTrends = this.calculatePerformanceTrends(parcels);

    return {
      courier,
      period,
      analytics: {
        dailyStats,
        statusDistribution,
        performanceTrends,
      },
    };
  }

  private calculateDailyStats(parcels: any[], startDate: Date, endDate: Date) {
    const dailyStats: Array<{
      date: string;
      totalParcels: number;
      deliveredParcels: number;
      earnings: number;
    }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayParcels = parcels.filter((p) => {
        const parcelDate = new Date(p.createdAt);
        return parcelDate.toDateString() === currentDate.toDateString();
      });

      dailyStats.push({
        date: currentDate.toISOString().split('T')[0],
        totalParcels: dayParcels.length,
        deliveredParcels: dayParcels.filter((p) => p.status === 'DELIVERED')
          .length,
        earnings: dayParcels.filter((p) => p.status === 'DELIVERED').length * 5,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyStats;
  }

  private calculateStatusDistribution(parcels: any[]) {
    const statuses = [
      'PENDING',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ];
    return statuses.map((status) => ({
      status,
      count: parcels.filter((p) => p.status === status).length,
      percentage:
        parcels.length > 0
          ? (parcels.filter((p) => p.status === status).length /
              parcels.length) *
            100
          : 0,
    }));
  }

  private calculatePerformanceTrends(parcels: any[]) {
    const deliveredParcels = parcels.filter((p) => p.status === 'DELIVERED');

    if (deliveredParcels.length === 0) {
      return { avgDeliveryTime: 0, deliveryRate: 0, customerSatisfaction: 0 };
    }

    const deliveryTimes = deliveredParcels
      .map((parcel) => {
        const pickupTime = parcel.statusHistory.find(
          (h) => h.status === 'IN_TRANSIT',
        )?.changedAt;
        const deliveryTime = parcel.statusHistory.find(
          (h) => h.status === 'DELIVERED',
        )?.changedAt;
        if (pickupTime && deliveryTime) {
          return (
            new Date(deliveryTime).getTime() - new Date(pickupTime).getTime()
          );
        }
        return 0;
      })
      .filter((time) => time > 0);

    const avgDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + time, 0) /
          deliveryTimes.length
        : 0;

    const deliveryRate = (deliveredParcels.length / parcels.length) * 100;

    // Mock customer satisfaction (in real app, this would come from ratings)
    const customerSatisfaction = Math.min(
      5,
      4 + deliveryRate / 20 + (avgDeliveryTime < 3600000 ? 0.5 : 0),
    );

    return {
      avgDeliveryTimeMinutes: Math.round(avgDeliveryTime / 60000),
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      customerSatisfaction: Math.round(customerSatisfaction * 100) / 100,
    };
  }
}
