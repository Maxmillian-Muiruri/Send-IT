import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../../generated/prisma';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  parcelId?: string;
  courierId?: string;
  expiresAt?: Date;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
  read: boolean;
  emailSent: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    try {
      // Create notification in database
      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: dto.data,
          priority: dto.priority || NotificationPriority.MEDIUM,
          channel: dto.channel || NotificationChannel.BOTH,
          parcelId: dto.parcelId,
          courierId: dto.courierId,
          expiresAt: dto.expiresAt,
        },
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
              totalCost: true,
              estimatedDeliveryTime: true,
            },
          },
          courier: {
            select: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Send email if channel includes email
      if (
        dto.channel === NotificationChannel.EMAIL ||
        dto.channel === NotificationChannel.BOTH
      ) {
        await this.sendNotificationEmail(notification);
      }

      this.logger.log(
        `Notification created: ${notification.id} for user: ${dto.userId}`,
      );

      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        read: notification.read,
        emailSent: notification.emailSent,
        createdAt: notification.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  async deleteExpiredNotifications(): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  // Automatic notification triggers
  async notifyParcelCreated(
    parcelId: string,
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
      },
    });

    if (!parcel) return;

    // Notify sender
    await this.createNotification({
      userId: senderId,
      type: NotificationType.PARCEL_CREATED,
      title: 'Parcel Created Successfully',
      message: `Your parcel with tracking code ${parcel.trackingCode} has been created successfully.`,
      data: { trackingCode: parcel.trackingCode, totalCost: parcel.totalCost },
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.BOTH,
      parcelId,
    });

    // Notify receiver with different message
    await this.createNotification({
      userId: receiverId,
      type: NotificationType.PARCEL_CREATED,
      title: 'Parcel Coming Your Way',
      message: `A parcel with tracking code ${parcel.trackingCode} has been sent to you.`,
      data: { trackingCode: parcel.trackingCode },
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.BOTH,
      parcelId,
    });
  }

  async notifyParcelAssigned(
    parcelId: string,
    courierId: string,
  ): Promise<void> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        courier: {
          select: {
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
        pickupAddress: { select: { formattedAddress: true } },
        deliveryAddress: { select: { formattedAddress: true } },
      },
    });

    if (!parcel || !parcel.courier) return;

    // Notify sender
    await this.createNotification({
      userId: parcel.senderId,
      type: NotificationType.PARCEL_ASSIGNED,
      title: 'Courier Assigned',
      message: `A courier has been assigned to your parcel ${parcel.trackingCode}.`,
      data: {
        trackingCode: parcel.trackingCode,
        courierName: parcel.courier.user.name,
      },
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.BOTH,
      parcelId,
      courierId,
    });

    // Notify receiver
    await this.createNotification({
      userId: parcel.receiverId,
      type: NotificationType.PARCEL_ASSIGNED,
      title: 'Courier Assigned',
      message: `A courier has been assigned to deliver your parcel ${parcel.trackingCode}.`,
      data: {
        trackingCode: parcel.trackingCode,
        courierName: parcel.courier.user.name,
      },
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.BOTH,
      parcelId,
      courierId,
    });

    // Notify courier with detailed assignment email
    await this.createNotification({
      userId: parcel.courier.userId,
      type: NotificationType.PARCEL_ASSIGNED,
      title: 'New Parcel Assignment',
      message: `You have been assigned to deliver parcel ${parcel.trackingCode}.`,
      data: {
        trackingCode: parcel.trackingCode,
        pickupAddressId: parcel.pickupAddressId,
        deliveryAddressId: parcel.deliveryAddressId,
      },
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.BOTH,
      parcelId,
      courierId: parcel.courierId || undefined,
    });
  }

  async notifyParcelStatusUpdate(
    parcelId: string,
    status: string,
    statusDescription: string,
    channel: NotificationChannel = NotificationChannel.BOTH,
  ): Promise<void> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        courier: {
          select: {
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!parcel) return;

    const notificationType = this.getNotificationTypeForStatus(status);
    const title = `Parcel Status Update: ${status}`;

    // Notify sender
    await this.createNotification({
      userId: parcel.senderId,
      type: notificationType,
      title,
      message: `Your parcel ${parcel.trackingCode} status: ${statusDescription}`,
      data: {
        trackingCode: parcel.trackingCode,
        status,
        statusDescription,
      },
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.BOTH,
      parcelId,
    });

    // Notify receiver
    await this.createNotification({
      userId: parcel.receiverId,
      type: notificationType,
      title,
      message: `Parcel ${parcel.trackingCode} status: ${statusDescription}`,
      data: {
        trackingCode: parcel.trackingCode,
        status,
        statusDescription,
      },
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.BOTH,
      parcelId,
    });

    // Notify courier if assigned
    if (parcel.courier) {
      await this.createNotification({
        userId: parcel.courier.userId,
        type: notificationType,
        title,
        message: `Parcel ${parcel.trackingCode} status: ${statusDescription}`,
        data: {
          trackingCode: parcel.trackingCode,
          status,
          statusDescription,
        },
        priority: NotificationPriority.MEDIUM,
        channel: NotificationChannel.BOTH,
        parcelId,
        courierId: parcel.courierId || undefined,
      });
    }
  }

  private async sendNotificationEmail(notification: any): Promise<void> {
    try {
      let emailSent = false;

      switch (notification.type) {
        case NotificationType.PARCEL_CREATED:
          // Check if this is a receiver notification (different title)
          if (notification.title === 'Parcel Coming Your Way') {
            // This is for the receiver - fetch complete parcel data with sender info
            const completeParcel = await this.prisma.parcel.findUnique({
              where: { id: notification.parcelId },
              include: {
                sender: { select: { name: true, email: true } },
                receiver: { select: { name: true, email: true } },
              },
            });

            emailSent =
              await this.emailService.sendParcelReceiverNotificationEmail(
                notification.user.email,
                notification.user.name,
                {
                  trackingCode: completeParcel?.trackingCode || '',
                  description: completeParcel?.description || '',
                  senderName: completeParcel?.sender?.name || 'Unknown Sender',
                  senderEmail: completeParcel?.sender?.email || '',
                },
              );
          } else {
            // This is for the sender
            emailSent = await this.emailService.sendParcelCreatedEmail(
              notification.user.email,
              notification.user.name,
              {
                trackingCode: notification.parcel?.trackingCode,
                description: notification.parcel?.description,
                totalCost: notification.parcel?.totalCost,
                estimatedDeliveryTime:
                  notification.parcel?.estimatedDeliveryTime,
              },
            );
          }
          break;

        case NotificationType.PARCEL_ASSIGNED:
          // Check if this is a courier notification (different title)
          if (notification.title === 'New Parcel Assignment') {
            // This is for the courier - fetch complete parcel data with addresses
            const completeParcel = await this.prisma.parcel.findUnique({
              where: { id: notification.parcelId },
              include: {
                sender: { select: { name: true, email: true } },
                receiver: { select: { name: true, email: true } },
                pickupAddress: { select: { formattedAddress: true } },
                deliveryAddress: { select: { formattedAddress: true } },
              },
            });

            emailSent = await this.emailService.sendCourierAssignmentEmail(
              notification.user.email,
              notification.user.name,
              {
                trackingCode: completeParcel?.trackingCode || '',
                description: completeParcel?.description || '',
                senderEmail: completeParcel?.sender?.email || '',
                senderName: completeParcel?.sender?.name || '',
                receiverEmail: completeParcel?.receiver?.email || '',
                receiverName: completeParcel?.receiver?.name || '',
                pickupAddress:
                  completeParcel?.pickupAddress?.formattedAddress || undefined,
                deliveryAddress:
                  completeParcel?.deliveryAddress?.formattedAddress ||
                  undefined,
                totalCost: completeParcel?.totalCost || 0,
                estimatedDeliveryTime:
                  completeParcel?.estimatedDeliveryTime || 0,
                weight: completeParcel?.weight || 0,
              },
            );
          } else {
            // This is for sender/receiver - send regular assignment email
            emailSent = await this.emailService.sendParcelAssignedEmail(
              notification.user.email,
              notification.user.name,
              {
                trackingCode: notification.parcel?.trackingCode,
                courierName: notification.courier?.user?.name,
                courierPhone: notification.courier?.user?.phone,
              },
            );
          }
          break;

        case NotificationType.PARCEL_DELIVERED:
          emailSent = await this.emailService.sendParcelDeliveredEmail(
            notification.user.email,
            notification.user.name,
            {
              trackingCode: notification.parcel?.trackingCode,
              deliveredAt: new Date(),
            },
          );
          break;

        default:
          // For other status updates
          emailSent = await this.emailService.sendParcelStatusUpdateEmail(
            notification.user.email,
            notification.user.name,
            {
              trackingCode: notification.parcel?.trackingCode,
              status: notification.data?.status || 'Updated',
              statusDescription: notification.message,
            },
          );
          break;
      }

      // Update email status
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailSent,
          emailSentAt: emailSent ? new Date() : null,
          emailError: emailSent ? null : 'Failed to send email',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send notification email: ${error.message}`);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailSent: false,
          emailError: error.message,
        },
      });
    }
  }

  private getNotificationTypeForStatus(status: string): NotificationType {
    switch (status) {
      case 'PICKED_UP':
        return NotificationType.PARCEL_PICKED_UP;
      case 'IN_TRANSIT':
        return NotificationType.PARCEL_IN_TRANSIT;
      case 'DELIVERED':
        return NotificationType.PARCEL_DELIVERED;
      case 'CANCELLED':
        return NotificationType.PARCEL_CANCELLED;
      default:
        return NotificationType.DELIVERY_UPDATE;
    }
  }
}
