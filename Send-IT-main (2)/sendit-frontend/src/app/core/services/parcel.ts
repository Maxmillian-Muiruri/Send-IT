import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Parcel } from '../../shared/models/parcel.model';

@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  private apiUrl = `${environment.apiUrl}/parcel`;

  constructor(private http: HttpClient) { }

  // Get all parcels
  getParcels(params?: any): Observable<{ parcels: Parcel[], pagination: any }> {
    let url = this.apiUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key].toString());
        }
      });
      url += `?${queryParams.toString()}`;
    }
    return this.http.get<{ parcels: Parcel[], pagination: any }>(url);
  }

  // Get parcel by ID
  getParcelById(id: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/${id}`);
  }

  // Create parcel
  createParcel(parcel: any): Observable<Parcel> {
    return this.http.post<Parcel>(this.apiUrl, parcel);
  }

  // Create comprehensive parcel (with addresses)
  createParcelComprehensive(parcelData: any): Observable<Parcel> {
    return this.http.post<Parcel>(`${this.apiUrl}/comprehensive`, parcelData);
  }

  // Update parcel
  updateParcel(id: string, parcel: any): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${id}`, parcel);
  }

  // Delete parcel
  deleteParcel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Update parcel status
  updateStatus(id: string, status: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Update parcel status (alias for updateStatus)
  updateParcelStatus(id: string, status: string): Observable<Parcel> {
    return this.updateStatus(id, status);
  }

  // Assign courier to parcel
  assignCourierToParcel(parcelId: string, courierId: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${parcelId}/assign-courier`, { courierId });
  }

  // Assign parcel to courier (alias for assignCourierToParcel)
  assignParcelToCourier(parcelId: string, courierId: string): Observable<Parcel> {
    return this.assignCourierToParcel(parcelId, courierId);
  }

  // Calculate pricing
  calculatePricing(pickupAddressId: string, deliveryAddressId: string, weight: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calculate-pricing`, {
      pickupAddressId,
      deliveryAddressId,
      weight
    });
  }

  // Get parcel with pricing
  getParcelWithPricing(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/pricing`);
  }

  // Public tracking by tracking code (no authentication required)
  trackParcelByCode(trackingCode: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${environment.apiUrl}/tracking/${trackingCode}`);
  }
}
