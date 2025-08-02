import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) { }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/me`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }

  addUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }

  updateUser(id: string, updated: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, updated);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}