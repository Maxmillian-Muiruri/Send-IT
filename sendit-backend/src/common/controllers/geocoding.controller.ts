import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { GeocodingService } from '../services/geocoding.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('common/geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  /**
   * Forward geocoding: Convert address to coordinates
   */
  @Post('forward')
  async geocodeAddress(@Body() body: { address: string }) {
    return this.geocodingService.geocodeAddress(body.address);
  }

  /**
   * Reverse geocoding: Convert coordinates to address
   */
  @Get('reverse')
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates');
    }

    return this.geocodingService.reverseGeocode(latitude, longitude);
  }

  /**
   * Batch geocoding for multiple addresses
   */
  @Post('batch')
  async batchGeocode(@Body() body: { addresses: string[] }) {
    return this.geocodingService.batchGeocode(body.addresses);
  }

  /**
   * Calculate distance between two points
   */
  @Get('distance')
  async calculateDistance(
    @Query('lat1') lat1: string,
    @Query('lng1') lng1: string,
    @Query('lat2') lat2: string,
    @Query('lng2') lng2: string,
  ) {
    const lat1Num = parseFloat(lat1);
    const lng1Num = parseFloat(lng1);
    const lat2Num = parseFloat(lat2);
    const lng2Num = parseFloat(lng2);

    if (isNaN(lat1Num) || isNaN(lng1Num) || isNaN(lat2Num) || isNaN(lng2Num)) {
      throw new Error('Invalid coordinates');
    }

    const distance = this.geocodingService.calculateDistance(
      lat1Num,
      lng1Num,
      lat2Num,
      lng2Num,
    );
    const travelTime = this.geocodingService.calculateTravelTime(distance);

    return {
      distance: Math.round(distance * 100) / 100, // km
      distanceMiles: Math.round(distance * 0.621371 * 100) / 100,
      estimatedTravelTime: travelTime, // minutes
      coordinates: {
        point1: { lat: lat1Num, lng: lng1Num },
        point2: { lat: lat2Num, lng: lng2Num },
      },
    };
  }

  /**
   * Get nearby locations
   */
  @Get('nearby')
  async getNearbyLocations(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '10',
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates');
    }

    return this.geocodingService.getNearbyLocations(
      latitude,
      longitude,
      radiusKm,
    );
  }

  /**
   * Validate coordinates
   */
  @Get('validate')
  async validateCoordinates(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const isValid = this.geocodingService.validateCoordinates(
      latitude,
      longitude,
    );

    return {
      valid: isValid,
      coordinates: { lat: latitude, lng: longitude },
      message: isValid ? 'Valid coordinates' : 'Invalid coordinates',
    };
  }
}
