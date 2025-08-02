import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>('http://localhost:3000/user/profile');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('sendit_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('http://localhost:3000/user');
  }

  addUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>('http://localhost:3000/user/register', user);
  }

  updateUser(id: string, updated: Partial<User>): Observable<User> {
    return this.http.put<User>(`http://localhost:3000/user/${id}`, updated);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`http://localhost:3000/user/${id}`);
  }
} 