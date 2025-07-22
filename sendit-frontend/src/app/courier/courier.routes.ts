import { Routes } from '@angular/router';
import { Courier } from './courier';
import { CourierDashboard } from './courier-dashboard/courier-dashboard';

export const COURIER_ROUTES: Routes = [
  {
    path: '',
    component: Courier,
    children: [
      { path: '', component: CourierDashboard }
    ]
  }
];
