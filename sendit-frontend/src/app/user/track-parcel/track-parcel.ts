import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MapComponent } from '../../shared/components/map/map.component';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-track-parcel',
  templateUrl: './track-parcel.html',
  styleUrls: ['./track-parcel.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapComponent, Navbar]
})
export class TrackParcelComponent {
  trackForm: FormGroup;
  searched = false;
  notFound = false;
  loading = false;
  currentCoords = { lat: 33.4484, lng: -112.0740 }; // Phoenix, AZ for demo

  // Dummy data for demonstration
  parcel = {
    id: 'PKG-2025-001234',
    status: 'In Transit',
    sender: {
      name: 'John Smith',
      address: '123 Main St, New York, NY 10001',
      phone: '+1 (555) 123-4567'
    },
    receiver: {
      name: 'Sarah Johnson',
      address: '456 Oak Ave, Los Angeles, CA 90210',
      phone: '+1 (555) 987-6543'
    },
    weight: '2.5 kg',
    serviceType: 'Express',
    estDelivery: 'Jan 15, 2025',
    currentLocation: 'Phoenix, AZ Distribution Center',
    lastUpdated: '2 hours ago',
    progress: [
      { label: 'Pickup', icon: '✓', status: 'completed', time: 'Jan 12, 10:30 AM' },
      { label: 'In Transit', icon: '🚚', status: 'active', time: 'Jan 13, 2:15 PM' },
      { label: 'Delivered', icon: '📦', status: 'pending', time: 'Pending' }
    ],
    history: [
      { title: 'Package in transit', location: 'Phoenix, AZ Distribution Center', time: 'Jan 13, 2025 - 2:15 PM' },
      { title: 'Package departed facility', location: 'Denver, CO Sorting Facility', time: 'Jan 13, 2025 - 8:30 AM' },
      { title: 'Package arrived at facility', location: 'Denver, CO Sorting Facility', time: 'Jan 12, 2025 - 11:45 PM' },
      { title: 'Package picked up', location: '123 Main St, New York, NY', time: 'Jan 12, 2025 - 10:30 AM' }
    ]
  };

  constructor(private fb: FormBuilder) {
    this.trackForm = this.fb.group({
      trackingId: ['', Validators.required]
    });
  }

  onSubmit() {
    this.searched = false;
    this.notFound = false;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      if (this.trackForm.value.trackingId === this.parcel.id) {
        this.searched = true;
        this.currentCoords = { lat: 33.4484, lng: -112.0740 }; // Phoenix, AZ for demo
      } else {
        this.notFound = true;
      }
    }, 1000);
  }
}
