import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing-module';
import { Admin } from './admin';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { CreateParcel } from './create-parcel/create-parcel';
import { UpdateStatus } from './update-status/update-status';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    Admin,
    AdminDashboardComponent,
    CreateParcel,
    UpdateStatus
  ],
  exports: []
})
export class AdminModule { }
