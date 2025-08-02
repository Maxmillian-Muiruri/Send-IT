import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalyticsService, DashboardReport, AnalyticsPeriod } from '../../core/services/analytics';

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.html',
  styleUrls: ['./analytics-dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class AnalyticsDashboardComponent implements OnInit {
  dashboardReport: DashboardReport | null = null;
  loading = false;
  error: string | null = null;
  
  selectedPeriod: string = '30';
  customStartDate: string = '';
  customEndDate: string = '';
  
  activeTab: string = 'overview';
  
  // Chart data for visualization
  parcelStatusChartData: any[] = [];
  revenueChartData: any[] = [];
  dailyStatsChartData: any[] = [];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading = true;
    this.error = null;

    let period: AnalyticsPeriod | undefined;

    if (this.selectedPeriod === 'custom' && this.customStartDate && this.customEndDate) {
      period = {
        startDate: new Date(this.customStartDate),
        endDate: new Date(this.customEndDate)
      };
    } else if (this.selectedPeriod !== 'custom') {
      const days = parseInt(this.selectedPeriod);
      period = this.analyticsService.createPeriod(days);
    }

    this.analyticsService.getDashboardReport(period).subscribe({
      next: (report) => {
        this.dashboardReport = report;
        this.prepareChartData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load analytics:', err);
        this.error = 'Failed to load analytics data';
        this.loading = false;
      }
    });
  }

  prepareChartData() {
    if (!this.dashboardReport) return;

    // Prepare parcel status chart data
    this.parcelStatusChartData = this.dashboardReport.parcelAnalytics.statusDistribution.map(item => ({
      name: item.status,
      value: item.count,
      percentage: item.percentage
    }));

    // Prepare revenue chart data
    this.revenueChartData = this.dashboardReport.revenueAnalytics.revenueByStatus.map(item => ({
      name: item.status,
      value: item.revenue,
      percentage: item.percentage
    }));

    // Prepare daily stats chart data
    this.dailyStatsChartData = this.dashboardReport.parcelAnalytics.dailyStats.map(item => ({
      date: item.date,
      parcels: item.parcels,
      revenue: item.revenue,
      delivered: item.delivered
    }));
  }

  onPeriodChange() {
    this.loadAnalytics();
  }

  onCustomDateChange() {
    if (this.selectedPeriod === 'custom' && this.customStartDate && this.customEndDate) {
      this.loadAnalytics();
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  exportReport(type: string, format: 'csv' | 'json' = 'json') {
    let period: AnalyticsPeriod | undefined;

    if (this.selectedPeriod === 'custom' && this.customStartDate && this.customEndDate) {
      period = {
        startDate: new Date(this.customStartDate),
        endDate: new Date(this.customEndDate)
      };
    } else if (this.selectedPeriod !== 'custom') {
      const days = parseInt(this.selectedPeriod);
      period = this.analyticsService.createPeriod(days);
    }

    this.analyticsService.exportReport(type, format, period).subscribe({
      next: (response) => {
        this.downloadFile(response.data, response.filename, response.contentType);
      },
      error: (err) => {
        console.error('Failed to export report:', err);
        alert('Failed to export report');
      }
    });
  }

  private downloadFile(data: any, filename: string, contentType: string) {
    const blob = new Blob([data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#ffc107',
      'PICKED_UP': '#17a2b8',
      'IN_TRANSIT': '#007bff',
      'OUT_FOR_DELIVERY': '#6f42c1',
      'DELIVERED': '#28a745',
      'CANCELLED': '#dc3545',
      'RETURNED': '#fd7e14'
    };
    return colors[status] || '#6c757d';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
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
} 