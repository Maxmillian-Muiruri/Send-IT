import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔐 Auth interceptor called for URL:', req.url);
    console.log('🔐 Request method:', req.method);

    // Check if this is a backend request
    const isBackendRequest = req.url.includes(environment.apiUrl) || req.url.includes('api/');
    
    if (isBackendRequest) {
      console.log('🔐 PARCEL REQUEST DETECTED!');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log('🔐 Token found:', token ? 'YES' : 'NO');
      console.log('🔐 Token value:', token ? token.substring(0, 20) + '...' : 'NONE');
      console.log('🔐 Full token:', token);

      if (token) {
        // Clone the request and add the authorization header
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('🔐 Adding Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        console.log('🔐 Modified request headers:', authReq.headers);
        
        return next.handle(authReq);
      }
    }

    return next.handle(req);
  }
}
