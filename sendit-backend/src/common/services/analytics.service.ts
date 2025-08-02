import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}

export interface ParcelAnalytics {
  totalParcels: number;
  deliveredParcels: number;
  inTransitParcels: number;
  pendingParcels: number;
  cancelledParcels: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  revenue: number;
  averageParcelValue: number;
  topRoutes: Array<{
    route: string;
    count: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;
    parcels: number;
    revenue: number;
    delivered: number;
  }>;
}

export interface CourierAnalytics {
  totalCouriers: number;
  activeCouriers: number;
  totalDeliveries: number;
  averageDeliveriesPerCourier: number;
  topPerformers: Array<{
    courierId: string;
    courierName: string;
    deliveries: number;
    revenue: number;
    rating: number;
  }>;
  courierEfficiency: Array<{
    courierId: string;
    courierName: string;
    efficiency: number;
    averageDeliveryTime: number;
  }>;
  courierStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    parcelsSent: number;
    parcelsReceived: number;
    totalSpent: number;
  }>;
  userActivity: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    parcels: number;
  }>;
  revenueByStatus: Array<{
    status: string;
    revenue: number;
    percentage: number;
  }>;
  topRevenueRoutes: Array<{
    route: string;
    revenue: number;
    parcels: number;
  }>;
}

export interface SystemAnalytics {
  totalNotifications: number;
  unreadNotifications: number;
  notificationStats: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  systemPerformance: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive parcel analytics
   */
  async getParcelAnalytics(period?: AnalyticsPeriod): Promise<ParcelAnalytics> {
    const whereClause = period
      ? {
          createdAt: {
            gte: period.startDate,
            lte: period.endDate,
          },
        }
      : {};

    const [
      totalParcels,
      deliveredParcels,
      inTransitParcels,
      pendingParcels,
      cancelledParcels,
      statusDistribution,
      topRoutes,
      dailyStats,
      revenueData,
    ] = await Promise.all([
      this.prisma.parcel.count({ where: whereClause }),
      this.prisma.parcel.count({
        where: { ...whereClause, status: 'DELIVERED' },
      }),
      this.prisma.parcel.count({
        where: { ...whereClause, status: 'IN_TRANSIT' },
      }),
      this.prisma.parcel.count({
        where: { ...whereClause, status: 'PENDING' },
      }),
      this.prisma.parcel.count({
        where: { ...whereClause, status: 'CANCELLED' },
      }),
      this.getStatusDistribution(whereClause),
      this.getTopRoutes(whereClause),
      this.getDailyStats(whereClause),
      this.getRevenueData(whereClause),
    ]);

    const deliveryRate =
      totalParcels > 0 ? (deliveredParcels / totalParcels) * 100 : 0;
    const averageDeliveryTime =
      await this.calculateAverageDeliveryTime(whereClause);
    const revenue = revenueData.totalRevenue;
    const averageParcelValue = totalParcels > 0 ? revenue / totalParcels : 0;

    return {
      totalParcels,
      deliveredParcels,
      inTransitParcels,
      pendingParcels,
      cancelledParcels,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      averageDeliveryTime,
      revenue,
      averageParcelValue: Math.round(averageParcelValue * 100) / 100,
      topRoutes,
      statusDistribution,
      dailyStats,
    };
  }

  /**
   * Get comprehensive courier analytics
   */
  async getCourierAnalytics(
    period?: AnalyticsPeriod,
  ): Promise<CourierAnalytics> {
    const whereClause = period
      ? {
          createdAt: {
            gte: period.startDate,
            lte: period.endDate,
          },
        }
      : {};

    const [
      totalCouriers,
      activeCouriers,
      totalDeliveries,
      courierStatusDistribution,
      topPerformers,
      courierEfficiency,
    ] = await Promise.all([
      this.prisma.courier.count(),
      this.prisma.courier.count({ where: { isActive: true } }),
      this.prisma.parcel.count({
        where: { ...whereClause, status: 'DELIVERED' },
      }),
      this.getCourierStatusDistribution(),
      this.getTopPerformers(whereClause),
      this.getCourierEfficiency(whereClause),
    ]);

    const averageDeliveriesPerCourier =
      activeCouriers > 0 ? totalDeliveries / activeCouriers : 0;

    return {
      totalCouriers,
      activeCouriers,
      totalDeliveries,
      averageDeliveriesPerCourier:
        Math.round(averageDeliveriesPerCourier * 100) / 100,
      topPerformers,
      courierEfficiency,
      courierStatusDistribution,
    };
  }

