import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { CourierStatus } from '../../../generated/prisma';

export class UpdateCourierComprehensiveDto {
  // User fields
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Courier fields
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsString()
  currentLocation?: string;

  @IsOptional()
  @IsEnum(CourierStatus)
  status?: CourierStatus;
}
