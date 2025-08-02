import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AnalyticsService,
  AnalyticsPeriod,
} from '../services/analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../../generated/prisma';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  async getDashboardReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period: AnalyticsPeriod | undefined =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getDashboardReport(period);
  }

  @Get('parcels')
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  async getParcelAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period: AnalyticsPeriod | undefined =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getParcelAnalytics(period);
  }

  @Get('couriers')
  @Roles(UserRole.ADMIN)
  async getCourierAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period: AnalyticsPeriod | undefined =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getCourierAnalytics(period);
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  async getUserAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period: AnalyticsPeriod | undefined =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getUserAnalytics(period);
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN)
  async getRevenueAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period: AnalyticsPeriod | undefined =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getRevenueAnalytics(period);
  }

  @Get('system')
  @Roles(UserRole.ADMIN)
  async getSystemAnalytics() {
    return this.analyticsService.getSystemAnalytics();
  }

  @Get('reports/export')
  @Roles(UserRole.ADMIN)
  async exportReport(
    @Query('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: 'csv' | 'json' = 'json',
  ) {
    const period: AnalyticsPeriod | undefined =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    let data: any;

    switch (type) {
      case 'parcels':
        data = await this.analyticsService.getParcelAnalytics(period);
        break;
      case 'couriers':
        data = await this.analyticsService.getCourierAnalytics(period);
        break;
      case 'users':
        data = await this.analyticsService.getUserAnalytics(period);
        break;
      case 'revenue':
        data = await this.analyticsService.getRevenueAnalytics(period);
        break;
      case 'system':
        data = await this.analyticsService.getSystemAnalytics();
        break;
      case 'dashboard':
        data = await this.analyticsService.getDashboardReport(period);
        break;
      default:
        throw new Error('Invalid report type');
    }

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      return {
        data: this.convertToCSV(data),
        filename: `${type}_report_${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv',
      };
    }

    return {
      data,
      filename: `${type}_report_${new Date().toISOString().split('T')[0]}.json`,
      contentType: 'application/json',
    };
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion - in production, you'd want a more robust solution
    if (Array.isArray(data)) {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map((header) => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      }

      return csvRows.join('\n');
    }

    // For non-array data, convert to flat structure
    const flatData = this.flattenObject(data);
    const headers = Object.keys(flatData);
    const values = headers.map((header) => {
      const value = flatData[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });

    return [headers.join(','), values.join(',')].join('\n');
  }

  private flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }

    return flattened;
  }
}
