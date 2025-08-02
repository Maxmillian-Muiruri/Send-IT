import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { CourierStatus } from '../../../generated/prisma';

export class CreateCourierDto {
  @IsString()
  userId: string;

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
