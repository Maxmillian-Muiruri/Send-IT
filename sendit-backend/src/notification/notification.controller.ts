import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole } from '../../generated/prisma';

interface UserJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async getUserNotifications(
    @User() user: UserJwtPayload,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('unreadOnly') unreadOnly: string = 'false',
  ) {
    return this.notificationService.getUserNotifications(
      user.userId,
      parseInt(page),
      parseInt(limit),
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async getUnreadCount(@User() user: UserJwtPayload) {
    const count = await this.notificationService.getUnreadCount(user.userId);
    return { unreadCount: count };
  }

  @Put(':id/read')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async markAsRead(@Param('id') id: string, @User() user: UserJwtPayload) {
    await this.notificationService.markAsRead(id, user.userId);

    // Return the updated notification
    const notification = await this.notificationService[
      'prisma'
    ].notification.findFirst({
      where: { id, userId: user.userId },
      include: {
        parcel: {
          select: {
            trackingCode: true,
            description: true,
          },
        },
        courier: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return notification;
  }

  @Put('mark-all-read')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async markAllAsRead(@User() user: UserJwtPayload) {
    await this.notificationService.markAllAsRead(user.userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.COURIER)
  async deleteNotification(
    @Param('id') id: string,
    @User() user: UserJwtPayload,
  ) {
    await this.notificationService.deleteNotification(id, user.userId);
    return { message: 'Notification deleted' };
  }

  // Admin endpoints
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAllNotifications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('read') read?: string,
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (read !== undefined) where.read = read === 'true';

    const [notifications, total] = await Promise.all([
      this.notificationService['prisma'].notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          parcel: {
            select: {
              trackingCode: true,
              description: true,
            },
          },
          courier: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.notificationService['prisma'].notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  @Post('admin/system-alert')
  @Roles(UserRole.ADMIN)
  async sendSystemAlert(
    @Body()
    body: {
      title: string;
      message: string;
      priority: string;
      userIds?: string[];
      sendToAll?: boolean;
    },
  ) {
    const { title, message, priority, userIds, sendToAll } = body;

    if (sendToAll) {
      // Send to all users
      const users = await this.notificationService['prisma'].user.findMany({
        select: { id: true },
      });

      const notifications: any[] = [];
      for (const user of users) {
        const notification = await this.notificationService.createNotification({
          userId: user.id,
          type: 'SYSTEM_ALERT' as any,
          title,
          message,
          data: { priority },
          priority: priority as any,
          channel: 'BOTH' as any,
        });
        notifications.push(notification);
      }

      return {
        message: `System alert sent to ${users.length} users`,
        notificationsCount: notifications.length,
      };
    } else if (userIds && userIds.length > 0) {
      // Send to specific users
      const notifications: any[] = [];
      for (const userId of userIds) {
        const notification = await this.notificationService.createNotification({
          userId,
          type: 'SYSTEM_ALERT' as any,
          title,
          message,
          data: { priority },
          priority: priority as any,
          channel: 'BOTH' as any,
        });
        notifications.push(notification);
      }

      return {
        message: `System alert sent to ${userIds.length} users`,
        notificationsCount: notifications.length,
      };
    }

    throw new Error('Either sendToAll or userIds must be provided');
  }

  @Delete('admin/expired')
  @Roles(UserRole.ADMIN)
  async deleteExpiredNotifications() {
    const count = await this.notificationService.deleteExpiredNotifications();
    return {
      message: `${count} expired notifications deleted`,
      deletedCount: count,
    };
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  async getNotificationStats() {
    const [
      totalNotifications,
      unreadNotifications,
      todayNotifications,
      thisWeekNotifications,
      thisMonthNotifications,
      notificationsByType,
      emailSuccessRate,
    ] = await Promise.all([
      this.notificationService['prisma'].notification.count(),
      this.notificationService['prisma'].notification.count({
        where: { read: false },
      }),
      this.notificationService['prisma'].notification.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.notificationService['prisma'].notification.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      this.notificationService['prisma'].notification.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.notificationService['prisma'].notification.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.notificationService['prisma'].notification.groupBy({
        by: ['emailSent'],
        _count: { emailSent: true },
      }),
    ]);

    const emailSuccess =
      emailSuccessRate.find((r) => r.emailSent)?._count.emailSent || 0;
    const emailFailed =
      emailSuccessRate.find((r) => !r.emailSent)?._count.emailSent || 0;
    const totalEmails = emailSuccess + emailFailed;
    const successRate =
      totalEmails > 0 ? (emailSuccess / totalEmails) * 100 : 0;

    return {
      totalNotifications,
      unreadNotifications,
      todayNotifications,
      thisWeekNotifications,
      thisMonthNotifications,
      notificationsByType: notificationsByType.map((item) => ({
        type: item.type,
        count: item._count.type,
      })),
      emailStats: {
        totalSent: emailSuccess,
        totalFailed: emailFailed,
        successRate: Math.round(successRate * 100) / 100,
      },
    };
  }
}
