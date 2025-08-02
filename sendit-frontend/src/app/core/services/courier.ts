import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Courier } from '../../shared/models/courier.model';

@Injectable({
  providedIn: 'root'
})
export class CourierService {
  private apiUrl = 'http://localhost:3000/courier';

  constructor(private http: HttpClient) {}

  // Get all couriers (Admin only)
  getCouriers(page: number = 1, limit: number = 10, search?: string, status?: string): Observable<any> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (search) url += `&search=${search}`;
    if (status) url += `&status=${status}`;
    return this.http.get(url);
  }

  // Get available couriers (Admin only)
  getAvailableCouriers(): Observable<Courier[]> {
    return this.http.get<Courier[]>(`${this.apiUrl}/available`);
  }

  // Get courier by ID
  getCourierById(id: string): Observable<Courier> {
    return this.http.get<Courier>(`${this.apiUrl}/${id}`);
  }

  // Get courier profile (for logged-in courier)
  getCourierProfile(): Observable<Courier> {
    return this.http.get<Courier>(`${this.apiUrl}/profile/me`);
  }

  // Get courier stats
  getCourierStats(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/stats`);
  }

  // Get courier analytics
  getCourierAnalytics(id: string, period: 'week' | 'month' | 'year' = 'month'): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/analytics?period=${period}`);
  }

  // Get performance summary (Admin only)
  getPerformanceSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/summary`);
  }

  // Create courier (Admin only)
  createCourier(courierData: any): Observable<Courier> {
    return this.http.post<Courier>(`${this.apiUrl}/comprehensive`, courierData);
  }

  // Update courier
  updateCourier(id: string, updatedData: Partial<Courier>): Observable<Courier> {
    return this.http.put<Courier>(`${this.apiUrl}/${id}/comprehensive`, updatedData);
  }

  // Update courier location
  updateCourierLocation(id: string, dto: { locationLat: number; locationLng: number; currentLocation?: string }): Observable<Courier> {
    return this.http.put<Courier>(`${this.apiUrl}/${id}/location`, dto);
  }

  // Update courier status
  updateCourierStatus(id: string, status: string): Observable<Courier> {
    return this.http.put<Courier>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Delete courier (Admin only)
  deleteCourier(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Get courier by email (for backward compatibility)
  getCourierByEmail(email: string): Observable<Courier | undefined> {
    return new Observable(observer => {
      this.getCouriers(1, 100).subscribe({
        next: (response) => {
          // Extract couriers array from response object
          const couriers = response.couriers || response;
          const courier = couriers?.find((c: Courier) => c.user?.email === email);
          observer.next(courier);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}
