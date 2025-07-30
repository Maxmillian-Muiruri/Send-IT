export interface Courier {
  id: string;
  userId: string;
  vehicleType?: string;
  licensePlate?: string;
  locationLat?: number;
  locationLng?: number;
  currentLocation?: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_DELIVERY';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Related data (populated by backend)
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  assignedParcels?: any[];
  notifications?: any[];
}

// For backward compatibility
export interface CourierLocation {
  lat: number;
  lng: number;
} 