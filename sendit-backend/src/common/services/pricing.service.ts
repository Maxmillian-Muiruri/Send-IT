import { Injectable } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

export interface PricingConfig {
  baseRate: number; // Base delivery fee
  weightRate: number; // Rate per kg
  distanceRate: number; // Rate per km
  expressMultiplier: number; // Express delivery multiplier
  insuranceRate: number; // Insurance rate per $100 value
  fuelSurcharge: number; // Fuel surcharge percentage
}

export interface PricingResult {
  baseRate: number;
  weightCharge: number;
  distanceCharge: number;
  fuelSurcharge: number;
  insuranceCharge: number;
  expressCharge: number;
  subtotal: number;
  totalCost: number;
  distanceKm: number;
  estimatedDeliveryTime: number; // minutes
  breakdown: {
    item: string;
    amount: number;
    description: string;
  }[];
}

@Injectable()
export class PricingService {
  private readonly defaultConfig: PricingConfig = {
    baseRate: 5.0, // $5 base fee
    weightRate: 2.0, // $2 per kg
    distanceRate: 0.1, // $0.10 per km
    expressMultiplier: 1.5, // 50% more for express
    insuranceRate: 0.5, // $0.50 per $100 value
    fuelSurcharge: 0.05, // 5% fuel surcharge
  };

  constructor(private readonly geocodingService: GeocodingService) {}

  /**
   * Calculate parcel pricing based on addresses and weight
   */
  async calculatePricing(
    pickupAddress: string,
    deliveryAddress: string,
    weight: number,
    options: {
      express?: boolean;
      insuranceValue?: number;
      config?: Partial<PricingConfig>;
    } = {},
  ): Promise<PricingResult> {
    const config = { ...this.defaultConfig, ...options.config };

    // Geocode addresses to get coordinates
    const [pickupCoords, deliveryCoords] = await Promise.all([
      this.geocodingService.geocodeAddress(pickupAddress),
      this.geocodingService.geocodeAddress(deliveryAddress),
    ]);

    // Calculate distance
    const distanceKm = this.geocodingService.calculateDistance(
      pickupCoords.lat,
      pickupCoords.lng,
      deliveryCoords.lat,
      deliveryCoords.lng,
    );

    // Calculate estimated delivery time
    const estimatedDeliveryTime =
      this.geocodingService.calculateTravelTime(distanceKm);

    // Calculate pricing components
    const baseRate = config.baseRate;
    const weightCharge = weight * config.weightRate;
    const distanceCharge = distanceKm * config.distanceRate;
    const fuelSurcharge =
      (baseRate + weightCharge + distanceCharge) * config.fuelSurcharge;
    const insuranceCharge = options.insuranceValue
      ? (options.insuranceValue / 100) * config.insuranceRate
      : 0;
    const expressCharge = options.express
      ? (baseRate + weightCharge + distanceCharge) *
        (config.expressMultiplier - 1)
      : 0;

    const subtotal =
      baseRate +
      weightCharge +
      distanceCharge +
      fuelSurcharge +
      insuranceCharge +
      expressCharge;
    const totalCost = Math.round(subtotal * 100) / 100; // Round to 2 decimal places

    const breakdown = [
      {
        item: 'Base Rate',
        amount: baseRate,
        description: 'Standard delivery fee',
      },
      {
        item: 'Weight Charge',
        amount: weightCharge,
        description: `${weight}kg × $${config.weightRate}/kg`,
      },
      {
        item: 'Distance Charge',
        amount: distanceCharge,
        description: `${Math.round(distanceKm)}km × $${config.distanceRate}/km`,
      },
      {
        item: 'Fuel Surcharge',
        amount: fuelSurcharge,
        description: `${config.fuelSurcharge * 100}% of base charges`,
      },
    ];

    if (insuranceCharge > 0) {
      breakdown.push({
        item: 'Insurance',
        amount: insuranceCharge,
        description: `$${options.insuranceValue} value × $${config.insuranceRate}/$100`,
      });
    }

    if (expressCharge > 0) {
      breakdown.push({
        item: 'Express Delivery',
        amount: expressCharge,
        description: 'Priority delivery service',
      });
    }

    return {
      baseRate,
      weightCharge,
      distanceCharge,
      fuelSurcharge,
      insuranceCharge,
      expressCharge,
      subtotal,
      totalCost,
      distanceKm: Math.round(distanceKm * 100) / 100,
      estimatedDeliveryTime,
      breakdown,
    };
  }

