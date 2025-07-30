import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole } from '../../generated/prisma';

interface UserJwtPayload {
  userId?: string;
  role?: string;
}

@Controller('address')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  // Create address
  @Post()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @Body() dto: CreateAddressDto,
    @User() user: UserJwtPayload,
  ) {
    // If user is not admin, set the userId to their own ID
    if (user?.role === 'USER' && !dto.userId) {
      dto.userId = user.userId;
    }
    return this.addressService.createAddress(dto);
  }

  // Get all addresses (Admin only)
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.addressService.findAll(Number(page), Number(limit), search);
  }

  // Get user's addresses
  @Get('my-addresses')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getMyAddresses(@User() user: UserJwtPayload) {
    if (!user?.userId) {
      throw new Error('User ID not found');
    }
    return this.addressService.findByUserId(user.userId);
  }

  // Get address by ID
  @Get(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async findById(@Param('id') id: string, @User() user: UserJwtPayload) {
    const address = await this.addressService.findById(id);

    // If user is not admin, they can only see their own addresses
    if (user?.role === 'USER' && address.userId !== user.userId) {
      throw new Error('Access denied');
    }

    return address;
  }

  // Update address
  @Put(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async updateAddress(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @User() user: UserJwtPayload,
  ) {
    const address = await this.addressService.findById(id);

    // If user is not admin, they can only update their own addresses
    if (user?.role === 'USER' && address.userId !== user.userId) {
      throw new Error('Access denied');
    }

    return this.addressService.updateAddress(id, dto);
  }

  // Delete address
  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(@Param('id') id: string, @User() user: UserJwtPayload) {
    const address = await this.addressService.findById(id);

    // If user is not admin, they can only delete their own addresses
    if (user?.role === 'USER' && address.userId !== user.userId) {
      throw new Error('Access denied');
    }

    return this.addressService.deleteAddress(id);
  }

  // Calculate distance between two addresses
  @Get('distance/:address1Id/:address2Id')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async calculateDistance(
    @Param('address1Id') address1Id: string,
    @Param('address2Id') address2Id: string,
  ) {
    return this.addressService.calculateDistance(address1Id, address2Id);
  }

  // Find nearby addresses
  @Get('nearby')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async findNearbyAddresses(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '10',
  ) {
    return this.addressService.findNearbyAddresses(
      Number(lat),
      Number(lng),
      Number(radius),
    );
  }

  // Get address statistics (Admin only)
  @Get('stats/overview')
  @Roles(UserRole.ADMIN)
  async getAddressStats() {
    return this.addressService.getAddressStats();
  }

  // Validate address format
  @Post('validate')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async validateAddress(@Body() addressData: any) {
    try {
      // This will throw an error if the address is invalid
      this.addressService['validateAddress'](addressData);

      // If validation passes, return success
      return {
        valid: true,
        message: 'Address format is valid',
        formattedAddress: this.addressService['formatAddress'](addressData),
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        errors: error.message,
      };
    }
  }

  // Geocode address (get coordinates)
  @Post('geocode')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async geocodeAddress(@Body() addressData: any) {
    try {
      const coordinates =
        await this.addressService['geocodeAddress'](addressData);
      const formattedAddress =
        this.addressService['formatAddress'](addressData);

      return {
        coordinates,
        formattedAddress,
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
