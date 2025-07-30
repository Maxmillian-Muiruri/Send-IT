import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from "rxjs/operators";
import { Parcel } from '../../shared/models/parcel.model';

@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  private apiUrl = 'http://localhost:3000/parcel';

  constructor(private http: HttpClient) {}

  // Get all parcels (with optional filters)
  getParcels(filters?: any): Observable<Parcel[]> {
    let url = this.apiUrl;
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });
      url += `?${params.toString()}`;
    }
    return this.http.get<any>(url).pipe(
      map(response => response.parcels || [])
    );
  }

  // Get parcel by ID
  getParcelById(id: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/${id}`);
  }

  // Create new parcel
  createParcel(parcelData: any): Observable<Parcel> {
    return this.http.post<Parcel>(`${this.apiUrl}/comprehensive`, parcelData);
  }

  // Update parcel
  updateParcel(id: string, updatedData: Partial<Parcel>): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${id}`, updatedData);
  }

  // Delete parcel
  deleteParcel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Update parcel status
  updateParcelStatus(id: string, status: string, notes?: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  // Assign courier to parcel
  assignParcelToCourier(parcelId: string, courierId: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${parcelId}/assign-courier`, { courierId });
  }

  // Calculate pricing for a parcel
  calculatePricing(parcelData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/calculate-pricing`, parcelData);
  }

  // Get parcel pricing
  getParcelPricing(parcelId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${parcelId}/pricing`);
  }

  // Get parcels by user (sent/received)
  getParcelsByUser(userId: string): Observable<Parcel[]> {
    return this.http.get<any>(`${this.apiUrl}?senderId=${userId}&receiverId=${userId}`).pipe(
      map(response => response.parcels || [])
    );
  }

  // Get parcels sent by user
  getParcelsSentByUser(userId: string): Observable<Parcel[]> {
    return this.http.get<any>(`${this.apiUrl}?senderId=${userId}`).pipe(
      map(response => response.parcels || [])
    );
  }

  // Get parcels received by user
  getParcelsReceivedByUser(userId: string): Observable<Parcel[]> {
    return this.http.get<any>(`${this.apiUrl}?receiverId=${userId}`).pipe(
      map(response => response.parcels || [])
    );
  }

  // Get parcels assigned to courier
  getParcelsByCourier(courierId: string): Observable<Parcel[]> {
    return this.http.get<any>(`${this.apiUrl}?assignedCourierId=${courierId}`).pipe(
      map(response => response.parcels || [])
    );
  }

  // Track parcel by ID
  trackParcel(parcelId: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/${parcelId}`);
  }

  // Public tracking by tracking code (no authentication required)
  trackParcelByCode(trackingCode: string): Observable<Parcel> {
    return this.http.get<Parcel>(`http://localhost:3000/tracking/${trackingCode}`);
  }
}
