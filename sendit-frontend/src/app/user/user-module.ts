import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserRoutingModule } from './user-routing-module';
import { User } from './user';
import { ViewSentComponent } from './view-sent/view-sent';
import { ViewReceivedComponent } from './view-received/view-received';
import { UserDashboardComponent } from './dashboard/dashboard';
import { SendParcelComponent } from './send-parcel/send-parcel';
import { TrackParcelComponent } from './track-parcel/track-parcel';
import { GoogleMap } from './track-parcel/google-map/google-map';
import { CourierLocation } from './courier-location/courier-location';
import { Courier } from './courier-location/courier/courier';
import { NotificationCenter } from './notification-center/notification-center';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UserRoutingModule,
    User,
    ViewSentComponent,
    ViewReceivedComponent,
    UserDashboardComponent,
    SendParcelComponent,
    TrackParcelComponent,
    GoogleMap,
    CourierLocation,
    Courier,
    NotificationCenter
  ],
  exports: []
})
export class UserModule { }
