-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'COURIER');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Courier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,

    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION,
    "status" "ParcelStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "courierId" TEXT,
    "pickupAddressId" TEXT,
    "deliveryAddressId" TEXT,

    CONSTRAINT "Parcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelStatusHistory" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "status" "ParcelStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT,
    "note" TEXT,

    CONSTRAINT "ParcelStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "parcelId" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Courier_userId_key" ON "Courier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Parcel_trackingCode_key" ON "Parcel"("trackingCode");

-- AddForeignKey
ALTER TABLE "Courier" ADD CONSTRAINT "Courier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_pickupAddressId_fkey" FOREIGN KEY ("pickupAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelStatusHistory" ADD CONSTRAINT "ParcelStatusHistory_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelStatusHistory" ADD CONSTRAINT "ParcelStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
