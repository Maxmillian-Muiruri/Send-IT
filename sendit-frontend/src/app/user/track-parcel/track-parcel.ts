import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MapComponent } from '../../shared/components/map/map.component';
import { ParcelService } from '../../core/services/parcel';
import { MessageService } from '../../core/services/message.service';
import { Parcel } from '../../shared/models/parcel.model';

@Component({
  selector: 'app-track-parcel',
  templateUrl: './track-parcel.html',
  styleUrls: ['./track-parcel.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapComponent, RouterModule]
})
export class TrackParcelComponent implements OnInit {
  trackForm: FormGroup;
  searched = false;
  notFound = false;
  loading = false;
  error: string | null = null;
  pickupCoords = { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi
  destinationCoords = { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi
  currentCoords = { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi
  foundParcel: Parcel | null = null;

  // Progress steps based on parcel status
  progressSteps = [
    { status: 'PENDING', label: 'Parcel Created', icon: '📦' },
    { status: 'PICKED_UP', label: 'Picked Up', icon: '🚚' },
    { status: 'IN_TRANSIT', label: 'In Transit', icon: '🛣️' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🏃' },
    { status: 'DELIVERED', label: 'Delivered', icon: '✅' }
  ];

  constructor(
    private fb: FormBuilder, 
    private parcelService: ParcelService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.trackForm = this.fb.group({
      trackingId: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Check if tracking ID is provided in query params
    this.route.queryParams.subscribe(params => {
      const trackingId = params['trackingId'];
      if (trackingId) {
        this.trackForm.patchValue({ trackingId });
        this.onSubmit();
      }
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
    if (this.trackForm.valid) {
      this.loading = true;
      this.searched = true;
      this.notFound = false;
      this.error = null;

      const trackingId = this.trackForm.get('trackingId')?.value;

      // Use the public tracking endpoint
      this.parcelService.trackParcelByCode(trackingId).subscribe({
        next: (parcel: Parcel) => {
          this.loading = false;
          this.foundParcel = parcel;
          this.updateMapCoordinates();
          this.messageService.showSuccess('Parcel found successfully! 📦');
        },
        error: (error: any) => {
          this.loading = false;
          this.notFound = true;
          this.foundParcel = null;
          this.messageService.showError(error.error?.message || 'Parcel not found. Please check your tracking ID.');
        }
      });
    }
  }

  updateMapCoordinates() {
    if (this.foundParcel) {
      console.log('Parcel data:', this.foundParcel); // Debug log
      console.log('Pickup address:', this.foundParcel.pickupAddress);
      console.log('Delivery address:', this.foundParcel.deliveryAddress);
      console.log('Courier data:', this.foundParcel.courier);
      
      // Set pickup coordinates
      if (this.foundParcel.pickupAddress && 
          typeof this.foundParcel.pickupAddress.latitude === 'number' && 
          typeof this.foundParcel.pickupAddress.longitude === 'number' &&
          this.foundParcel.pickupAddress.latitude !== 0 &&
          this.foundParcel.pickupAddress.longitude !== 0) {
        this.pickupCoords = {
          lat: this.foundParcel.pickupAddress.latitude,
          lng: this.foundParcel.pickupAddress.longitude
        };
        console.log('Set pickup coords:', this.pickupCoords);
      } else {
        console.log('Invalid pickup coordinates, using default');
      }

      // Set destination coordinates
      if (this.foundParcel.deliveryAddress && 
          typeof this.foundParcel.deliveryAddress.latitude === 'number' && 
          typeof this.foundParcel.deliveryAddress.longitude === 'number' &&
          this.foundParcel.deliveryAddress.latitude !== 0 &&
          this.foundParcel.deliveryAddress.longitude !== 0) {
        this.destinationCoords = {
          lat: this.foundParcel.deliveryAddress.latitude,
          lng: this.foundParcel.deliveryAddress.longitude
        };
        console.log('Set destination coords:', this.destinationCoords);
      } else {
        console.log('Invalid destination coordinates, using default');
      }

      // Set current coordinates (courier location)
      if (
        this.foundParcel.courier &&
        typeof this.foundParcel.courier.locationLat === 'number' &&
        typeof this.foundParcel.courier.locationLng === 'number' &&
        this.foundParcel.courier.locationLat !== 0 &&
        this.foundParcel.courier.locationLng !== 0 &&
        ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(this.foundParcel.status)
      ) {
        this.currentCoords = {
          lat: this.foundParcel.courier.locationLat,
          lng: this.foundParcel.courier.locationLng
        };
        console.log('Set current coords (courier):', this.currentCoords);
      } else {
        // If no courier location or not in transit, set to null to hide courier marker
        this.currentCoords = { lat: 0, lng: 0 };
        console.log('No courier location available');
      }
    }
  }

  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending',
      'PICKED_UP': 'Picked Up',
      'IN_TRANSIT': 'In Transit',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getProgressSteps() {
    if (!this.foundParcel) return [];
    
    return this.progressSteps.map(step => {
      const currentStatus = this.foundParcel!.status;
      let stepStatus = 'pending';
      
      if (currentStatus === 'CANCELLED') {
        stepStatus = 'cancelled';
      } else if (this.getStatusIndex(currentStatus) >= this.getStatusIndex(step.status)) {
        stepStatus = this.getStatusIndex(currentStatus) === this.getStatusIndex(step.status) ? 'active' : 'completed';
      }
      
      return {
        ...step,
        status: stepStatus,
        time: this.getStepTime(step.status)
      };
    });
  }

  getStatusIndex(status: string): number {
    const statusOrder = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return statusOrder.indexOf(status);
  }

  getStepTime(status: string): string {
    if (!this.foundParcel) return 'Pending';
    
    const now = new Date();
    const created = new Date(this.foundParcel.createdAt);
    const updated = new Date(this.foundParcel.updatedAt);
    
    switch (status) {
      case 'PENDING':
        return created.toLocaleString();
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERED':
        return updated.toLocaleString();
      default:
        return 'Pending';
    }
  }

  getTrackingHistory() {
    if (!this.foundParcel) return [];

    const history = [];
    const created = new Date(this.foundParcel.createdAt);
    const updated = new Date(this.foundParcel.updatedAt);

    // Add creation event
    history.push({
      title: 'Parcel created',
      location: this.foundParcel.pickupAddress?.formattedAddress || 'Pickup location',
      time: created.toLocaleString()
    });

    // Add status updates
    if (this.foundParcel.status !== 'PENDING') {
      let location = this.foundParcel.deliveryAddress?.formattedAddress || 'Delivery location';
      // If in transit and courier location is available, use it
      if (
        this.foundParcel.courier &&
        this.foundParcel.courier.currentLocation &&
        typeof this.foundParcel.courier.locationLat === 'number' &&
        typeof this.foundParcel.courier.locationLng === 'number' &&
        ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(this.foundParcel.status)
      ) {
        location = this.foundParcel.courier.currentLocation;
      }
      history.push({
        title: `Status updated to ${this.getStatusDisplay(this.foundParcel.status)}`,
        location,
        time: updated.toLocaleString()
      });
    }

    return history;
  }

  getCurrentLocation(): string {
    if (!this.foundParcel) return 'Unknown';
    
    // Debug information
    console.log('Debug - Parcel Status:', this.foundParcel.status);
    console.log('Debug - Courier:', this.foundParcel.courier);
    console.log('Debug - Courier Location:', this.foundParcel.courier?.currentLocation);
    console.log('Debug - Courier Coordinates:', {
      lat: this.foundParcel.courier?.locationLat,
      lng: this.foundParcel.courier?.locationLng
    });
    
    // Show courier's current location if in transit and assigned
    if (
      this.foundParcel.courier &&
      this.foundParcel.courier.currentLocation &&
      ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(this.foundParcel.status)
    ) {
      console.log('Debug - Showing courier location:', this.foundParcel.courier.currentLocation);
      return this.foundParcel.courier.currentLocation;
    }
    
    if (this.foundParcel.status === 'DELIVERED') {
      return this.foundParcel.deliveryAddress?.formattedAddress || 'Delivered';
    } else if (this.foundParcel.status === 'PENDING') {
      return this.foundParcel.pickupAddress?.formattedAddress || 'Pickup location';
    } else {
      return this.foundParcel.deliveryAddress?.formattedAddress || 'In transit';
    }
  }

  getLastUpdated(): string {
    if (!this.foundParcel) return 'Unknown';
    
    const updated = new Date(this.foundParcel.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return updated.toLocaleString();
  }
}
