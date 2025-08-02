export interface Courier {
  id: string;
  name: string;
  email: string;
  location?: { lat: number; lng: number };
  // Add any other fields you need
} 