import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
// REMOVE: import { GoogleMapsModule } from '@angular/google-maps';
import * as L from 'leaflet';
import { MapComponent } from '../../shared/components/map/map.component';
import { HttpClient } from '@angular/common/http';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-send-parcel',
  templateUrl: './send-parcel.html',
  styleUrls: ['./send-parcel.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MapComponent]
})
export class SendParcelComponent {
  parcelForm: FormGroup;
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  baseRate = 5.00;
  weightCharge = 0.00;
  distanceCharge = 0.00;
  totalCost = 5.00;

  // Leaflet/Map properties (dummy for now)
  pickupCoords = { lat: -1.286389, lng: 36.817223 }; // Nairobi
  destinationCoords = { lat: -4.043477, lng: 39.668206 }; // Mombasa
  distanceKm = 0;
  ratePerKm = 0.5; // Example rate per km

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.parcelForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      weight: [0.5, [Validators.required, Validators.min(0.1)]],
      pickupLocation: ['', Validators.required],
      destination: ['', Validators.required]
    });
    this.updateCost();
    this.parcelForm.get('weight')?.valueChanges.subscribe(() => this.updateCost());
    // Debounce address input to avoid too many requests
    this.parcelForm.get('pickupLocation')?.valueChanges.pipe(debounceTime(500)).subscribe(value => this.geocodeAddress(value, 'pickup'));
    this.parcelForm.get('destination')?.valueChanges.pipe(debounceTime(500)).subscribe(value => this.geocodeAddress(value, 'destination'));
  }

  ngOnDestroy() {
    // No map cleanup needed here as map is now a child component
  }

  private geocodeAddress(address: string, type: 'pickup' | 'destination') {
    if (!address) {
      if (type === 'pickup') this.pickupCoords = { lat: NaN, lng: NaN };
      if (type === 'destination') this.destinationCoords = { lat: NaN, lng: NaN };
      this.updateRoute();
      return;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    this.http.get<any[]>(url).pipe(
      catchError(() => of([]))
    ).subscribe(results => {
      if (results.length > 0) {
        const coords = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
        if (type === 'pickup') this.pickupCoords = coords;
        if (type === 'destination') this.destinationCoords = coords;
        this.errorMessage = null;
      } else {
        this.errorMessage = `Could not find location for ${type} address.`;
        if (type === 'pickup') this.pickupCoords = { lat: NaN, lng: NaN };
        if (type === 'destination') this.destinationCoords = { lat: NaN, lng: NaN };
      }
      this.updateRoute();
    });
  }

  updateRoute() {
    const pickup = this.parcelForm.get('pickupLocation')?.value;
    const destination = this.parcelForm.get('destination')?.value;
    const pickupValid = this.pickupCoords && !isNaN(this.pickupCoords.lat) && !isNaN(this.pickupCoords.lng);
    const destValid = this.destinationCoords && !isNaN(this.destinationCoords.lat) && !isNaN(this.destinationCoords.lng);
    if (pickup && destination && pickupValid && destValid) {
      this.distanceKm = this.calculateDistanceKm(this.pickupCoords, this.destinationCoords);
    } else {
      this.distanceKm = 0;
    }
    this.updateCost();
    // Map updates via @Input to MapComponent
  }

  updateCost() {
    const weight = parseFloat(this.parcelForm.get('weight')?.value) || 0;
    this.weightCharge = weight > 1 ? (weight - 1) * 2 : 0;
    // Only calculate distance charge if both pickup and destination are filled
    const pickup = this.parcelForm.get('pickupLocation')?.value;
    const destination = this.parcelForm.get('destination')?.value;
    if (pickup && destination) {
      this.distanceCharge = this.distanceKm * this.ratePerKm;
    } else {
      this.distanceCharge = 0;
    }
    this.totalCost = this.baseRate + this.weightCharge + this.distanceCharge;
  }

  onSubmit() {
    if (this.parcelForm.invalid) {
      this.errorMessage = 'Please fill in all fields correctly.';
      setTimeout(() => this.errorMessage = null, 3000);
      return;
    }
    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;
    setTimeout(() => {
      this.loading = false;
      this.successMessage = 'Your parcel was sent successfully!';
      setTimeout(() => this.successMessage = null, 3000);
      this.parcelForm.reset({ weight: 0.5 });
      this.updateCost();
    }, 1500);
  }

  showNotification() {
    this.errorMessage = 'No new notifications';
    setTimeout(() => this.errorMessage = null, 2000);
  }

  showProfileMenu() {
    this.successMessage = 'Profile menu would open here';
    setTimeout(() => this.successMessage = null, 2000);
  }

  // Haversine formula for distance between two lat/lng points
  private calculateDistanceKm(a: {lat: number, lng: number}, b: {lat: number, lng: number}): number {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
} 