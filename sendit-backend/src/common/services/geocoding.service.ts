import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  confidence: number;
}

export interface ReverseGeocodingResult {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
}

interface GoogleGeocodingResponse {
  status: string;
  results?: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

@Injectable()
export class GeocodingService {
  private readonly GOOGLE_MAPS_API_KEY =
    'AIzaSyASNTztjeR-B1lQG2-mqOAuW_puDg_1Xeo';
  private readonly GOOGLE_GEOCODING_BASE_URL =
    'https://maps.googleapis.com/maps/api/geocode/json';
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 100; // Google allows more requests per second

  constructor(private readonly httpService: HttpService) {}

  /**
   * Forward geocoding: Convert address to coordinates using Google Maps API
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest),
        );
      }
      this.lastRequestTime = Date.now();

      const url = this.GOOGLE_GEOCODING_BASE_URL;
      const params = {
        address: address,
        key: this.GOOGLE_MAPS_API_KEY,
        language: 'en',
      };

      const response = await firstValueFrom(
        this.httpService.get<GoogleGeocodingResponse>(url, {
          params,
          timeout: 10000, // 10 second timeout
        }),
      );

      if (
        response.data.status !== 'OK' ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        throw new HttpException(
          `Geocoding failed: ${response.data.status}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        confidence: this.calculateConfidence(result.geometry.location_type),
      };
    } catch (error) {
      console.error('Forward geocoding error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        address,
      });

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Geocoding service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Reverse geocoding: Convert coordinates to address using Google Maps API
   */
  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<ReverseGeocodingResult> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest),
        );
      }
      this.lastRequestTime = Date.now();

      const url = this.GOOGLE_GEOCODING_BASE_URL;
      const params = {
        latlng: `${lat},${lng}`,
        key: this.GOOGLE_MAPS_API_KEY,
        language: 'en',
      };

      const response = await firstValueFrom(
        this.httpService.get<GoogleGeocodingResponse>(url, {
          params,
          timeout: 10000, // 10 second timeout
        }),
      );

      if (
        response.data.status !== 'OK' ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        throw new HttpException(
          `Reverse geocoding failed: ${response.data.status}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const result = response.data.results[0];
      const addressComponents = result.address_components;

      // Extract address components
      const addressData = this.extractAddressComponents(addressComponents);

      return {
        address: addressData.street_number + ' ' + addressData.route,
        city: addressData.locality || addressData.sublocality || '',
        state: addressData.administrative_area_level_1 || '',
        country: addressData.country || '',
        postalCode: addressData.postal_code || '',
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        coordinates: { lat, lng },
      });

      // Return a fallback formatted address based on coordinates
      return {
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        formattedAddress: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  /**
   * Extract address components from Google Maps response
   */
  private extractAddressComponents(components: any[]): any {
    const addressData: any = {};

    components.forEach((component) => {
      const types = component.types;
      const value = component.long_name;

      if (types.includes('street_number')) {
        addressData.street_number = value;
      } else if (types.includes('route')) {
        addressData.route = value;
      } else if (types.includes('locality')) {
        addressData.locality = value;
      } else if (types.includes('sublocality')) {
        addressData.sublocality = value;
      } else if (types.includes('administrative_area_level_1')) {
        addressData.administrative_area_level_1 = value;
      } else if (types.includes('country')) {
        addressData.country = value;
      } else if (types.includes('postal_code')) {
        addressData.postal_code = value;
      }
    });

    return addressData;
  }

  /**
   * Calculate confidence based on Google Maps location type
   */
  private calculateConfidence(locationType: string): number {
    const confidenceMap = {
      ROOFTOP: 1.0,
      RANGE_INTERPOLATED: 0.8,
      GEOMETRIC_CENTER: 0.6,
      APPROXIMATE: 0.4,
    };

    return confidenceMap[locationType] || 0.5;
  }

  /**
   * Batch geocoding for multiple addresses
   */
  async batchGeocode(addresses: string[]): Promise<GeocodingResult[]> {
    const results: GeocodingResult[] = [];

    for (const address of addresses) {
      try {
        const result = await this.geocodeAddress(address);
        results.push(result);
      } catch (error) {
        // Skip failed addresses but continue with others
        console.warn(`Failed to geocode address: ${address}`, error.message);
        results.push({
          lat: 0,
          lng: 0,
          formattedAddress: address,
          confidence: 0,
        });
      }
    }

    return results;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate estimated travel time based on distance and mode
   */
  calculateTravelTime(
    distanceKm: number,
    mode: 'walking' | 'driving' | 'cycling' = 'driving',
  ): number {
    const speeds = {
      walking: 5, // km/h
      cycling: 15, // km/h
      driving: 50, // km/h (urban average)
    };

    return Math.round((distanceKm / speeds[mode]) * 60); // minutes
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get nearby locations within radius using Google Places API
   */
  async getNearbyLocations(
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<any[]> {
    try {
      const url =
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const params = {
        location: `${lat},${lng}`,
        radius: radiusKm * 1000, // Convert to meters
        key: this.GOOGLE_MAPS_API_KEY,
        type: 'establishment',
      };

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params,
          timeout: 10000,
        }),
      );

      if (response.data.status !== 'OK') {
        console.warn(`Places API error: ${response.data.status}`);
        return [];
      }

      return response.data.results || [];
    } catch (error) {
      console.error('Error getting nearby locations:', error);
      return [];
    }
  }
}