  /**
   * Calculate pricing based on coordinates (for existing addresses)
   */
  calculatePricingFromCoordinates(
    pickupCoords: { lat: number; lng: number },
    deliveryCoords: { lat: number; lng: number },
    weight: number,
    options: {
      express?: boolean;
      insuranceValue?: number;
      config?: Partial<PricingConfig>;
    } = {},
  ): PricingResult {
    const config = { ...this.defaultConfig, ...options.config };

    // Calculate distance
    const distanceKm = this.geocodingService.calculateDistance(
      pickupCoords.lat,
      pickupCoords.lng,
      deliveryCoords.lat,
      deliveryCoords.lng,
    );

    // Calculate estimated delivery time
    const estimatedDeliveryTime =
      this.geocodingService.calculateTravelTime(distanceKm);

    // Calculate pricing components
    const baseRate = config.baseRate;
    const weightCharge = weight * config.weightRate;
    const distanceCharge = distanceKm * config.distanceRate;
    const fuelSurcharge =
      (baseRate + weightCharge + distanceCharge) * config.fuelSurcharge;
    const insuranceCharge = options.insuranceValue
      ? (options.insuranceValue / 100) * config.insuranceRate
      : 0;
    const expressCharge = options.express
      ? (baseRate + weightCharge + distanceCharge) *
        (config.expressMultiplier - 1)
      : 0;

    const subtotal =
      baseRate +
      weightCharge +
      distanceCharge +
      fuelSurcharge +
      insuranceCharge +
      expressCharge;
    const totalCost = Math.round(subtotal * 100) / 100;

    const breakdown = [
      {
        item: 'Base Rate',
        amount: baseRate,
        description: 'Standard delivery fee',
      },
      {
        item: 'Weight Charge',
        amount: weightCharge,
        description: `${weight}kg × $${config.weightRate}/kg`,
      },
      {
        item: 'Distance Charge',
        amount: distanceCharge,
        description: `${Math.round(distanceKm)}km × $${config.distanceRate}/km`,
      },
      {
        item: 'Fuel Surcharge',
        amount: fuelSurcharge,
        description: `${config.fuelSurcharge * 100}% of base charges`,
      },
    ];

    if (insuranceCharge > 0) {
      breakdown.push({
        item: 'Insurance',
        amount: insuranceCharge,
        description: `$${options.insuranceValue} value × $${config.insuranceRate}/$100`,
      });
    }

    if (expressCharge > 0) {
      breakdown.push({
        item: 'Express Delivery',
        amount: expressCharge,
        description: 'Priority delivery service',
      });
    }

    return {
      baseRate,
      weightCharge,
      distanceCharge,
      fuelSurcharge,
      insuranceCharge,
      expressCharge,
      subtotal,
      totalCost,
      distanceKm: Math.round(distanceKm * 100) / 100,
      estimatedDeliveryTime,
      breakdown,
    };
  }

  /**
   * Get pricing configuration
   */
  getPricingConfig(): PricingConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update pricing configuration
   */
  updatePricingConfig(newConfig: Partial<PricingConfig>): PricingConfig {
    Object.assign(this.defaultConfig, newConfig);
    return { ...this.defaultConfig };
  }

  /**
   * Calculate zone-based pricing (for different regions)
   */
  calculateZonePricing(
    pickupZone: string,
    deliveryZone: string,
    weight: number,
    baseConfig: PricingConfig = this.defaultConfig,
  ): PricingResult {
    // Zone multipliers (example)
    const zoneMultipliers: { [key: string]: number } = {
      local: 1.0, // Same city
      regional: 1.2, // Same state/province
      national: 1.5, // Same country
      international: 2.0, // Different country
    };

    // Determine zone type based on pickup/delivery
    const zoneType = this.determineZoneType(pickupZone, deliveryZone);
    const multiplier = zoneMultipliers[zoneType] || 1.0;

    // Apply zone multiplier to base rate and distance rate
    const config: PricingConfig = {
      ...baseConfig,
      baseRate: baseConfig.baseRate * multiplier,
      distanceRate: baseConfig.distanceRate * multiplier,
    };

    // Use a default distance for zone-based pricing
    const defaultDistances = {
      local: 20,
      regional: 150,
      national: 800,
      international: 2000,
    };

    const distanceKm = defaultDistances[zoneType] || 100;

    return this.calculatePricingFromCoordinates(
      { lat: 0, lng: 0 }, // Dummy coordinates
      { lat: 0, lng: 0 },
      weight,
      { config },
    );
  }

  private determineZoneType(pickupZone: string, deliveryZone: string): string {
    // Simple zone determination logic
    if (pickupZone === deliveryZone) return 'local';
    if (
      pickupZone.includes('same-state') ||
      deliveryZone.includes('same-state')
    )
      return 'regional';
    if (
      pickupZone.includes('same-country') ||
      deliveryZone.includes('same-country')
    )
      return 'national';
    return 'international';
  }
}
