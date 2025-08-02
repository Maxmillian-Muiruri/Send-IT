import { Component, OnInit } from '@angular/core';
import { ParcelService } from '../../core/services/parcel';
import { Parcel } from '../../shared/models/parcel.model';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-view-sent',
  templateUrl: './view-sent.html',
  styleUrls: ['./view-sent.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ViewSentComponent implements OnInit {
  sentParcels: Parcel[] = [];
  userEmail: string | null = null;
  showParcelDetailsModal = false;
  selectedParcel: Parcel | null = null;
  loading = false;
  error: string | null = null;

  constructor(private parcelService: ParcelService) {}

  ngOnInit() {
    this.userEmail = localStorage.getItem('sendit_user') ? JSON.parse(localStorage.getItem('sendit_user')!).email : null;
    this.loading = true;
    this.error = null;
    this.parcelService.getParcels().subscribe({
      next: (response: { parcels: Parcel[], pagination: any }) => {
        this.sentParcels = response.parcels.filter((p: Parcel) => 
          p.senderEmail === this.userEmail || 
          p.sender?.email === this.userEmail
        );
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load parcels.';
        this.loading = false;
      }
    });
  }

  openParcelDetailsModal(parcel: Parcel) {
    this.selectedParcel = parcel;
    this.showParcelDetailsModal = true;
  }

  closeParcelDetailsModal() {
    this.showParcelDetailsModal = false;
    this.selectedParcel = null;
  }

  logout() {
    localStorage.removeItem('sendit_user');
    localStorage.removeItem('sendit_access_token');
    window.location.href = '/';
  }
}
