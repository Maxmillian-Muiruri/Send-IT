import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

export class DimensionsDto {
  @IsNumber()
  length: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class CreateParcelComprehensiveDto {
  @IsString()
  receiverEmail: string;

  @IsString()
  receiverName: string;

  @IsString()
  receiverPhone: string;

  @IsNumber()
  weight: number;

  @IsObject()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions: DimensionsDto;

  @IsString()
  description: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  pickupAddress: AddressDto;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress: AddressDto;
}
