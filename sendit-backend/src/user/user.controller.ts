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
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { User } from '../common/decorators/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Public registration endpoint
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  // Get all users (Admin only)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return await this.userService.findAll(
      parseInt(page),
      parseInt(limit),
      role,
      search,
    );
  }

  // Get user by ID (Admin or own profile)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findById(@Param('id') id: string, @User() currentUser: any) {
    // Users can only view their own profile, admins can view any profile
    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== id) {
      throw new BadRequestException('Access denied');
    }
    return await this.userService.findById(id);
  }

  // Get current user profile
  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() currentUser: any) {
    return await this.userService.findById(currentUser.userId);
  }

  // Update user (Admin or own profile)
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
    @User() currentUser: any,
  ) {
    // Users can only update their own profile, admins can update any profile
    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== id) {
      throw new BadRequestException('Access denied');
    }

    // Non-admin users cannot change their role
    if (currentUser.role !== UserRole.ADMIN && updateData.role) {
      delete updateData.role;
    }

    return await this.userService.updateUser(id, updateData);
  }

  // Update current user profile
  @Put('profile/me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() updateData: UpdateUserDto,
    @User() currentUser: any,
  ) {
    // Users cannot change their role through profile update
    if (updateData.role) {
      delete updateData.role;
    }

    return await this.userService.updateUser(currentUser.userId, updateData);
  }

  // Soft delete user (Admin only)
  @Delete(':id/soft')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDeleteUser(@Param('id') id: string) {
    await this.userService.softDeleteUser(id);
    return { message: 'User soft deleted successfully' };
  }

  // Hard delete user (Admin only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  // Get users by role (Admin only)
  @Get('role/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findByRole(@Param('role') role: UserRole) {
    return await this.userService.findByRole(role);
  }

  // Get couriers (Admin only)
  @Get('couriers/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllCouriers() {
    return await this.userService.findByRole(UserRole.COURIER);
  }

  // Get regular users (Admin only)
  @Get('users/regular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRegularUsers() {
    return await this.userService.findByRole(UserRole.USER);
  }
}
