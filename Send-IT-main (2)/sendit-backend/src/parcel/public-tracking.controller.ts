import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ParcelService } from './parcel.service';

@Controller('tracking')
export class PublicTrackingController {
  constructor(private readonly parcelService: ParcelService) {}

  // Public tracking endpoint (no authentication required)
  @Get(':trackingCode')
  async trackParcel(@Param('trackingCode') trackingCode: string) {
    try {
      return await this.parcelService.getParcelByTrackingCode(trackingCode);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          'Parcel not found with the provided tracking code',
        );
      }
      throw error;
    }
  }
}
