import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateParcelDto {
  @IsString()
  senderId: string;

  @IsString()
  receiverId: string;

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
}
