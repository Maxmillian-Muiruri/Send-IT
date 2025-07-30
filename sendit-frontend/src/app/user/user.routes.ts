import { Routes } from '@angular/router';
import { User } from './user';
import { UserDashboardComponent } from './dashboard/dashboard';
import { SendParcelComponent } from './send-parcel/send-parcel';
import { TrackParcelComponent } from './track-parcel/track-parcel';
import { NotificationCenter } from './notification-center/notification-center';
import { ViewSentComponent } from './view-sent/view-sent';
import { ViewReceivedComponent } from './view-received/view-received';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: User,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: UserDashboardComponent },
      { path: 'send-parcel', component: SendParcelComponent },
      { path: 'track', component: TrackParcelComponent },
      { path: 'notifications', component: NotificationCenter },
      { path: 'view-sent', component: ViewSentComponent },
      { path: 'view-received', component: ViewReceivedComponent }
    ]
  }
];
