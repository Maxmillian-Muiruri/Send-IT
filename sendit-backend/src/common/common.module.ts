import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { GeocodingService } from './services/geocoding.service';
import { PricingService } from './services/pricing.service';
import { EmailService } from './services/email.service';
import { AnalyticsService } from './services/analytics.service';
import { TrackingGateway } from './gateways/tracking.gateway';
import { GeocodingController } from './controllers/geocoding.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [GeocodingController, AnalyticsController],
  providers: [
    GeocodingService,
    PricingService,
    EmailService,
    AnalyticsService,
    TrackingGateway,
  ],
  exports: [
    GeocodingService,
    PricingService,
    EmailService,
    AnalyticsService,
    TrackingGateway,
  ],
})
export class CommonModule {}
