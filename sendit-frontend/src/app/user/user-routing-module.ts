import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { User } from './user';
import { SendParcelComponent } from './send-parcel/send-parcel';
import { UserDashboardComponent } from './dashboard/dashboard';
import { TrackParcelComponent } from './track-parcel/track-parcel';
import { NotificationCenter } from './notification-center/notification-center';
import { ViewSentComponent } from './view-sent/view-sent';
import { ViewReceivedComponent } from './view-received/view-received';
import { ProfileComponent } from './profile/profile';

const routes: Routes = [
  { path: '', component: User, children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: UserDashboardComponent },
    { path: 'send-parcel', component: SendParcelComponent },
    { path: 'view-sent', component: ViewSentComponent },
    { path: 'view-received', component: ViewReceivedComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'track', component: TrackParcelComponent },
    { path: 'notifications', component: NotificationCenter }
  ]}
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
