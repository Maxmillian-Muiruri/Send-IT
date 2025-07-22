import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { User } from './user';
import { SendParcelComponent } from './send-parcel/send-parcel';
import { DashboardComponent } from './dashboard/dashboard';
import { TrackParcelComponent } from './track-parcel/track-parcel';
import { NotificationCenter } from './notification-center/notification-center';

const routes: Routes = [
  { path: '', component: User, children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'send-parcel', component: SendParcelComponent },
    { path: 'track', component: TrackParcelComponent },
    { path: 'notifications', component: NotificationCenter }
  ]}
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
