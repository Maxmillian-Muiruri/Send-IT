import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
  data?: any;
  priority?: string;
  emailSent?: boolean;
  parcel?: {
    trackingCode: string;
    description: string;
  };
  courier?: {
    user: {
      name: string;
    };
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/notifications';

  constructor(private http: HttpClient) { }

  // Get all notifications for the current user
  getNotifications(page: number = 1, limit: number = 10): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  // Get unread notifications count
  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`);
  }

  // Mark a notification as read
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/mark-all-read`, {});
  }

  // Delete a notification
  deleteNotification(notificationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${notificationId}`);
  }

  // Get notification statistics
  getNotificationStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
