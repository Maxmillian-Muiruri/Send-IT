import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  formattedAddress?: string;
}
