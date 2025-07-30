import { Component } from '@angular/core';
import { CourierDashboardComponent } from './courier-dashboard/courier-dashboard';

@Component({
  selector: 'app-courier',
  templateUrl: './courier.html',
  styleUrls: ['./courier.css'],
  standalone: true,
  imports: [CourierDashboardComponent]
})
export class Courier {}
