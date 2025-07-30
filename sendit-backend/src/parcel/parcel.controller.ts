import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole } from '../../generated/prisma';

interface UserJwtPayload {
  userId?: string;
  courierId?: string;
  role?: string;
}

@Controller('parcel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParcelController {
  constructor(private readonly parcelService: ParcelService) {}

  // Create parcel (User only)
  @Post()
  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateParcelDto, @User() user: any) {
    return this.parcelService.createParcel({ ...dto, senderId: user.userId });
  }

  // Create parcel comprehensive (User only) - matches frontend structure
  @Post('comprehensive')
  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  createComprehensive(@Body() dto: any, @User() user: any) {
    return this.parcelService.createParcelComprehensive(dto, user.userId);
  }

  // Get all parcels (Admin: all, User: own, Courier: assigned)
  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.COURIER)
  findAll(
    @User() user: UserJwtPayload,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('trackingCode') trackingCode?: string,
  ) {
    // Determine userId and courierId based on role
    let userId: string | undefined = undefined;
    let courierId: string | undefined = undefined;
    if (user?.role === 'USER') userId = user?.userId;
    if (user?.role === 'COURIER') courierId = user?.courierId;
    return this.parcelService.getParcels(
      Number(page),
      Number(limit),
      search,
      status,
      courierId,
      userId,
      user?.role as UserRole,
      trackingCode,
    );
  }

  // Get parcel by ID (Admin: any, User: own, Courier: assigned)
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.COURIER)
  findOne(@Param('id') id: string, @User() user: any) {
    // Add logic to restrict access if needed
    return this.parcelService.getParcelById(id);
  }

  // Update parcel (Admin only)
  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateParcelDto) {
    return this.parcelService.updateParcel(id, dto);
  }

  // Delete parcel (Admin only)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.parcelService.deleteParcel(id);
  }

  // Update status (Admin, Courier)
  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.parcelService.updateStatus(id, dto);
  }

  // Assign courier (Admin only)
  @Put(':id/assign-courier')
  @Roles(UserRole.ADMIN)
  assignCourier(@Param('id') id: string, @Body() dto: AssignCourierDto) {
    return this.parcelService.assignCourier(id, dto);
  }

  /**
   * Calculate pricing for a parcel
   */
  @Post('calculate-pricing')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async calculatePricing(
    @Body()
    body: {
      pickupAddressId: string;
      deliveryAddressId: string;
      weight: number;
      express?: boolean;
      insuranceValue?: number;
    },
  ) {
    return this.parcelService.calculatePricing(
      body.pickupAddressId,
      body.deliveryAddressId,
      body.weight,
      {
        express: body.express,
        insuranceValue: body.insuranceValue,
      },
    );
  }

  /**
   * Get parcel with pricing breakdown
   */
  @Get(':id/pricing')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async getParcelWithPricing(@Param('id') id: string) {
    return this.parcelService.getParcelWithPricing(id);
  }
}
