import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

// Functional interceptor for Angular 16+
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  console.log('🔐 Auth interceptor called for URL:', req.url);
  console.log('🔐 Request method:', req.method);

  // Check if this is a backend request
  const isBackendRequest = req.url.includes(environment.apiUrl) || req.url.includes('api/');
  
  if (isBackendRequest) {
    console.log('🔐 PARCEL REQUEST DETECTED!');
    
    // Get token from localStorage - check both possible keys
    const token = localStorage.getItem('token') || localStorage.getItem('sendit_access_token');
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
      
      return next(authReq);
    }
  }

  return next(req);
};

// Legacy class-based interceptor (for backward compatibility)
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Convert HttpHandler to HttpHandlerFn for the functional interceptor
    const handlerFn: HttpHandlerFn = (request) => next.handle(request);
    return authInterceptor(req, handlerFn);
  }
}
