import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔐 Auth interceptor called for URL:', req.url);
  console.log('🔐 Request method:', req.method);
  
  // Only add Authorization header for requests to our backend API
  const isBackendRequest = req.url.includes('localhost:3000') || req.url.includes('api/');
  
  if (!isBackendRequest) {
    console.log('🔐 External API request detected, skipping Authorization header');
    return next(req);
  }
  
  // Test if interceptor is being called
  if (req.url.includes('parcel')) {
    console.log('🔐 PARCEL REQUEST DETECTED!');
  }
  
  // Check for token in both possible locations
  const token = localStorage.getItem('sendit_access_token') || localStorage.getItem('token');
  console.log('🔐 Token found:', token ? 'YES' : 'NO');
  console.log('🔐 Token value:', token ? token.substring(0, 20) + '...' : 'null');
  console.log('🔐 Full token:', token);
  
  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    console.log('🔐 Adding Authorization header:', `Bearer ${token.substring(0, 20)}...`);
    console.log('🔐 Modified request headers:', authReq.headers);
    return next(authReq);
  }
  console.log('🔐 No token found, proceeding without Authorization header');
  return next(req);
};
