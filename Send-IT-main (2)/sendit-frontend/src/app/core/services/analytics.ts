import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}

export interface ParcelAnalytics {
  totalParcels: number;
  deliveredParcels: number;
  inTransitParcels: number;
  pendingParcels: number;
  cancelledParcels: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  revenue: number;
  averageParcelValue: number;
  topRoutes: Array<{
    route: string;
    count: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;
    parcels: number;
    revenue: number;
    delivered: number;
  }>;
}

export interface CourierAnalytics {
  totalCouriers: number;
  activeCouriers: number;
  totalDeliveries: number;
  averageDeliveriesPerCourier: number;
  topPerformers: Array<{
    courierId: string;
    courierName: string;
    deliveries: number;
    revenue: number;
    rating: number;
  }>;
  courierEfficiency: Array<{
    courierId: string;
    courierName: string;
    efficiency: number;
    averageDeliveryTime: number;
  }>;
  courierStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    parcelsSent: number;
    parcelsReceived: number;
    totalSpent: number;
  }>;
  userActivity: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    parcels: number;
  }>;
  revenueByStatus: Array<{
    status: string;
    revenue: number;
    percentage: number;
  }>;
  topRevenueRoutes: Array<{
    route: string;
    revenue: number;
    parcels: number;
  }>;
}

export interface SystemAnalytics {
  totalNotifications: number;
  unreadNotifications: number;
  notificationStats: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  systemPerformance: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface DashboardReport {
  parcelAnalytics: ParcelAnalytics;
  courierAnalytics: CourierAnalytics;
  userAnalytics: UserAnalytics;
  revenueAnalytics: RevenueAnalytics;
  systemAnalytics: SystemAnalytics;
  generatedAt: string;
  period: AnalyticsPeriod;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) { }

  // Get comprehensive dashboard report
  getDashboardReport(period?: AnalyticsPeriod): Observable<DashboardReport> {
    let url = `${this.apiUrl}/dashboard`;
    if (period) {
      url += `?startDate=${period.startDate.toISOString()}&endDate=${period.endDate.toISOString()}`;
    }
    return this.http.get<DashboardReport>(url);
  }

  // Get parcel analytics
  getParcelAnalytics(period?: AnalyticsPeriod): Observable<ParcelAnalytics> {
    let url = `${this.apiUrl}/parcels`;
    if (period) {
      url += `?startDate=${period.startDate.toISOString()}&endDate=${period.endDate.toISOString()}`;
    }
    return this.http.get<ParcelAnalytics>(url);
  }

  // Get courier analytics
  getCourierAnalytics(period?: AnalyticsPeriod): Observable<CourierAnalytics> {
    let url = `${this.apiUrl}/couriers`;
    if (period) {
      url += `?startDate=${period.startDate.toISOString()}&endDate=${period.endDate.toISOString()}`;
    }
    return this.http.get<CourierAnalytics>(url);
  }

  // Get user analytics
  getUserAnalytics(period?: AnalyticsPeriod): Observable<UserAnalytics> {
    let url = `${this.apiUrl}/users`;
    if (period) {
      url += `?startDate=${period.startDate.toISOString()}&endDate=${period.endDate.toISOString()}`;
    }
    return this.http.get<UserAnalytics>(url);
  }

  // Get revenue analytics
  getRevenueAnalytics(period?: AnalyticsPeriod): Observable<RevenueAnalytics> {
    let url = `${this.apiUrl}/revenue`;
    if (period) {
      url += `?startDate=${period.startDate.toISOString()}&endDate=${period.endDate.toISOString()}`;
    }
    return this.http.get<RevenueAnalytics>(url);
  }

  // Get system analytics
  getSystemAnalytics(): Observable<SystemAnalytics> {
    return this.http.get<SystemAnalytics>(`${this.apiUrl}/system`);
  }

  // Export report
  exportReport(
    type: string,
    format: 'csv' | 'json' = 'json',
    period?: AnalyticsPeriod
  ): Observable<any> {
    let url = `${this.apiUrl}/reports/export?type=${type}&format=${format}`;
    if (period) {
      url += `&startDate=${period.startDate.toISOString()}&endDate=${period.endDate.toISOString()}`;
    }
    return this.http.get(url);
  }

  // Helper method to create date period
  createPeriod(days: number): AnalyticsPeriod {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
  }

  // Helper method to create month period
  createMonthPeriod(months: number): AnalyticsPeriod {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    return { startDate, endDate };
  }

  // Helper method to create custom period
  createCustomPeriod(startDate: Date, endDate: Date): AnalyticsPeriod {
    return { startDate, endDate };
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  getRevenueStats(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/revenue?period=${period}`);
  }

  getParcelStats(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/parcels?period=${period}`);
  }

  getCourierStats(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/couriers?period=${period}`);
  }

  getUserStats(period: string = 'month'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users?period=${period}`);
  }

  getTopRoutes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/top-routes`);
  }

  getPerformanceMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/performance`);
  }
} 