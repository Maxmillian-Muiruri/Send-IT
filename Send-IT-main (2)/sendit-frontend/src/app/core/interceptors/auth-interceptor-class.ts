import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptorClass implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('Class-based Auth interceptor called for URL:', req.url);
    
    // Check for token in both possible locations
    const token = localStorage.getItem('sendit_access_token') || localStorage.getItem('token');
    console.log('Token found:', token ? 'YES' : 'NO');
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (token) {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      console.log('Adding Authorization header');
      return next.handle(authReq);
    }
    console.log('No token found, proceeding without Authorization header');
    return next.handle(req);
  }
} 