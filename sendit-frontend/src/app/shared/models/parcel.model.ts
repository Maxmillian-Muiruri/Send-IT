export interface Parcel {
  id: string;
  trackingCode: string;
  senderId: string;
  receiverId: string;
  senderEmail: string;
  receiverEmail: string;
  pickupAddressId: string;
  deliveryAddressId: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  courierId?: string;
  assignedCourierId?: string;
  totalCost: number;
  baseRate?: number;
  weightCharge?: number;
  distanceCharge?: number;
  distanceKm?: number;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Related data (populated by backend)
  sender?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  pickupAddress?: {
    id: string;
    line1?: string;
    street?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  };
  deliveryAddress?: {
    id: string;
    line1?: string;
    street?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  };
  courier?: {
    id: string;
    locationLat?: number;
    locationLng?: number;
    currentLocation?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  assignedCourier?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
} 