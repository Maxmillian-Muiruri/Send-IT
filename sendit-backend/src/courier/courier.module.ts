import { Module } from '@nestjs/common';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CourierController],
  providers: [CourierService],
  exports: [CourierService],
})
export class CourierModule {}
