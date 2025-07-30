import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateParcelDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  pickupAddressId?: string;

  @IsOptional()
  @IsString()
  deliveryAddressId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  courierId?: string;
}
