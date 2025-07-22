import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class DashboardComponent {
  stats = [
    {
      title: 'Parcels Sent',
      number: 24,
      change: 12,
      icon: `<svg viewBox='0 0 24 24' fill='currentColor'><path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/></svg>`
    },
    {
      title: 'Parcels Received',
      number: 18,
      change: 8,
      icon: `<svg viewBox='0 0 24 24' fill='currentColor'><path d='M19 7h-8v6h8V7zm0-4H9C7.9 3 7 3.9 7 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H10V7h8v12z'/></svg>`
    },
    {
      title: 'Active Deliveries',
      number: 7,
      change: -3,
      icon: `<svg viewBox='0 0 24 24' fill='currentColor'><path d='M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/></svg>`
    }
  ];

  activity = [
    {
      trackingId: '#SIT001234',
      recipient: 'Alice Johnson',
      status: 'Delivered',
      statusClass: 'delivered',
      date: 'Jan 15, 2025'
    },
    {
      trackingId: '#SIT001235',
      recipient: 'Bob Smith',
      status: 'In Transit',
      statusClass: 'in-transit',
      date: 'Jan 14, 2025'
    },
    {
      trackingId: '#SIT001236',
      recipient: 'Carol Davis',
      status: 'Processing',
      statusClass: 'processing',
      date: 'Jan 13, 2025'
    }
  ];

  filteredActivity = [...this.activity];
  searchTerm = '';

  filterActivity() {
    const term = this.searchTerm.toLowerCase();
    this.filteredActivity = this.activity.filter(a =>
      a.trackingId.toLowerCase().includes(term) ||
      a.recipient.toLowerCase().includes(term) ||
      a.status.toLowerCase().includes(term) ||
      a.date.toLowerCase().includes(term)
    );
  }

  newParcel() {
    alert('New Parcel functionality would open here');
  }

  viewParcel(activity: any) {
    alert(`View action for ${activity.trackingId}`);
  }

  trackParcel(activity: any) {
    alert(`Track action for ${activity.trackingId}`);
  }

  logout() {
    // Implement logout logic here
    alert('Logged out!');
  }
} 