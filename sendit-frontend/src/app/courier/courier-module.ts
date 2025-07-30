import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CourierRoutingModule } from './courier-routing-module';
import { Courier } from './courier';
import { CourierDashboardComponent } from './courier-dashboard/courier-dashboard';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CourierRoutingModule
    // Remove Courier and CourierDashboardComponent from imports if they are standalone
  ],
  exports: []
})
export class CourierModule { }
