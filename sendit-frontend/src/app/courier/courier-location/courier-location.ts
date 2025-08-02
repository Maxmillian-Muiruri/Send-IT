import { Component, OnInit } from '@angular/core';
import { CourierService } from '../../core/services/courier';
import { Courier } from '../../shared/models/courier.model';

@Component({
  selector: 'app-courier-location',
  template: `<div>Courier Location works!</div>`,
  styleUrls: ['./courier-location.css']
})
export class CourierLocationComponent implements OnInit {
  courier: Courier | undefined;

  constructor(private courierService: CourierService) {}

  ngOnInit() {
    const userStr = localStorage.getItem('sendit_user');
    const email = userStr ? JSON.parse(userStr).email : '';
    this.courierService.getCourierByEmail(email).subscribe({
      next: (courier) => {
        this.courier = courier;
      },
      error: (err) => {
        console.error('Failed to load courier:', err);
      }
    });
  }

  updateLocation(newLocation: { lat: number; lng: number }) {
    if (this.courier) {
      this.courierService.updateCourierLocation(this.courier.id, {
        locationLat: newLocation.lat,
        locationLng: newLocation.lng
      }).subscribe({
        next: (updatedCourier) => {
          this.courier = updatedCourier;
        },
        error: (err) => {
          console.error('Failed to update location:', err);
        }
      });
    }
  }
} 