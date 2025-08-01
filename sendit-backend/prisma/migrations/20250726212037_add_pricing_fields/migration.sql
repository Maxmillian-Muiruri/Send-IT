-- AlterTable
ALTER TABLE "Parcel" ADD COLUMN     "baseRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "distanceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "estimatedDeliveryTime" INTEGER,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "weightCharge" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
