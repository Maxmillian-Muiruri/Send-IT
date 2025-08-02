import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../../generated/prisma';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  resetPasswordCode?: string | null;

  @IsOptional()
  resetPasswordCodeExpiry?: Date | null;
}
