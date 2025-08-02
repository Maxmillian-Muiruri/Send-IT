import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Create user with role validation
  async createUser(dto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        role: dto.role || UserRole.USER,
      },
    });

    // Create courier record if user is a courier
    if (user.role === UserRole.COURIER) {
      await this.prisma.courier.create({
        data: {
          userId: user.id,
          vehicleType: dto.vehicleType || null,
          licensePlate: dto.licensePlate || null,
        },
      });
    }

    // Send welcome email
    await this.sendWelcomeEmail(user);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async sendWelcomeEmail(user: any): Promise<void> {
    try {
      const welcomeTemplate = this.getWelcomeEmailTemplate(user);
      await this.emailService.sendEmail({
        to: user.email,
        subject: welcomeTemplate.subject,
        html: welcomeTemplate.html,
        text: welcomeTemplate.text,
      });
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send welcome email:', error);
    }
  }

  private getWelcomeEmailTemplate(user: any) {
    const roleDisplay =
      user.role === UserRole.COURIER
        ? 'Courier'
        : user.role === UserRole.ADMIN
          ? 'Administrator'
          : 'User';

    return {
      subject: `Welcome to SendIT, ${user.name}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🚚 Welcome to SendIT!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your account has been successfully created</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name},</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Welcome to SendIT! We're excited to have you on board as a <strong>${roleDisplay}</strong>. 
              Your account has been successfully created and you're now ready to start using our parcel delivery platform.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">📋 Account Details</h3>
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Role:</strong> ${roleDisplay}</p>
              <p><strong>Account Created:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2d5a2d; margin-top: 0;">🎯 What's Next?</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li><strong>Complete your profile:</strong> Add your address and contact information</li>
                <li><strong>Explore the platform:</strong> Familiarize yourself with our features</li>
                <li><strong>Start sending parcels:</strong> Create your first delivery request</li>
                <li><strong>Track deliveries:</strong> Monitor your parcels in real-time</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:4200/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                🚀 Get Started
              </a>
            </div>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">🔒 Security Reminder</h4>
              <p style="color: #666; margin-bottom: 0; font-size: 14px;">
                Keep your account secure by using a strong password and never sharing your login credentials. 
                If you have any questions or need assistance, our support team is here to help!
              </p>
            </div>
            
            <p style="color: #777; text-align: center; margin-top: 30px; font-size: 14px;">
              Thank you for choosing SendIT!<br>
              <strong>The SendIT Team</strong>
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to SendIT!
        
        Hello ${user.name},
        
        Welcome to SendIT! We're excited to have you on board as a ${roleDisplay}. 
        Your account has been successfully created and you're now ready to start using our parcel delivery platform.
        
        Account Details:
        - Name: ${user.name}
        - Email: ${user.email}
        - Role: ${roleDisplay}
        - Account Created: ${new Date().toLocaleDateString()}
        
        What's Next?
        - Complete your profile: Add your address and contact information
        - Explore the platform: Familiarize yourself with our features
        - Start sending parcels: Create your first delivery request
        - Track deliveries: Monitor your parcels in real-time
        
        Get started at: http://localhost:4200/login
        
        Security Reminder:
        Keep your account secure by using a strong password and never sharing your login credentials. 
        If you have any questions or need assistance, our support team is here to help!
        
        Thank you for choosing SendIT!
        The SendIT Team
      `,
    };
  }

  // Get all users (with pagination and filtering)
  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: UserRole,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get user by ID
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Find by email (for auth)
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // Include password for auth
        name: true,
        phone: true,
        role: true,
        resetPasswordCode: true,
        resetPasswordCodeExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Update user
  async updateUser(id: string, updateData: UpdateUserDto) {
    const existingUser = await this.findById(id);

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.findByEmail(updateData.email);
      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Hash password if it's being updated
    let dataToUpdate: any = { ...updateData };
    if (updateData.password) {
      dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
    }

    return await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password
      },
    });
  }

  // Soft delete user (mark as inactive)
  async softDeleteUser(id: string) {
    const user = await this.findById(id);

    // Instead of actually deleting, we could add a 'deletedAt' field
    // For now, we'll just return success
    return await this.prisma.user.update({
      where: { id },
      data: {
        // Add a deletedAt field to schema if you want true soft delete
        // deletedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // Exclude password
      },
    });
  }

  // Hard delete user (admin only) - handles foreign key constraints
  async deleteUser(id: string) {
    const user = await this.findById(id);

    // Use a transaction to handle all related deletions
    return await this.prisma.$transaction(async (prisma) => {
      // Delete related records in the correct order
      
      // 1. Delete parcel status history (where user changed the status)
      await prisma.parcelStatusHistory.deleteMany({
        where: { changedById: id }
      });

      // 2. Delete notifications
      await prisma.notification.deleteMany({
        where: { userId: id }
      });

      // 3. Delete addresses
      await prisma.address.deleteMany({
        where: { userId: id }
      });

      // 4. Delete courier profile if exists
      await prisma.courier.deleteMany({
        where: { userId: id }
      });

      // 5. Delete parcels where user is sender or receiver
      await prisma.parcel.deleteMany({
        where: {
          OR: [
            { senderId: id },
            { receiverId: id }
          ]
        }
      });

      // 6. Finally delete the user
      return await prisma.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          // Exclude password
        },
      });
    });
  }

  // Get users by role
  async findByRole(role: UserRole) {
    return await this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update password reset code
  async updatePasswordResetCode(email: string, code: string, expiry: Date) {
    return await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordCode: code,
        resetPasswordCodeExpiry: expiry,
      },
    });
  }

  // Clear password reset code
  async clearPasswordResetCode(email: string) {
    return await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordCode: null,
        resetPasswordCodeExpiry: null,
      },
    });
  }
}
