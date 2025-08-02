import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapComponent } from '../../shared/components/map/map.component';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { ParcelService } from '../../core/services/parcel';
import { CourierService } from '../../core/services/courier';
import { NotificationService, Notification } from '../../core/services/notification';
import { MessageService } from '../../core/services/message.service';
import { Parcel } from '../../shared/models/parcel.model';
import { Courier } from '../../shared/models/courier.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-courier-dashboard',
  templateUrl: './courier-dashboard.html',
  styleUrls: ['./courier-dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MapComponent, ModalComponent]
})
export class CourierDashboardComponent implements OnInit {
  parcels: Parcel[] = [];
  courier: Courier | null = null;
  loading = false;
  error: string | null = null;
  location: string = 'Nairobi, Kenya';
  isGeolocated = false;
  courierCoords = { lat: -1.286389, lng: 36.817223 }; // Default: Nairobi
  courierStats: any = null;
  courierAnalytics: any = null;
  
  showAddParcelModal = false;
  showEditParcelModal = false;
  showUpdateLocationModal = false;
  selectedParcel: Parcel | null = null;
  newParcel: Partial<Parcel> = {};
  newLocation: { lat: number; lng: number } = { lat: 0, lng: 0 };
  manualLocationName: string = '';
  manualLocationLoading: boolean = false;
  manualLocationError: string = '';
  manualLat: number | null = null;
  manualLng: number | null = null;

  // Notification properties
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotificationsModal: boolean = false;
  notificationsLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private parcelService: ParcelService,
    private courierService: CourierService,
    private notificationService: NotificationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.showAddParcelModal = false;
    this.showEditParcelModal = false;
    this.showUpdateLocationModal = false;
    
    this.loading = true;
    this.error = null;
    
    // Load courier profile
    this.loadCourierProfile();
    
    // Load assigned parcels
    this.loadAssignedParcels();
    
    // Load courier stats and analytics
    this.loadCourierStats();
    
