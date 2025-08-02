import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../../generated/prisma';

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;
}
