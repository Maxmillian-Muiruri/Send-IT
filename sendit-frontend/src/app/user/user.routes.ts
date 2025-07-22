import { Routes } from '@angular/router';
import { User } from './user';
import { DashboardComponent } from './dashboard/dashboard';
import { SendParcelComponent } from './send-parcel/send-parcel';
import { TrackParcelComponent } from './track-parcel/track-parcel';
import { NotificationCenter } from './notification-center/notification-center';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: User,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'send-parcel', component: SendParcelComponent },
      { path: 'track', component: TrackParcelComponent },
      { path: 'notifications', component: NotificationCenter }
    ]
  }
];