  /**
   * Get comprehensive user analytics
   */
  async getUserAnalytics(period?: AnalyticsPeriod): Promise<UserAnalytics> {
    const whereClause = period
      ? {
          createdAt: {
            gte: period.startDate,
            lte: period.endDate,
          },
        }
      : {};

    const [totalUsers, activeUsers, newUsers, userActivity, topUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.getActiveUsers(whereClause),
        this.getNewUsers(whereClause),
        this.getUserActivity(whereClause),
        this.getTopUsers(whereClause),
      ]);

    const userGrowth = totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      userGrowth: Math.round(userGrowth * 100) / 100,
      topUsers,
      userActivity,
    };
  }

  /**
   * Get comprehensive revenue analytics
   */
  async getRevenueAnalytics(
    period?: AnalyticsPeriod,
  ): Promise<RevenueAnalytics> {
    const whereClause = period
      ? {
          createdAt: {
            gte: period.startDate,
            lte: period.endDate,
          },
        }
      : {};

    const [revenueData, revenueByMonth, revenueByStatus, topRevenueRoutes] =
      await Promise.all([
        this.getRevenueData(whereClause),
        this.getRevenueByMonth(whereClause),
        this.getRevenueByStatus(whereClause),
        this.getTopRevenueRoutes(whereClause),
      ]);

    const totalRevenue = revenueData.totalRevenue;
    const averageOrderValue =
      revenueData.totalParcels > 0
        ? totalRevenue / revenueData.totalParcels
        : 0;
    const revenueGrowth = await this.calculateRevenueGrowth(whereClause);

    return {
      totalRevenue,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      revenueByMonth,
      revenueByStatus,
      topRevenueRoutes,
    };
  }

  /**
   * Get system analytics
   */
  async getSystemAnalytics(): Promise<SystemAnalytics> {
    const [totalNotifications, unreadNotifications, notificationStats] =
      await Promise.all([
        this.prisma.notification.count(),
        this.prisma.notification.count({ where: { read: false } }),
        this.getNotificationStats(),
      ]);

    return {
      totalNotifications,
      unreadNotifications,
      notificationStats,
      systemPerformance: {
        averageResponseTime: 150, // Mock data - would be real metrics in production
        errorRate: 0.5, // Mock data
        uptime: 99.9, // Mock data
      },
    };
  }

  /**
   * Generate comprehensive dashboard report
   */
  async getDashboardReport(period?: AnalyticsPeriod) {
    const [
      parcelAnalytics,
      courierAnalytics,
      userAnalytics,
      revenueAnalytics,
      systemAnalytics,
    ] = await Promise.all([
      this.getParcelAnalytics(period),
      this.getCourierAnalytics(period),
      this.getUserAnalytics(period),
      this.getRevenueAnalytics(period),
      this.getSystemAnalytics(),
    ]);

    return {
      parcelAnalytics,
      courierAnalytics,
      userAnalytics,
      revenueAnalytics,
      systemAnalytics,
      generatedAt: new Date(),
      period: period || {
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
      },
    };
  }

  // Private helper methods
  private async getStatusDistribution(whereClause: any) {
    const statuses = await this.prisma.parcel.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true },
    });

    const total = statuses.reduce((sum, item) => sum + item._count.status, 0);

    return statuses.map((item) => ({
      status: item.status,
      count: item._count.status,
      percentage:
        total > 0
          ? Math.round((item._count.status / total) * 100 * 100) / 100
          : 0,
    }));
  }

  private async getTopRoutes(whereClause: any) {
    const routes = await this.prisma.parcel.groupBy({
      by: ['pickupAddressId', 'deliveryAddressId'],
      where: whereClause,
      _count: { id: true },
      _sum: { totalCost: true },
    });

    // This would need to be enhanced to get actual address details
    return routes.slice(0, 10).map((route) => ({
      route: `Route ${route.pickupAddressId}-${route.deliveryAddressId}`,
      count: route._count.id,
      revenue: route._sum.totalCost || 0,
    }));
  }

  private async getDailyStats(whereClause: any) {
    const dailyStats = await this.prisma.parcel.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _count: { id: true },
      _sum: { totalCost: true },
    });

    return dailyStats.map((stat) => ({
      date: stat.createdAt.toISOString().split('T')[0],
      parcels: stat._count.id,
      revenue: stat._sum.totalCost || 0,
      delivered: 0, // Would need additional query for delivered parcels per day
    }));
  }

  private async getRevenueData(whereClause: any) {
    const revenueData = await this.prisma.parcel.aggregate({
      where: whereClause,
      _sum: { totalCost: true },
      _count: { id: true },
    });

    return {
      totalRevenue: revenueData._sum.totalCost || 0,
      totalParcels: revenueData._count.id,
    };
  }

  private async calculateAverageDeliveryTime(whereClause: any) {
    const deliveredParcels = await this.prisma.parcel.findMany({
      where: { ...whereClause, status: 'DELIVERED' },
      select: { createdAt: true, updatedAt: true },
    });

    if (deliveredParcels.length === 0) return 0;

    const totalTime = deliveredParcels.reduce((sum, parcel) => {
      const deliveryTime =
        parcel.updatedAt.getTime() - parcel.createdAt.getTime();
      return sum + deliveryTime;
    }, 0);

    return Math.round(
      totalTime / deliveredParcels.length / (1000 * 60 * 60 * 24),
    ); // Days
  }

  private async getCourierStatusDistribution() {
    const statuses = await this.prisma.courier.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const total = statuses.reduce((sum, item) => sum + item._count.status, 0);

    return statuses.map((item) => ({
      status: item.status,
      count: item._count.status,
      percentage:
        total > 0
          ? Math.round((item._count.status / total) * 100 * 100) / 100
          : 0,
    }));
  }

  private async getTopPerformers(whereClause: any) {
    const performers = await this.prisma.parcel.groupBy({
      by: ['courierId'],
      where: { ...whereClause, status: 'DELIVERED' },
      _count: { id: true },
      _sum: { totalCost: true },
    });

    return performers.slice(0, 10).map((performer) => ({
      courierId: performer.courierId || 'Unknown',
      courierName: 'Courier', // Would need to join with courier data
      deliveries: performer._count.id,
      revenue: performer._sum.totalCost || 0,
      rating: 4.5, // Mock data - would be real rating
    }));
  }

  private async getCourierEfficiency(whereClause: any) {
    // Mock data - would calculate real efficiency metrics
    return [];
  }

  private async getActiveUsers(whereClause: any) {
    // Count users who have sent or received parcels in the period
    const activeUsers = await this.prisma.parcel.groupBy({
      by: ['senderId'],
      where: whereClause,
    });

    return activeUsers.length;
  }

  private async getNewUsers(whereClause: any) {
    return this.prisma.user.count({ where: whereClause });
  }

  private async getUserActivity(whereClause: any) {
    // Mock data - would calculate real user activity
    return [];
  }

  private async getTopUsers(whereClause: any) {
    const topUsers = await this.prisma.parcel.groupBy({
      by: ['senderId'],
      where: whereClause,
      _count: { id: true },
      _sum: { totalCost: true },
    });

    return topUsers.slice(0, 10).map((user) => ({
      userId: user.senderId || 'Unknown',
      userName: 'User', // Would need to join with user data
      parcelsSent: user._count.id,
      parcelsReceived: 0, // Would need separate query
      totalSpent: user._sum.totalCost || 0,
    }));
  }

  private async getRevenueByMonth(whereClause: any) {
    // Mock data - would calculate real monthly revenue
    return [];
  }

  private async getRevenueByStatus(whereClause: any) {
    const revenueByStatus = await this.prisma.parcel.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { totalCost: true },
    });

    const totalRevenue = revenueByStatus.reduce(
      (sum, item) => sum + (item._sum.totalCost || 0),
      0,
    );

    return revenueByStatus.map((item) => ({
      status: item.status,
      revenue: item._sum.totalCost || 0,
      percentage:
        totalRevenue > 0
          ? Math.round(
              ((item._sum.totalCost || 0) / totalRevenue) * 100 * 100,
            ) / 100
          : 0,
    }));
  }

  private async getTopRevenueRoutes(whereClause: any) {
    // Mock data - would calculate real top revenue routes
    return [];
  }

  private async calculateRevenueGrowth(whereClause: any) {
    // Mock data - would calculate real revenue growth
    return 15.5;
  }

  private async getNotificationStats() {
    const stats = await this.prisma.notification.groupBy({
      by: ['type'],
      _count: { type: true },
    });

    const total = stats.reduce((sum, item) => sum + item._count.type, 0);

    return stats.map((item) => ({
      type: item.type,
      count: item._count.type,
      percentage:
        total > 0
          ? Math.round((item._count.type / total) * 100 * 100) / 100
          : 0,
    }));
  }
}
