import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourierService {
  private apiUrl = `${environment.apiUrl}/courier`;

  constructor(private http: HttpClient) { }

  getCouriers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getCourier(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getCourierProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/me`);
  }

  getCourierStats(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/stats`);
  }

  getCourierAnalytics(id: string, period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/analytics?period=${period}`);
  }

  createCourier(courier: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/comprehensive`, courier);
  }

  updateCourier(id: string, courier: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/comprehensive`, courier);
  }

  updateCourierLocation(id: string, location: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/location`, location);
  }

  updateCourierStatus(id: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteCourier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateLocation(id: string, location: { lat: number; lng: number }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/location`, location);
  }

  assignParcel(courierId: string, parcelId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${courierId}/assign-parcel`, { parcelId });
  }

  getCourierByEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/by-email/${email}`);
  }
}
