import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { CourierStatus } from '../../../generated/prisma';

export class CreateCourierComprehensiveDto {
  // User details
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Courier details
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
