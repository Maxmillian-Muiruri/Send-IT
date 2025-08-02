import { Module } from '@nestjs/common';
import { ParcelController } from './parcel.controller';
import { PublicTrackingController } from './public-tracking.controller';
import { ParcelService } from './parcel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, CommonModule, NotificationModule],
  controllers: [ParcelController, PublicTrackingController],
  providers: [ParcelService],
  exports: [ParcelService],
})
export class ParcelModule {}
