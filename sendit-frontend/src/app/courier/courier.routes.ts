import { Routes } from '@angular/router';
import { Courier } from './courier';
import { CourierDashboardComponent } from './courier-dashboard/courier-dashboard';

export const COURIER_ROUTES: Routes = [
  {
    path: '',
    component: Courier,
    children: [
      { path: '', component: CourierDashboardComponent }
    ]
  }
];
