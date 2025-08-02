import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CourierModule } from './courier/courier.module';
import { ParcelModule } from './parcel/parcel.module';
import { AddressModule } from './address/address.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UserModule,
    CourierModule,
    ParcelModule,
    AddressModule,
    NotificationModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
