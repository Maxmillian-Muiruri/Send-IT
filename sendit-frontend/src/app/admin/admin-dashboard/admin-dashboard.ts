import { Component } from '@angular/core';

interface Parcel {
  id: string;
  sender: string;
  receiver: string;
  status: 'pending' | 'transit' | 'delivered';
}

interface StatCard {
  value: number | string;
  label: string;
  icon: string;
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminDashboardComponent {
  activeMenu = 'dashboard';

  stats: StatCard[] = [
    { value: 1247, label: 'Total Parcels', icon: 'briefcase' },
    { value: 892, label: 'Delivered', icon: 'check' },
    { value: 203, label: 'Pending', icon: 'clock' },
    { value: 152, label: 'In Transit', icon: 'truck' },
  ];

  parcels: Parcel[] = [
    { id: '#PCL001', sender: 'John Doe', receiver: 'Jane Smith', status: 'pending' },
    { id: '#PCL002', sender: 'Mike Johnson', receiver: 'Sarah Wilson', status: 'transit' },
    { id: '#PCL003', sender: 'Emma Davis', receiver: 'Robert Brown', status: 'delivered' },
    { id: '#PCL004', sender: 'Alex Turner', receiver: 'Lisa Anderson', status: 'pending' },
    { id: '#PCL005', sender: 'Chris Martin', receiver: 'Nicole White', status: 'transit' },
  ];

  setActiveMenu(menu: string) {
    this.activeMenu = menu;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'transit': return 'status-transit';
      case 'delivered': return 'status-delivered';
      default: return '';
    }
  }

  updateStatus(parcel: Parcel) {
    // Simulate update with a timeout or feedback
    alert(`Status for ${parcel.id} updated to ${parcel.status}`);
  }

  logout() {
    // Simulate logout
    alert('Logging out...');
  }
}
