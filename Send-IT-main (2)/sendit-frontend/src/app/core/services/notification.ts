import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  read: boolean; // Add this for backward compatibility
  createdAt: string;
  userId: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) { }

  getNotifications(page: number = 1, limit: number = 10): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/mark-all-read`, {});
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }
}
