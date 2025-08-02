import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('MAIL_HOST'),
        port: this.configService.get('MAIL_PORT'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.configService.get('MAIL_USER'),
          pass: this.configService.get('MAIL_PASS'),
        },
        // Add timeout settings to prevent hanging
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000, // 10 seconds
        socketTimeout: 10000, // 10 seconds
      });

      // Verify connection with timeout
      await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 10000),
        ),
      ]);
      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service:', error);
      // Don't throw the error, just log it and continue
      // The service will still work, but emails will fail gracefully
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Check if transporter is available
      if (!this.transporter) {
        this.logger.warn(
          'Email transporter not available, skipping email send',
        );
        return false;
      }

      const mailOptions = {
        from: emailData.from || this.configService.get('MAIL_FROM'),
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${emailData.to}: ${result.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      return false;
    }
  }

  // Notification Email Templates
  async sendParcelCreatedEmail(
    to: string,
    userName: string,
    parcelData: {
      trackingCode: string;
      description: string;
      totalCost: number;
      estimatedDeliveryTime: number;
    },
  ): Promise<boolean> {
    const template = this.getParcelCreatedTemplate(userName, parcelData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendParcelReceiverNotificationEmail(
    to: string,
    userName: string,
    parcelData: {
      trackingCode: string;
      description: string;
      senderName: string;
      senderEmail: string;
    },
  ): Promise<boolean> {
    const template = this.getParcelReceiverTemplate(userName, parcelData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendParcelAssignedEmail(
    to: string,
    userName: string,
    parcelData: {
      trackingCode: string;
      courierName: string;
      courierPhone?: string;
    },
  ): Promise<boolean> {
    const template = this.getParcelAssignedTemplate(userName, parcelData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendCourierAssignmentEmail(
    to: string,
    courierName: string,
    parcelData: {
      trackingCode: string;
      description: string;
      senderEmail: string;
      senderName: string;
      receiverEmail: string;
      receiverName: string;
      pickupAddress?: string;
      deliveryAddress?: string;
      totalCost: number;
      estimatedDeliveryTime: number;
      weight: number;
    },
  ): Promise<boolean> {
    const template = this.getCourierAssignmentTemplate(courierName, parcelData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendParcelStatusUpdateEmail(
    to: string,
    userName: string,
    parcelData: {
      trackingCode: string;
      status: string;
      statusDescription: string;
    },
  ): Promise<boolean> {
    const template = this.getParcelStatusUpdateTemplate(userName, parcelData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendParcelDeliveredEmail(
    to: string,
    userName: string,
    parcelData: {
      trackingCode: string;
      deliveredAt: Date;
    },
  ): Promise<boolean> {
    const template = this.getParcelDeliveredTemplate(userName, parcelData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSystemAlertEmail(
    to: string,
    alertData: {
      title: string;
      message: string;
      priority: string;
    },
  ): Promise<boolean> {
    const template = this.getSystemAlertTemplate(alertData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendCourierOnboardingEmail(
    to: string,
    courierData: {
      name: string;
      email: string;
      password: string;
      vehicleType: string;
      licensePlate?: string;
    },
  ): Promise<boolean> {
    const template = this.getCourierOnboardingTemplate(courierData);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Email Templates
  private getParcelCreatedTemplate(
    userName: string,
    parcelData: any,
  ): EmailTemplate {
    const deliveryDate = new Date();
    deliveryDate.setMinutes(
      deliveryDate.getMinutes() + parcelData.estimatedDeliveryTime,
    );

    return {
      subject: `Parcel Created - Tracking Code: ${parcelData.trackingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>📦 Parcel Created Successfully</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hello ${userName},</h2>
            <p>Your parcel has been created successfully! Here are the details:</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>📋 Parcel Details</h3>
              <p><strong>Tracking Code:</strong> ${parcelData.trackingCode}</p>
              <p><strong>Description:</strong> ${parcelData.description}</p>
              <p><strong>Total Cost:</strong> $${parcelData.totalCost}</p>
              <p><strong>Estimated Delivery:</strong> ${deliveryDate.toLocaleDateString()}</p>
            </div>
            
            <p>You can track your parcel using the tracking code above.</p>
            <p>Thank you for choosing SendIT!</p>
          </div>
        </div>
      `,
      text: `
        Parcel Created Successfully
        
        Hello ${userName},
        
        Your parcel has been created successfully!
        
        Tracking Code: ${parcelData.trackingCode}
        Description: ${parcelData.description}
        Total Cost: $${parcelData.totalCost}
        Estimated Delivery: ${deliveryDate.toLocaleDateString()}
        
        Thank you for choosing SendIT!
      `,
    };
  }

  private getParcelReceiverTemplate(
    userName: string,
    parcelData: any,
  ): EmailTemplate {
    return {
      subject: `Parcel Received - Tracking Code: ${parcelData.trackingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>📦 Parcel Received</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hello ${userName},</h2>
            <p>A parcel has been sent to you!</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>📋 Parcel Details</h3>
              <p><strong>Tracking Code:</strong> ${parcelData.trackingCode}</p>
              <p><strong>Description:</strong> ${parcelData.description}</p>
              <p><strong>Sender:</strong> ${parcelData.senderName} (${parcelData.senderEmail})</p>
            </div>
            
            <p>You can track your parcel using the tracking code above.</p>
            <p>Thank you for choosing SendIT!</p>
          </div>
        </div>
      `,
      text: `
        Parcel Received
        
        Hello ${userName},
        
        A parcel has been sent to you!
        
        Tracking Code: ${parcelData.trackingCode}
        Description: ${parcelData.description}
        Sender: ${parcelData.senderName} (${parcelData.senderEmail})
        
        You can track your parcel using the tracking code above.
        
        Thank you for choosing SendIT!
      `,
    };
  }

  private getParcelAssignedTemplate(
    userName: string,
    parcelData: any,
  ): EmailTemplate {
    return {
      subject: `Courier Assigned - Tracking Code: ${parcelData.trackingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>🚚 Courier Assigned</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hello ${userName},</h2>
            <p>Great news! A courier has been assigned to your parcel.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>📋 Courier Details</h3>
              <p><strong>Tracking Code:</strong> ${parcelData.trackingCode}</p>
              <p><strong>Courier Name:</strong> ${parcelData.courierName}</p>
              ${parcelData.courierPhone ? `<p><strong>Courier Phone:</strong> ${parcelData.courierPhone}</p>` : ''}
            </div>
            
            <p>Your courier will contact you soon to arrange pickup.</p>
            <p>Thank you for choosing SendIT!</p>
          </div>
        </div>
      `,
      text: `
        Courier Assigned
        
        Hello ${userName},
        
        Great news! A courier has been assigned to your parcel.
        
        Tracking Code: ${parcelData.trackingCode}
        Courier Name: ${parcelData.courierName}
        ${parcelData.courierPhone ? `Courier Phone: ${parcelData.courierPhone}` : ''}
        
        Your courier will contact you soon to arrange pickup.
        
        Thank you for choosing SendIT!
      `,
    };
  }

  private getCourierAssignmentTemplate(
    courierName: string,
    parcelData: any,
  ): EmailTemplate {
    const deliveryDate = new Date();
    deliveryDate.setMinutes(
      deliveryDate.getMinutes() + parcelData.estimatedDeliveryTime,
    );

    return {
      subject: `Courier Assignment - Tracking Code: ${parcelData.trackingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>🚚 Courier Assignment</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hello ${courierName},</h2>
            <p>You have been assigned a new courier delivery task!</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>📋 Delivery Details</h3>
              <p><strong>Tracking Code:</strong> ${parcelData.trackingCode}</p>
              <p><strong>Description:</strong> ${parcelData.description}</p>
              <p><strong>Sender:</strong> ${parcelData.senderName} (${parcelData.senderEmail})</p>
              <p><strong>Receiver:</strong> ${parcelData.receiverName} (${parcelData.receiverEmail})</p>
              <p><strong>Pickup Address:</strong> ${parcelData.pickupAddress || 'Address to be provided by sender'}</p>
              <p><strong>Delivery Address:</strong> ${parcelData.deliveryAddress || 'Address to be provided by receiver'}</p>
              <p><strong>Total Cost:</strong> $${parcelData.totalCost}</p>
              <p><strong>Estimated Delivery:</strong> ${deliveryDate.toLocaleDateString()}</p>
              <p><strong>Weight:</strong> ${parcelData.weight} kg</p>
            </div>
            
            <p>Please contact the sender to arrange pickup location and time.</p>
            <p>Thank you for choosing SendIT!</p>
          </div>
        </div>
      `,
      text: `
        Courier Assignment
        
        Hello ${courierName},
        
        You have been assigned a new courier delivery task!
        
        Tracking Code: ${parcelData.trackingCode}
        Description: ${parcelData.description}
        Sender: ${parcelData.senderName} (${parcelData.senderEmail})
        Receiver: ${parcelData.receiverName} (${parcelData.receiverEmail})
        Pickup Address: ${parcelData.pickupAddress || 'Address to be provided by sender'}
        Delivery Address: ${parcelData.deliveryAddress || 'Address to be provided by receiver'}
        Total Cost: $${parcelData.totalCost}
        Estimated Delivery: ${deliveryDate.toLocaleDateString()}
        Weight: ${parcelData.weight} kg
        
        Please contact the sender to arrange pickup location and time.
        
        Thank you for choosing SendIT!
      `,
    };
  }

  private getParcelStatusUpdateTemplate(
    userName: string,
    parcelData: any,
  ): EmailTemplate {
    return {
      subject: `Parcel Status Update - ${parcelData.status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; color: black; padding: 20px; text-align: center;">
            <h1>📦 Parcel Status Update</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hello ${userName},</h2>
            <p>Your parcel status has been updated:</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>📋 Status Update</h3>
              <p><strong>Tracking Code:</strong> ${parcelData.trackingCode}</p>
              <p><strong>New Status:</strong> ${parcelData.status}</p>
              <p><strong>Description:</strong> ${parcelData.statusDescription}</p>
            </div>
            
            <p>You can track your parcel using the tracking code above.</p>
            <p>Thank you for choosing SendIT!</p>
          </div>
        </div>
      `,
      text: `
        Parcel Status Update
        
        Hello ${userName},
        
        Your parcel status has been updated:
        
        Tracking Code: ${parcelData.trackingCode}
        New Status: ${parcelData.status}
        Description: ${parcelData.statusDescription}
        
        You can track your parcel using the tracking code above.
        
        Thank you for choosing SendIT!
      `,
    };
  }

  private getParcelDeliveredTemplate(
    userName: string,
    parcelData: any,
  ): EmailTemplate {
    return {
      subject: `Parcel Delivered - Tracking Code: ${parcelData.trackingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>✅ Parcel Delivered</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>Hello ${userName},</h2>
            <p>🎉 Great news! Your parcel has been delivered successfully!</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>📋 Delivery Confirmation</h3>
              <p><strong>Tracking Code:</strong> ${parcelData.trackingCode}</p>
              <p><strong>Delivered At:</strong> ${parcelData.deliveredAt.toLocaleString()}</p>
            </div>
            
            <p>Thank you for choosing SendIT! We hope you're satisfied with our service.</p>
            <p>Please rate your delivery experience.</p>
          </div>
        </div>
      `,
      text: `
        Parcel Delivered
        
        Hello ${userName},
        
        🎉 Great news! Your parcel has been delivered successfully!
        
        Tracking Code: ${parcelData.trackingCode}
        Delivered At: ${parcelData.deliveredAt.toLocaleString()}
        
        Thank you for choosing SendIT! We hope you're satisfied with our service.
        Please rate your delivery experience.
      `,
    };
  }

  private getSystemAlertTemplate(alertData: any): EmailTemplate {
    return {
      subject: `System Alert: ${alertData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1>⚠️ System Alert</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>System Alert</h2>
            <p><strong>Priority:</strong> ${alertData.priority}</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>📋 Alert Details</h3>
              <p><strong>Title:</strong> ${alertData.title}</p>
              <p><strong>Message:</strong> ${alertData.message}</p>
            </div>
            
            <p>Please take necessary action if required.</p>
          </div>
        </div>
      `,
      text: `
        System Alert
        
        Priority: ${alertData.priority}
        
        Title: ${alertData.title}
        Message: ${alertData.message}
        
        Please take necessary action if required.
      `,
    };
  }

  private getCourierOnboardingTemplate(courierData: any): EmailTemplate {
    const subject = `🎉 Welcome to SendIT! Your Courier Account is Ready`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to SendIT!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Courier Account is Ready</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #333; margin-bottom: 15px;">Hello ${courierData.name}!</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            Congratulations! You have been accepted as a courier for SendIT Delivery Platform. 
            We're excited to have you join our team and help us deliver exceptional service to our customers.
          </p>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-bottom: 15px;">🔐 Your Login Credentials</h3>
          <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${courierData.email}</p>
            <p style="margin: 0;"><strong>Password:</strong> ${courierData.password}</p>
          </div>
          <p style="color: #155724; font-size: 14px; margin: 15px 0 0 0;">
            <strong>Important:</strong> Please change your password after your first login for security.
          </p>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-bottom: 15px;">🚗 Your Vehicle Information</h3>
          <p style="margin: 0 0 10px 0;"><strong>Vehicle Type:</strong> ${courierData.vehicleType}</p>
          ${courierData.licensePlate ? `<p style="margin: 0;"><strong>License Plate:</strong> ${courierData.licensePlate}</p>` : ''}
        </div>

        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #17a2b8;">
          <h3 style="color: #0c5460; margin-bottom: 15px;">📱 What You Can Do</h3>
          <ul style="color: #0c5460; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>View Assigned Parcels:</strong> See all parcels assigned to you for delivery</li>
            <li><strong>Update Parcel Status:</strong> Mark parcels as picked up, in transit, or delivered</li>
            <li><strong>Update Your Location:</strong> Share your real-time location for better tracking</li>
            <li><strong>View Performance Stats:</strong> Track your delivery performance and earnings</li>
            <li><strong>Manage Your Profile:</strong> Update your personal and vehicle information</li>
          </ul>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-bottom: 15px;">🚀 Getting Started</h3>
          <ol style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Login to your courier dashboard using the credentials above</li>
            <li>Update your profile with any additional information</li>
            <li>Check for any assigned parcels in your dashboard</li>
            <li>Start accepting and delivering parcels!</li>
          </ol>
        </div>

        <div style="background: #e2e3e5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #383d41; margin-bottom: 15px;">📞 Need Help?</h3>
          <p style="color: #383d41; line-height: 1.6; margin: 0;">
            If you have any questions or need assistance, please don't hesitate to contact our support team. 
            We're here to help you succeed!
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Welcome to the SendIT family! We're excited to work with you.
          </p>
        </div>
      </div>
    `;

    const text = `
🎉 Welcome to SendIT! Your Courier Account is Ready

Hello ${courierData.name}!

Congratulations! You have been accepted as a courier for SendIT Delivery Platform. 
We're excited to have you join our team and help us deliver exceptional service to our customers.

🔐 Your Login Credentials
Email: ${courierData.email}
Password: ${courierData.password}

Important: Please change your password after your first login for security.

🚗 Your Vehicle Information
Vehicle Type: ${courierData.vehicleType}
${courierData.licensePlate ? `License Plate: ${courierData.licensePlate}` : ''}

📱 What You Can Do
• View Assigned Parcels: See all parcels assigned to you for delivery
• Update Parcel Status: Mark parcels as picked up, in transit, or delivered
• Update Your Location: Share your real-time location for better tracking
• View Performance Stats: Track your delivery performance and earnings
• Manage Your Profile: Update your personal and vehicle information

🚀 Getting Started
1. Login to your courier dashboard using the credentials above
2. Update your profile with any additional information
3. Check for any assigned parcels in your dashboard
4. Start accepting and delivering parcels!

📞 Need Help?
If you have any questions or need assistance, please don't hesitate to contact our support team. 
We're here to help you succeed!

Welcome to the SendIT family! We're excited to work with you.
    `;

    return { subject, html, text };
  }
}
