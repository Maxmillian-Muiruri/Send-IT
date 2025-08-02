import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ParcelService } from '../../core/services/parcel';
import { UserService } from '../../core/services/user';
import { CourierService } from '../../core/services/courier';
import { NotificationService, Notification } from '../../core/services/notification';
import { MessageService } from '../../core/services/message.service';
import { Parcel } from '../../shared/models/parcel.model';
import { User } from '../../shared/models/user.model';
import { Courier } from '../../shared/models/courier.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class AdminDashboardComponent implements OnInit {
  parcels: Parcel[] = [];
  users: User[] = [];
  couriers: Courier[] = [];
  loadingParcels = false;
  errorParcels: string | null = null;
  loadingUsers = false;
  errorUsers: string | null = null;
  loadingCouriers = false;
  errorCouriers: string | null = null;

  // Modal states
  showAssignModal = false;
  showAddParcelModal = false;
  showEditParcelModal = false;
  showAddUserModal = false;
  showEditUserModal = false;
  showAddCourierModal = false;
  showEditCourierModal = false;

  // Selected items
  selectedCourierId: string | null = null;
  selectedParcel: Parcel | null = null;
  selectedUser: User | null = null;
  selectedCourier: Courier | null = null;
  assigningParcel = false;

  // Forms
  parcelForm!: FormGroup;
  userForm!: FormGroup;
  courierForm!: FormGroup;

  // Menu state
  activeMenu: string = 'dashboard';

  // Notifications
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotificationsModal: boolean = false;
  notificationsLoading: boolean = false;

  // Stats
  stats = {
    totalParcels: 0,
    delivered: 0,
    inTransit: 0,
    pending: 0
  };

  constructor(
    private parcelService: ParcelService,
    private userService: UserService,
    private courierService: CourierService,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    console.log('🔐 Admin dashboard initializing...');
    // Check current user
    const currentUser = localStorage.getItem('sendit_user');
    const token = localStorage.getItem('token');
    console.log('🔐 Current user:', currentUser ? JSON.parse(currentUser) : 'No user found');
    console.log('🔐 Token exists:', !!token);
    
    this.loadAllData();
    this.loadNotifications();
    this.loadUnreadCount();
  }

  initializeForms() {
    this.parcelForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      receiverName: ['', Validators.required],
      receiverPhone: ['', Validators.required],
      weight: [0.5, [Validators.required, Validators.min(0.1)]],
      description: ['', Validators.required],
      pickupLocation: ['', Validators.required],
      destination: ['', Validators.required]
    });

    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''], // Make optional since User model doesn't have phone
      role: ['USER', Validators.required]
    });

    this.courierForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      vehicleType: ['MOTORCYCLE', Validators.required],
      licensePlate: ['', Validators.required]
    });
  }

  loadAllData() {
    this.loadParcels();
    this.loadUsers();
    this.loadCouriers();
    this.calculateStats();
  }

  loadParcels() {
    this.loadingParcels = true;
    this.errorParcels = null;
    console.log('🔄 Loading parcels...');
    this.parcelService.getParcels({ limit: 1000 }).subscribe({
      next: (response: { parcels: Parcel[], pagination: any }) => {
        console.log('✅ Parcels loaded:', response);
        this.parcels = response.parcels; // Extract parcels array from response
        this.loadingParcels = false;
        this.calculateStats();
      },
      error: (err) => {
        console.error('❌ Error loading parcels:', err);
        this.errorParcels = err.error?.message || 'Failed to load parcels.';
        this.loadingParcels = false;
      }
    });
  }

  loadUsers() {
    this.loadingUsers = true;
    this.errorUsers = null;
    console.log('🔄 Loading users...');
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        console.log('✅ Users loaded:', response);
        // Extract users array from response object
        this.users = response.users || response;
        this.loadingUsers = false;
      },
      error: (err) => {
        console.error('❌ Error loading users:', err);
        this.errorUsers = err.error?.message || 'Failed to load users.';
        this.loadingUsers = false;
      }
    });
  }

  loadCouriers() {
    this.loadingCouriers = true;
    this.errorCouriers = null;
    console.log('🔄 Loading couriers...');
    this.courierService.getCouriers().subscribe({
      next: (response: any) => {
        console.log('✅ Couriers loaded:', response);
        // Extract couriers array from response object
        this.couriers = response.couriers || response;
        this.loadingCouriers = false;
      },
      error: (err) => {
        console.error('❌ Error loading couriers:', err);
        this.errorCouriers = err.error?.message || 'Failed to load couriers.';
        this.loadingCouriers = false;
      }
    });
  }

  calculateStats() {
    this.stats = {
      totalParcels: this.parcels.length,
      delivered: this.parcels.filter(p => p.status === 'DELIVERED').length,
      inTransit: this.parcels.filter(p => ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(p.status)).length,
      pending: this.parcels.filter(p => p.status === 'PENDING').length
    };
  }

  // Parcel Management
  assignParcel() {
    if (this.selectedParcel && this.selectedCourierId) {
      this.assigningParcel = true;
      this.parcelService.assignParcelToCourier(this.selectedParcel.id, this.selectedCourierId).subscribe({
        next: () => {
          this.assigningParcel = false;
          this.showAssignModal = false;
          this.selectedCourierId = null;
          this.loadParcels();
          // Show success message instead of alert
          this.showSuccessMessage('Parcel assigned successfully!');
        },
        error: (err: any) => {
          this.assigningParcel = false;
          this.showErrorMessage('Failed to assign parcel: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  createParcel() {
    if (this.parcelForm.valid) {
      const formData = this.parcelForm.value;
      const parcelData = {
        receiverEmail: formData.receiverEmail,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        weight: formData.weight,
        description: formData.description,
        pickupAddress: {
          street: formData.pickupLocation,
          city: 'Nairobi',
          state: 'Nairobi',
          country: 'Kenya'
        },
        deliveryAddress: {
          street: formData.destination,
          city: 'Mombasa',
          state: 'Mombasa',
          country: 'Kenya'
        }
      };

      this.parcelService.createParcelComprehensive(parcelData).subscribe({
        next: () => {
          this.showAddParcelModal = false;
          this.parcelForm.reset();
          this.loadParcels();
          this.showSuccessMessage('Parcel created successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to create parcel: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  updateParcel() {
    if (this.selectedParcel && this.parcelForm.valid) {
      const formData = this.parcelForm.value;
      const updateData = {
        description: formData.description,
        weight: formData.weight
      };

      this.parcelService.updateParcel(this.selectedParcel.id, updateData).subscribe({
        next: () => {
          this.showEditParcelModal = false;
          this.selectedParcel = null;
          this.parcelForm.reset();
          this.loadParcels();
          this.showSuccessMessage('Parcel updated successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to update parcel: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteParcel(id: string) {
    if (confirm('Are you sure you want to delete this parcel?')) {
      this.parcelService.deleteParcel(id).subscribe({
        next: () => {
          this.loadParcels();
          this.showSuccessMessage('Parcel deleted successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to delete parcel: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // User Management
  createUser() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      this.userService.addUser(userData).subscribe({
        next: () => {
          this.showAddUserModal = false;
          this.userForm.reset({ role: 'USER' });
          this.loadUsers();
          this.showSuccessMessage('User created successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to create user: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  updateUser() {
    if (this.selectedUser && this.userForm.valid) {
      const userData = this.userForm.value;
      this.userService.updateUser(this.selectedUser.id, userData).subscribe({
        next: () => {
          this.showEditUserModal = false;
          this.selectedUser = null;
          this.userForm.reset({ role: 'USER' });
          this.loadUsers();
          this.showSuccessMessage('User updated successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to update user: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
          this.showSuccessMessage('User deleted successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to delete user: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // Courier Management
  createCourier() {
    if (this.courierForm.valid) {
      const courierData = this.courierForm.value;
      this.courierService.createCourier(courierData).subscribe({
        next: (response: any) => {
          this.showAddCourierModal = false;
          this.courierForm.reset({ vehicleType: 'MOTORCYCLE' });
          this.loadCouriers();
          
          // Show simple success message
          this.showSuccessMessage('Courier created and email sent with login credentials');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to create courier: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  updateCourier() {
    if (this.selectedCourier && this.courierForm.valid) {
      const courierData = this.courierForm.value;
      this.courierService.updateCourier(this.selectedCourier.id, courierData).subscribe({
        next: () => {
          this.showEditCourierModal = false;
          this.selectedCourier = null;
          this.courierForm.reset({ vehicleType: 'MOTORCYCLE' });
          this.loadCouriers();
          this.showSuccessMessage('Courier updated successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to update courier: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteCourier(id: string) {
    if (confirm('Are you sure you want to delete this courier?')) {
      this.courierService.deleteCourier(id).subscribe({
        next: () => {
          this.loadCouriers();
          this.showSuccessMessage('Courier deleted successfully!');
        },
        error: (err: any) => {
          this.showErrorMessage('Failed to delete courier: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // Status Management
  updateStatus(parcel: Parcel) {
    this.parcelService.updateParcelStatus(parcel.id, parcel.status).subscribe({
      next: () => {
        this.loadParcels();
        this.showSuccessMessage('Parcel status updated successfully!');
      },
      error: (err: any) => {
        this.showErrorMessage('Failed to update parcel status: ' + (err.error?.message || err.message));
      }
    });
  }

  // Modal Management
  openAddParcelModal() {
    this.parcelForm.reset();
    this.showAddParcelModal = true;
  }

  openEditParcelModal(parcel: Parcel) {
    this.selectedParcel = { ...parcel };
    this.parcelForm.patchValue({
      description: parcel.description,
      weight: parcel.weight,
      pickupLocation: parcel.pickupAddress?.line1 || '',
      destination: parcel.deliveryAddress?.line1 || ''
    });
    this.showEditParcelModal = true;
  }

  openAssignModal(parcel: Parcel) {
    this.selectedParcel = parcel;
    this.selectedCourierId = null;
    this.showAssignModal = true;
  }

  openAddUserModal() {
    this.userForm.reset({ role: 'USER' });
    this.showAddUserModal = true;
  }

  openEditUserModal(user: User) {
    this.selectedUser = { ...user };
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      phone: '', // User model doesn't have phone property
      role: user.role
    });
    this.showEditUserModal = true;
  }

  openAddCourierModal() {
    this.courierForm.reset({ vehicleType: 'MOTORCYCLE' });
    this.showAddCourierModal = true;
  }

  openEditCourierModal(courier: Courier) {
    this.selectedCourier = { ...courier };
    this.courierForm.patchValue({
      name: courier.user?.name || '',
      email: courier.user?.email || '',
      phone: courier.user?.phone || '',
      vehicleType: courier.vehicleType,
      licensePlate: courier.licensePlate
    });
    this.showEditCourierModal = true;
  }

  // Utility methods
  statusClass(status: string) {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'PICKED_UP': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  setActiveMenu(menu: string) {
    this.activeMenu = menu;
  }

  scrollToSection(sectionId: string, menu: string, event?: Event) {
    // Prevent default navigation behavior
    if (event) {
      event.preventDefault();
    }
    
    // Set the active menu
    this.setActiveMenu(menu);
    
    // Scroll to the section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
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
    
    // Redirect to landing page (not admin home)
    window.location.href = '/';
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

  showSuccessMessage(message: string) {
    this.messageService.showSuccess(message);
  }

  showErrorMessage(message: string) {
    this.messageService.showError(message);
  }
}
