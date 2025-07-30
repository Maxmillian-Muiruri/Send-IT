import { IsNumber, IsString, IsOptional } from 'class-validator';

export class LocationUpdateDto {
  @IsNumber()
  locationLat: number;

  @IsNumber()
  locationLng: number;

  @IsOptional()
  @IsString()
  currentLocation?: string;
}
