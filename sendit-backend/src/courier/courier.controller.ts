/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CourierService } from './courier.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { CreateCourierComprehensiveDto } from './dto/create-courier-comprehensive.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { UpdateCourierComprehensiveDto } from './dto/update-courier-comprehensive.dto';
import { ResetCourierPasswordDto } from './dto/reset-courier-password.dto';
import { LocationUpdateDto } from './dto/location-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole, CourierStatus } from '../../generated/prisma';

interface UserJwtPayload {
  userId?: string;
  role?: string;
}

@Controller('courier')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  // Create courier (Admin only)
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCourier(@Body() dto: CreateCourierDto) {
    return this.courierService.createCourier(dto);
  }

  // Create courier comprehensive (Admin only) - creates user and courier
  @Post('comprehensive')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCourierComprehensive(@Body() dto: CreateCourierComprehensiveDto) {
    return this.courierService.createCourierComprehensive(dto);
  }

  // Get all couriers (Admin only)
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: CourierStatus,
  ) {
    return this.courierService.findAll(
      Number(page),
      Number(limit),
      search,
      status,
    );
  }

  // Get available couriers (Admin only)
  @Get('available')
  @Roles(UserRole.ADMIN)
  async getAvailableCouriers() {
    return this.courierService.getAvailableCouriers();
  }

  // Get courier by ID (Admin, Courier - own profile)
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  async findById(@Param('id') id: string, @User() user: UserJwtPayload) {
    // If courier, they can only see their own profile
    if (user?.role === 'COURIER') {
      if (!user?.userId) {
        throw new Error('User ID not found');
      }
      const courier = await this.courierService.findByUserId(user.userId);
      if (courier.id !== id) {
        throw new Error('Access denied');
      }
    }
    return this.courierService.findById(id);
  }

  // Get courier profile by user ID (Courier - own profile)
  @Get('profile/me')
  @Roles(UserRole.COURIER)
  async getProfile(@User() user: UserJwtPayload) {
    if (!user?.userId) {
      throw new Error('User ID not found');
    }
    return this.courierService.findByUserId(user.userId);
  }

  // Get courier stats (Admin, Courier - own stats)
  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  async getStats(@Param('id') id: string, @User() user: UserJwtPayload) {
    // If courier, they can only see their own stats
    if (user?.role === 'COURIER') {
      if (!user?.userId) {
        throw new Error('User ID not found');
      }
      const courier = await this.courierService.findByUserId(user.userId);
      if (courier.id !== id) {
        throw new Error('Access denied');
      }
    }
    return this.courierService.getCourierStats(id);
  }

  // Get courier analytics (Admin, Courier - own analytics)
  @Get(':id/analytics')
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  async getAnalytics(
    @Param('id') id: string,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
    @User() user: UserJwtPayload,
  ) {
    // If courier, they can only see their own analytics
    if (user?.role === 'COURIER') {
      if (!user?.userId) {
        throw new Error('User ID not found');
      }
      const courier = await this.courierService.findByUserId(user.userId);
      if (courier.id !== id) {
        throw new Error('Access denied');
      }
    }
    return this.courierService.getCourierAnalytics(id, period);
  }

  // Get courier performance summary (Admin only)
  @Get('performance/summary')
  @Roles(UserRole.ADMIN)
  async getPerformanceSummary() {
    const couriers = await this.courierService.findAll(1, 100);
    const performanceData = await Promise.all(
      couriers.couriers.map(async (courier) => {
        const stats = await this.courierService.getCourierStats(courier.id);
        return {
          courierId: courier.id,
          courierName: courier.user.name,
          deliveryRate: stats.stats.deliveryRate,
          totalDeliveries: stats.stats.deliveredParcels,
          avgDeliveryTime: stats.stats.avgDeliveryTimeMinutes,
          totalEarnings: stats.stats.totalEarnings,
          performanceRating: stats.stats.performanceRating,
        };
      }),
    );

    // Calculate overall statistics
    const totalCouriers = performanceData.length;
    const avgDeliveryRate =
      performanceData.reduce((sum, data) => sum + data.deliveryRate, 0) /
      totalCouriers;
    const totalEarnings = performanceData.reduce(
      (sum, data) => sum + data.totalEarnings,
      0,
    );
    const avgPerformanceRating =
      performanceData.reduce((sum, data) => sum + data.performanceRating, 0) /
      totalCouriers;

    return {
      summary: {
        totalCouriers,
        avgDeliveryRate: Math.round(avgDeliveryRate * 100) / 100,
        totalEarnings,
        avgPerformanceRating: Math.round(avgPerformanceRating * 100) / 100,
      },
      courierPerformance: performanceData.sort(
        (a, b) => b.performanceRating - a.performanceRating,
      ),
    };
  }

  // Update courier (Admin only)
  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateCourier(@Param('id') id: string, @Body() dto: UpdateCourierDto) {
    return this.courierService.updateCourier(id, dto);
  }

  // Update courier comprehensive (Admin only) - updates both user and courier
  @Put(':id/comprehensive')
  @Roles(UserRole.ADMIN)
  async updateCourierComprehensive(
    @Param('id') id: string,
    @Body() dto: UpdateCourierComprehensiveDto,
  ) {
    return this.courierService.updateCourierComprehensive(id, dto);
  }

  // Update courier location (Courier - own location)
  @Put(':id/location')
  @Roles(UserRole.COURIER)
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: LocationUpdateDto,
    @User() user: UserJwtPayload,
  ) {
    // Courier can only update their own location
    if (!user?.userId) {
      throw new Error('User ID not found');
    }
    const courier = await this.courierService.findByUserId(user.userId);
    if (courier.id !== id) {
      throw new Error('Access denied');
    }
    return this.courierService.updateLocation(id, dto);
  }

  // Update courier status (Admin, Courier - own status)
  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: CourierStatus },
    @User() user: UserJwtPayload,
  ) {
    // If courier, they can only update their own status
    if (user?.role === 'COURIER') {
      if (!user?.userId) {
        throw new Error('User ID not found');
      }
      const courier = await this.courierService.findByUserId(user.userId);
      if (courier.id !== id) {
        throw new Error('Access denied');
      }
    }
    return this.courierService.updateStatus(id, body.status);
  }

  // Delete courier (Admin only)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourier(@Param('id') id: string) {
    return this.courierService.deleteCourier(id);
  }

  // Reset courier password (Admin only)
  @Post(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async resetCourierPassword(@Param('id') id: string) {
    return this.courierService.resetCourierPassword(id);
  }
}
