/*
  Warnings:

  - Added the required column `title` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PARCEL_CREATED', 'PARCEL_ASSIGNED', 'PARCEL_PICKED_UP', 'PARCEL_IN_TRANSIT', 'PARCEL_DELIVERED', 'PARCEL_CANCELLED', 'COURIER_NEARBY', 'DELIVERY_UPDATE', 'SYSTEM_ALERT', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('FRONTEND', 'EMAIL', 'BOTH');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "channel" "NotificationChannel" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "courierId" TEXT,
ADD COLUMN     "data" JSONB,
ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" "NotificationType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
