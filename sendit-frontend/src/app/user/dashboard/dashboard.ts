import { Component, OnInit, OnDestroy } from '@angular/core';
import { ParcelService } from '../../core/services/parcel';
import { NotificationService, Notification } from '../../core/services/notification';
import { MessageService } from '../../core/services/message.service';
import { Parcel } from '../../shared/models/parcel.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  parcels: Parcel[] = [];
  userEmail: string | null = null;
  error: string | null = null;
  loading = false;
  searchTerm: string = '';
  activity: any[] = [];
  filteredActivity: any[] = [];
  selectedParcel: Parcel | null = null;
  showModal = false;
  
  // Notification properties
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotificationsModal: boolean = false;
  notificationsLoading: boolean = false;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  paginatedActivity: any[] = [];
  
  stats = [
    { title: 'Sent Parcels', number: 0, icon: 'sent-icon', change: 0 },
    { title: 'Received Parcels', number: 0, icon: 'received-icon', change: 0 },
    { title: 'In Transit', number: 0, icon: 'intransit-icon', change: 0 },
    { title: 'Delivered', number: 0, icon: 'delivered-icon', change: 0 }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private parcelService: ParcelService,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private router: Router
  ) {
    // Listen for navigation events to refresh data when returning to dashboard
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/user/dashboard') {
        console.log('🔄 Refreshing dashboard data...');
        this.loadAllUserParcels();
      }
    });
  }

  ngOnInit() {
    const userStr = localStorage.getItem('sendit_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.userEmail = user.email;
      console.log("�� Current user email:", this.userEmail);
      console.log("�� Current user ID:", user.id);
    }
    this.loading = true;
    this.error = null;
    
    // Load all parcels for the user with high limit to bypass pagination
    this.loadAllUserParcels();
    
    // Load notifications
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadAllUserParcels() {
    const userStr = localStorage.getItem('sendit_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    if (!userId) {
      console.error('❌ No user ID found');
      this.loading = false;
      return;
    }

    console.log('🔄 Loading all parcels for user ID:', userId);

    // Request a very high limit to get all parcels (1000 should be enough)
    this.parcelService.getParcels({ limit: 1000 }).subscribe({
      next: (response: any) => {
        console.log("📦 All parcels response:", response);
        
        let parcels = [];
        if (response.parcels) {
          parcels = response.parcels;
        } else if (Array.isArray(response)) {
          parcels = response;
        }
        
        console.log("📦 Total parcels fetched:", parcels.length);
        
        // Filter parcels for this user
        this.parcels = parcels.filter((p: any) => 
          p.senderId === userId || p.receiverId === userId ||
          (p.sender?.email === this.userEmail || p.receiver?.email === this.userEmail) ||
          (p.senderEmail === this.userEmail || p.receiverEmail === this.userEmail)
        );
        
        console.log('📦 Filtered parcels for user:', this.parcels.length);
        console.log('📦 Parcel details:', this.parcels.map(p => ({
          id: p.id,
          senderId: p.senderId,
          receiverId: p.receiverId,
          senderEmail: p.sender?.email,
          receiverEmail: p.receiver?.email,
          status: p.status
        })));
        
        // For demo: populate activity from parcels
        this.activity = this.parcels.map(p => ({
          trackingId: p.trackingCode || p.id,
          recipient: p.receiver?.name || p.receiverEmail || 'Unknown',
          status: p.status,
          statusClass: p.status === 'DELIVERED' ? 'delivered' : (p.status === 'IN_TRANSIT' ? 'in-transit' : 'pending'),
          date: p.updatedAt || p.createdAt || new Date()
        }));
        this.filteredActivity = [...this.activity];

        // Initialize pagination
        this.updatePagination();

        // Calculate real statistics from fetched data
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching parcels:', err);
        this.error = err.message || 'Failed to load parcels.';
        this.loading = false;
      }
    });
  }

  checkForRefresh() {
    const shouldRefresh = localStorage.getItem('refresh_dashboard');
    if (shouldRefresh === 'true') {
      console.log('🔄 Dashboard refresh triggered');
      localStorage.removeItem('refresh_dashboard');
      setTimeout(() => this.loadAllUserParcels(), 1000); // Small delay to ensure backend has processed
    }
  }

  // Method to refresh data when returning to dashboard
  refreshData() {
    this.loadAllUserParcels();
    
    // Check if we need to refresh (e.g., after sending a parcel)
    this.checkForRefresh();
  }

  loadParcels() {
    // Use the new method
    this.loadAllUserParcels();
  }

  calculateStats() {
    if (!this.userEmail) return;

    // Get user ID from localStorage if available
    const userStr = localStorage.getItem('sendit_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    // Filter parcels - check both ID and email relationships
    const sentParcels = this.parcels.filter((p: any) => 
      p.senderId === userId || 
      p.sender?.email === this.userEmail ||
      p.senderEmail === this.userEmail
    );
    
    const receivedParcels = this.parcels.filter((p: any) => 
      p.receiverId === userId || 
      p.receiver?.email === this.userEmail ||
      p.receiverEmail === this.userEmail
    );
    
    const inTransitParcels = this.parcels.filter((p: any) => p.status === "IN_TRANSIT");
    const deliveredParcels = this.parcels.filter((p: any) => p.status === "DELIVERED");

    console.log('�� Debug - User ID:', userId);
    console.log('�� Debug - User Email:', this.userEmail);
    console.log('🔍 Debug - Total parcels:', this.parcels.length);
    console.log('🔍 Debug - Sent parcels found:', sentParcels.length);
    console.log('🔍 Debug - Received parcels found:', receivedParcels.length);

    // Update stats with real data
    this.stats = [
      { 
        title: "Sent Parcels", 
        number: sentParcels.length, 
        icon: "sent-icon", 
        change: 0 
      },
      { 
        title: "Received Parcels", 
        number: receivedParcels.length, 
        icon: "received-icon", 
        change: 0 
      },
      { 
        title: "In Transit", 
        number: inTransitParcels.length, 
        icon: "intransit-icon", 
        change: 0 
      },
      { 
        title: "Delivered", 
        number: deliveredParcels.length, 
        icon: "delivered-icon", 
        change: 0 
      }
    ];
  }

  // Pagination methods
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredActivity.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.currentPage = Math.max(1, this.currentPage);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedActivity = this.filteredActivity.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  filterActivity() {
    this.filteredActivity = this.activity.filter(a =>
      a.trackingId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      a.recipient.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1; // Reset to first page when filtering
    this.updatePagination();
  }

  viewParcel(activity: any) {
    // Find the actual parcel object from the parcels array
    this.selectedParcel = this.parcels.find((p: any) => 
      (p.trackingCode || p.id) === activity.trackingId
    ) || null;
    
    if (this.selectedParcel) {
      this.showModal = true;
    } else {
      alert('Parcel details not found');
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedParcel = null;
  }

  trackParcel(activity: any) {
    // Navigate to track parcel page with the tracking ID
    this.router.navigate(['/user/track'], { 
      queryParams: { trackingId: activity.trackingId } 
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

  // Helper method for template
  getMath() {
    return Math;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
}