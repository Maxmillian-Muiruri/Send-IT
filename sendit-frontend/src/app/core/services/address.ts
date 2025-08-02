import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private apiUrl = 'http://localhost:3000/address';

  constructor(private http: HttpClient) {}

  // Create address
  createAddress(address: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, address);
  }

  // Get all addresses (admin only)
  getAllAddresses(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}`, { params });
  }

  // Get user's addresses
  getMyAddresses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-addresses`);
  }

  // Get address by ID
  getAddressById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Update address
  updateAddress(id: string, address: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, address);
  }

  // Delete address
  deleteAddress(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Geocode address (get coordinates)
  geocodeAddress(address: any): Observable<any> {
    return this.http.post('http://localhost:3000/common/geocoding/forward', {
      address: address.line1
    });
  }

  // Validate address
  validateAddress(address: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate`, address);
  }

  // Calculate distance between two addresses
  calculateDistance(address1Id: string, address2Id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/distance/${address1Id}/${address2Id}`);
  }

  // Find nearby addresses
  findNearbyAddresses(lat: number, lng: number, radius: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Get address statistics (admin only)
  getAddressStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/overview`);
  }
} 