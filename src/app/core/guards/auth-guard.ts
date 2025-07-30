import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/auth/login'; // Not logged in, redirect to login
    return false;
  }
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      localStorage.removeItem('token');
      localStorage.removeItem('sendit_user');
      window.location.href = '/auth/login'; // Token expired
      return false;
    }
    const userStr = localStorage.getItem('sendit_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const requiredRole = route.data && route.data['role'];
    if (requiredRole && user && user.role !== requiredRole) {
      window.location.href = '/'; // Wrong role, redirect to landing
      return false;
    }
    return true;
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('sendit_user');
    window.location.href = '/auth/login';
    return false;
  }
}; 