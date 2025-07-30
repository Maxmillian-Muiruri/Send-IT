import { Routes } from '@angular/router';
import { Admin } from './admin';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { CreateParcel } from './create-parcel/create-parcel';
import { UpdateStatus } from './update-status/update-status';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: Admin,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'create-parcel', component: CreateParcel },
      { path: 'update-status', component: UpdateStatus },
      { path: 'analytics', component: AnalyticsDashboardComponent }
    ]
  }
];
