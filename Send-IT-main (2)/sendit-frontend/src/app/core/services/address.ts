import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/address`;

  constructor(private http: HttpClient) { }

  getMyAddresses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-addresses`);
  }

  createAddress(address: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, address);
  }

  updateAddress(id: string, address: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, address);
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Geocoding methods
  forwardGeocode(address: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/common/geocoding/forward`, {
      address: address
    });
  }

  reverseGeocode(lat: number, lng: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/common/geocoding/reverse?lat=${lat}&lng=${lng}`);
  }

  geocodeAddress(address: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/common/geocoding/forward`, {
      address: address.line1 || address
    });
  }
} 