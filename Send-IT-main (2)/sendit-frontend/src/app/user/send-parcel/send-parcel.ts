import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ParcelService } from '../../core/services/parcel';
import { Parcel } from '../../shared/models/parcel.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MapComponent } from '../../shared/components/map/map.component';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AddressService } from '../../core/services/address';
import { MessageService } from '../../core/services/message.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-send-parcel',
  templateUrl: './send-parcel.html',
  styleUrls: ['./send-parcel.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MapComponent]
})
export class SendParcelComponent implements OnInit {
  loading = false;
  parcelForm: FormGroup;
  pickupCoords = { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi
  destinationCoords = { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi
  distanceKm = 0;
  baseRate = 500; // Base rate in KES
  weightCharge = 0;
  distanceCharge = 0;
  totalCost = 0;
  currentUser: any = null;
  myAddresses: any[] = [];
  geocodingInProgress = false;

  constructor(
    private parcelService: ParcelService, 
    private fb: FormBuilder, 
    private http: HttpClient,
    private router: Router,
    private addressService: AddressService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    // Get current user
    const userStr = localStorage.getItem('sendit_user');
    this.currentUser = userStr ? JSON.parse(userStr) : null;

    this.parcelForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      receiverName: ['', Validators.required],
      receiverPhone: ['', Validators.required],
      weight: [0.5, [Validators.required, Validators.min(0.1)]],
      length: [10, [Validators.required, Validators.min(1)]],
      width: [10, [Validators.required, Validators.min(1)]],
      height: [10, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      pickupLocation: ['', Validators.required],
      destination: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Load user's saved addresses
    this.addressService.getMyAddresses().subscribe({
      next: (addresses) => { this.myAddresses = addresses; },
      error: () => { this.myAddresses = []; }
    });

    // Listen for weight changes to update cost
    this.parcelForm.get('weight')?.valueChanges.subscribe(() => {
      this.updateCost();
    });
  }

  logout() {
    // Clear all authentication data
    localStorage.removeItem('sendit_access_token');
    localStorage.removeItem('sendit_user_role');
    localStorage.removeItem('sendit_user_id');
    localStorage.removeItem('sendit_user_email');
    localStorage.removeItem('sendit_user_name');
    localStorage.removeItem('sendit_user');
    
    // Clear any other session data
    sessionStorage.clear();
    
    // Redirect to landing page
    window.location.href = '/';
  }

  onSubmit() {
    if (this.parcelForm.invalid) {
      this.messageService.showError('Please fill in all required fields correctly.');
      return;
    }

    if (this.distanceKm === 0) {
      this.messageService.showError('Please enter valid pickup and destination addresses to calculate cost.');
      return;
    }

    this.loading = true;

    const formData = this.parcelForm.value;

    // Prepare parcel data for comprehensive endpoint
    const parcelData = {
      receiverEmail: formData.receiverEmail,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      weight: formData.weight,
      dimensions: {
        length: formData.length,
        width: formData.width,
        height: formData.height
      },
      description: formData.description,
      pickupAddress: {
        street: formData.pickupLocation,
        city: '', // Will be determined by geocoding
        state: '',
        postalCode: '',
        country: 'Kenya'
      },
      deliveryAddress: {
        street: formData.destination,
        city: '', // Will be determined by geocoding
        state: '',
        postalCode: '',
        country: 'Kenya'
      }
    };

    // Create parcel using comprehensive endpoint
    this.parcelService.createParcelComprehensive(parcelData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.messageService.showSuccess('Parcel sent successfully! 📦 Confirmation email will be sent shortly.');
        this.parcelForm.reset();
        this.resetForm();
        localStorage.setItem('refresh_dashboard', 'true');
        setTimeout(() => {
          this.router.navigate(['/user']);
        }, 2000);
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.showError(error.error?.message || 'Failed to send parcel. Please try again.');
      }
    });
  }

  async onAddressBlur() {
    if (this.geocodingInProgress) return;
    
    const pickup = this.parcelForm.get('pickupLocation')?.value;
    const destination = this.parcelForm.get('destination')?.value;
    
    console.log('Address blur triggered:', { pickup, destination });
    
    this.geocodingInProgress = true;
    
    try {
      // Geocode pickup location
      if (pickup) {
        try {
          console.log('Geocoding pickup:', pickup);
          const pickupGeo = await firstValueFrom(this.addressService.geocodeAddress({
            line1: pickup,
            city: '',
            state: '',
            country: 'Kenya'
          }));
          console.log('Pickup geocoding result:', pickupGeo);
          if (pickupGeo && pickupGeo.lat && pickupGeo.lng) {
            this.pickupCoords = { lat: pickupGeo.lat, lng: pickupGeo.lng };
            console.log('Pickup coordinates set:', this.pickupCoords);
            this.cdr.detectChanges(); // Trigger map update
          }
        } catch (e) {
          console.error('Geocoding pickup error:', e);
          this.messageService.showError('Could not find pickup location. Please check the address.');
        }
      }
      
      // Geocode destination location
      if (destination) {
        try {
          console.log('Geocoding destination:', destination);
          const destGeo = await firstValueFrom(this.addressService.geocodeAddress({
            line1: destination,
            city: '',
            state: '',
            country: 'Kenya'
          }));
          console.log('Destination geocoding result:', destGeo);
          if (destGeo && destGeo.lat && destGeo.lng) {
            this.destinationCoords = { lat: destGeo.lat, lng: destGeo.lng };
            console.log('Destination coordinates set:', this.destinationCoords);
            this.cdr.detectChanges(); // Trigger map update
          }
        } catch (e) {
          console.error('Geocoding destination error:', e);
          this.messageService.showError('Could not find destination location. Please check the address.');
        }
      }
      
      // Calculate distance and cost if both addresses are geocoded
      console.log('Checking coordinates for distance calculation:', {
        pickupCoords: this.pickupCoords,
        destinationCoords: this.destinationCoords,
        pickupLat: this.pickupCoords.lat,
        destinationLat: this.destinationCoords.lat
      });
      
      if (pickup && destination && this.pickupCoords.lat !== -1.286389 && this.destinationCoords.lat !== -1.286389) {
        this.distanceKm = this.calculateDistance(
          this.pickupCoords.lat, this.pickupCoords.lng,
          this.destinationCoords.lat, this.destinationCoords.lng
        );
        this.updateCost();
        console.log('Distance calculated:', this.distanceKm, 'km');
        console.log('Cost updated:', this.totalCost);
        this.cdr.detectChanges(); // Trigger UI update
      } else {
        console.log('Distance calculation skipped - coordinates not ready');
      }
    } finally {
      this.geocodingInProgress = false;
      this.cdr.detectChanges(); // Final UI update
    }
  }

  // Manual method to recalculate cost (for debugging)
  recalculateCost() {
    const pickup = this.parcelForm.get('pickupLocation')?.value;
    const destination = this.parcelForm.get('destination')?.value;
    
    console.log('Manual cost recalculation:', { pickup, destination, pickupCoords: this.pickupCoords, destinationCoords: this.destinationCoords });
    
    if (pickup && destination && this.pickupCoords.lat !== -1.286389 && this.destinationCoords.lat !== -1.286389) {
      this.distanceKm = this.calculateDistance(
        this.pickupCoords.lat, this.pickupCoords.lng,
        this.destinationCoords.lat, this.destinationCoords.lng
      );
      this.updateCost();
      console.log('Manual recalculation - Distance:', this.distanceKm, 'km, Cost:', this.totalCost);
    } else {
      console.log('Manual recalculation failed - missing coordinates');
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  updateCost() {
    const weight = this.parcelForm.get('weight')?.value || 0.5;
    this.weightCharge = weight * 200; // 200 KES per kg
    this.distanceCharge = this.distanceKm * 50; // 50 KES per km
    this.totalCost = this.baseRate + this.weightCharge + this.distanceCharge;
    console.log('Cost updated:', {
      baseRate: this.baseRate,
      weightCharge: this.weightCharge,
      distanceCharge: this.distanceCharge,
      totalCost: this.totalCost
    });
  }

  resetForm() {
    this.parcelForm.reset({
      weight: 0.5,
      length: 10,
      width: 10,
      height: 10
    });
    this.distanceKm = 0;
    this.totalCost = 0;
    this.weightCharge = 0;
    this.distanceCharge = 0;
    this.pickupCoords = { lat: -1.286389, lng: 36.817223 };
    this.destinationCoords = { lat: -1.286389, lng: 36.817223 };
  }

  showNotification() { 
    this.router.navigate(['/user/notifications']); 
  }
  
  showProfileMenu() { 
    this.router.navigate(['/user/profile']); 
  }
} 