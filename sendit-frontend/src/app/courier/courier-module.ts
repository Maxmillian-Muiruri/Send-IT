import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CourierRoutingModule } from './courier-routing-module';
import { Courier } from './courier';
import { CourierDashboard } from './courier-dashboard/courier-dashboard';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CourierRoutingModule,
    Courier,
    CourierDashboard
  ],
  exports: []
})
export class CourierModule { }