    // Load notifications
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadCourierProfile() {
    this.courierService.getCourierProfile().subscribe({
      next: (courier) => {
        this.courier = courier;
        if (courier.locationLat && courier.locationLng) {
          this.courierCoords = { lat: courier.locationLat, lng: courier.locationLng };
          this.location = courier.currentLocation || 'Location updated';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load courier profile:', err);
        this.error = 'Failed to load courier profile.';
        this.loading = false;
      }
    });
  }

  loadAssignedParcels() {
    this.parcelService.getParcels().subscribe({
      next: (response: { parcels: Parcel[], pagination: any }) => {
        // Filter parcels assigned to this courier
        if (this.courier) {
          this.parcels = response.parcels.filter((p: Parcel) => p.courierId === this.courier!.id || p.assignedCourierId === this.courier!.id);
        }
      },
      error: (err) => {
        console.error('Failed to load assigned parcels:', err);
        this.error = 'Failed to load assigned parcels.';
      }
    });
  }

  loadCourierStats() {
    if (this.courier) {
      // Load courier stats
      this.courierService.getCourierStats(this.courier.id).subscribe({
        next: (stats) => {
          this.courierStats = stats;
        },
        error: (err) => {
          console.error('Failed to load courier stats:', err);
        }
      });

      // Load courier analytics
      this.courierService.getCourierAnalytics(this.courier.id, 'month').subscribe({
        next: (analytics) => {
          this.courierAnalytics = analytics;
        },
        error: (err) => {
          console.error('Failed to load courier analytics:', err);
        }
      });
    }
  }

  // Notification methods
  loadNotifications() {
    this.notificationsLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        this.notifications = response.notifications;
        this.notificationsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.notificationsLoading = false;
      }
    });
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount = response.unreadCount;
      },
      error: (err) => {
        console.error('Failed to load unread count:', err);
      }
    });
  }

  markNotificationAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: (notification) => {
        // Update the notification in the local array
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          this.notifications[index] = notification;
        }
        this.loadUnreadCount(); // Refresh unread count
        this.messageService.showSuccess('Notification marked as read!');
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
        this.messageService.showError('Failed to mark notification as read');
      }
    });
  }

  markAllNotificationsAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Mark all notifications as read locally
        this.notifications.forEach(notification => {
          notification.read = true;
        });
        this.unreadCount = 0;
        this.messageService.showSuccess('All notifications marked as read!');
      },
      error: (err) => {
        console.error('Failed to mark all notifications as read:', err);
        this.messageService.showError('Failed to mark all notifications as read');
      }
    });
  }

  deleteNotification(notificationId: string) {
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        // Remove the notification from the local array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.loadUnreadCount(); // Refresh unread count
        this.messageService.showSuccess('Notification deleted!');
      },
      error: (err) => {
        console.error('Failed to delete notification:', err);
        this.messageService.showError('Failed to delete notification');
      }
    });
  }

  openNotificationsModal() {
    this.showNotificationsModal = true;
    this.loadNotifications(); // Refresh notifications when opening modal
  }

  closeNotificationsModal() {
    this.showNotificationsModal = false;
  }

  updateParcelStatus(parcel: Parcel, newStatus: Parcel['status']) {
    this.parcelService.updateParcelStatus(parcel.id, newStatus).subscribe({
      next: (updatedParcel) => {
        // Update the parcel in the local array
        const index = this.parcels.findIndex(p => p.id === parcel.id);
        if (index !== -1) {
          this.parcels[index] = updatedParcel;
        }
        this.messageService.showSuccess(`Parcel status updated successfully to ${newStatus}!`);
      },
      error: (err) => {
        console.error('Failed to update parcel status:', err);
        this.messageService.showError('Failed to update parcel status: ' + (err.error?.message || err.message));
      }
    });
  }

  updateLocation() {
    if (this.newLocation.lat && this.newLocation.lng) {
      this.loading = true; // Use loading for the update process
      this.error = null;
      
      // Get address from coordinates
      this.http.get<any>(`${environment.apiUrl}/common/geocoding/reverse?lat=${this.newLocation.lat}&lng=${this.newLocation.lng}`).subscribe({
        next: (geocodeRes) => {
          const locationData = {
            locationLat: this.newLocation.lat,
            locationLng: this.newLocation.lng,
            currentLocation: geocodeRes.formattedAddress || 'Unknown location'
          };

          this.courierService.updateCourierLocation(this.courier!.id, locationData).subscribe({
            next: (updatedCourier) => {
              this.courier = updatedCourier;
              this.courierCoords = { lat: this.newLocation.lat, lng: this.newLocation.lng };
              this.location = geocodeRes.formattedAddress || 'Location updated';
              this.loading = false;
              this.showUpdateLocationModal = false;
              this.newLocation = { lat: 0, lng: 0 };
              this.messageService.showSuccess('Location updated successfully! 📍');
            },
            error: (err) => {
              this.loading = false;
              this.error = 'Failed to update location: ' + (err.error?.message || err.message);
              this.messageService.showError('Failed to update location: ' + (err.error?.message || err.message));
            }
          });
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to get location address: ' + (err.error?.message || err.message);
          this.messageService.showError('Failed to get location address: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  reverseGeocode(lat: number, lng: number) {
    // Use backend geocoding service instead of direct Nominatim call
    this.http.get<any>(`${environment.apiUrl}/common/geocoding/reverse?lat=${lat}&lng=${lng}`).subscribe({
      next: (result) => {
        if (result && result.formattedAddress) {
          this.location = result.formattedAddress;
          console.log('Reverse geocoded address:', this.location);
        } else {
          this.location = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        
        // Update courier's current location in backend
        if (this.courier) {
          this.courierService.updateCourierLocation(this.courier.id, {
            locationLat: lat,
            locationLng: lng,
            currentLocation: this.location
          }).subscribe({
            next: (updatedCourier) => {
              this.courier = updatedCourier;
              this.messageService.showSuccess('Location updated successfully! 🏠');
            },
            error: (err) => {
              console.error('Failed to update location details:', err);
              this.messageService.showError('Failed to update location: ' + (err.error?.message || err.message));
            }
          });
        }
      },
      error: (error) => {
        console.error('Reverse geocoding failed:', error);
        this.location = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Still update the location even if geocoding fails
        if (this.courier) {
          this.courierService.updateCourierLocation(this.courier.id, {
            locationLat: lat,
            locationLng: lng,
            currentLocation: this.location
          }).subscribe({
            next: (updatedCourier) => {
              this.courier = updatedCourier;
              this.messageService.showSuccess('Location updated successfully! 🏠');
            },
            error: (err) => {
              console.error('Failed to update location details:', err);
              this.messageService.showError('Failed to update location: ' + (err.error?.message || err.message));
            }
          });
        }
      }
    });
  }

  private setRandomLocation() {
    const locations = [
      { name: 'Nairobi, Kenya', lat: -1.286389, lng: 36.817223 },
      { name: 'Mombasa, Kenya', lat: -4.043477, lng: 39.668206 },
      { name: 'Kisumu, Kenya', lat: -0.091702, lng: 34.767956 },
      { name: 'Eldoret, Kenya', lat: 0.520360, lng: 35.269779 }
    ];
    
    const otherLocations = locations.filter(loc => loc.lat !== this.courierCoords.lat || loc.lng !== this.courierCoords.lng);
    if (otherLocations.length > 0) {
      const random = Math.floor(Math.random() * otherLocations.length);
      this.courierCoords = { lat: otherLocations[random].lat, lng: otherLocations[random].lng };
      this.location = otherLocations[random].name;
      this.isGeolocated = false;
    }
  }

  updateCourierStatus(status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_DELIVERY') {
    if (this.courier) {
      this.courierService.updateCourierStatus(this.courier.id, status).subscribe({
        next: (updatedCourier) => {
          this.courier = updatedCourier;
          this.messageService.showSuccess(`Status updated successfully to ${status}!`);
        },
        error: (err) => {
          console.error('Failed to update status:', err);
          this.messageService.showError('Failed to update status: ' + (err.error?.message || err.message));
        }
      });
    }
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

  scrollToLocation(event: Event) {
    event.preventDefault();
    const el = document.getElementById('location-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToParcels(event: Event) {
    event.preventDefault();
    const el = document.querySelector('.parcels-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openAddParcelModal() { this.showAddParcelModal = true; }
  openEditParcelModal(parcel: Parcel) { this.selectedParcel = { ...parcel }; this.showEditParcelModal = true; }
  openUpdateLocationModal() { this.showUpdateLocationModal = true; }
  openManualLocationModal() {
    this.manualLocationName = '';
    this.manualLocationError = '';
    this.manualLocationLoading = false;
    this.manualLat = null;
    this.manualLng = null;
    this.showUpdateLocationModal = true;
  }

  searchAndSetManualLocation() {
    if (!this.manualLocationName && (!this.manualLat || !this.manualLng)) {
      this.manualLocationError = 'Please enter either a place name or coordinates.';
      return;
    }
    
    // If coordinates are provided, use them directly
    if (this.manualLat && this.manualLng) {
      this.setManualCoordinates();
      return;
    }
    
    if (!this.manualLocationName) return;
    this.manualLocationLoading = true;
    this.manualLocationError = '';
    
    // Use backend geocoding service instead of direct Nominatim call
    this.http.post<any>(`${environment.apiUrl}/common/geocoding/forward`, {
      address: this.manualLocationName
    }).subscribe({
      next: (result) => {
        if (result && result.lat && result.lng) {
          const lat = result.lat;
          const lng = result.lng;
          this.courierCoords = { lat, lng };
          this.location = result.formattedAddress || this.manualLocationName;
          
          // Update backend using the correct endpoint for couriers
          if (this.courier) {
            this.courierService.updateCourierLocation(this.courier.id, {
              locationLat: lat,
              locationLng: lng,
              currentLocation: this.location
            }).subscribe({
              next: (updatedCourier) => {
                this.courier = updatedCourier;
                this.showUpdateLocationModal = false;
                this.manualLocationLoading = false;
                this.messageService.showSuccess('Manual location updated successfully! 📍');
              },
              error: (err) => {
                this.manualLocationError = 'Failed to update backend.';
                this.manualLocationLoading = false;
                console.error('Backend update error:', err);
                this.messageService.showError('Failed to update location: ' + (err.error?.message || err.message));
              }
            });
          } else {
            this.showUpdateLocationModal = false;
            this.manualLocationLoading = false;
          }
        } else {
          this.manualLocationError = 'No results found for that place.';
          this.manualLocationLoading = false;
        }
      },
      error: (err) => {
        console.error('Geocoding error:', err);
        this.manualLocationError = 'Geocoding failed. Try again.';
        this.manualLocationLoading = false;
      }
    });
  }

  setManualCoordinates() {
    if (!this.manualLat || !this.manualLng) {
      this.manualLocationError = 'Please enter both latitude and longitude.';
      return;
    }

    const lat = this.manualLat;
    const lng = this.manualLng;
    
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.manualLocationError = 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.';
      return;
    }

    this.courierCoords = { lat, lng };
    this.location = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Update backend
    if (this.courier) {
      this.courierService.updateCourierLocation(this.courier.id, {
        locationLat: lat,
        locationLng: lng,
        currentLocation: this.location
      }).subscribe({
        next: (updatedCourier) => {
          this.courier = updatedCourier;
          this.showUpdateLocationModal = false;
          this.messageService.showSuccess('Manual coordinates set successfully! 📍');
        },
        error: (err) => {
          this.manualLocationError = 'Failed to update backend.';
          console.error('Backend update error:', err);
          this.messageService.showError('Failed to update location: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.showUpdateLocationModal = false;
      this.messageService.showSuccess('Manual coordinates set successfully! 📍');
    }
  }

  createParcel() {
    if (this.newParcel.sender && this.newParcel.receiver) {
      this.parcelService.createParcel(this.newParcel as Parcel).subscribe({
        next: (parcel) => {
          this.parcels.push(parcel);
          this.showAddParcelModal = false;
          this.newParcel = {};
          this.messageService.showSuccess('Parcel created successfully! 📦');
        },
        error: (err) => {
          console.error('Failed to create parcel:', err);
          this.messageService.showError('Failed to create parcel: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  updateParcel() {
    if (this.selectedParcel) {
      this.parcelService.updateParcel(this.selectedParcel.id, this.selectedParcel).subscribe({
        next: (updatedParcel) => {
          // Update the parcel in the local array
          const index = this.parcels.findIndex(p => p.id === this.selectedParcel!.id);
          if (index !== -1) {
            this.parcels[index] = updatedParcel;
          }
          this.showEditParcelModal = false;
          this.selectedParcel = null;
          this.messageService.showSuccess('Parcel updated successfully! 📦');
        },
        error: (err) => {
          console.error('Failed to update parcel:', err);
          this.messageService.showError('Failed to update parcel: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  updateLocationModal() {
    if (this.courier) {
      this.courierService.updateCourierLocation(this.courier.id, {
        locationLat: this.newLocation.lat,
        locationLng: this.newLocation.lng,
        currentLocation: undefined
      }).subscribe({
        next: (updatedCourier) => {
          this.courier = updatedCourier;
          this.courierCoords = { lat: this.newLocation.lat, lng: this.newLocation.lng };
          this.showUpdateLocationModal = false;
          this.newLocation = { lat: 0, lng: 0 };
          this.messageService.showSuccess('Location updated successfully! 📍');
        },
        error: (err) => {
          console.error('Failed to update location:', err);
          this.messageService.showError('Failed to update location: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
