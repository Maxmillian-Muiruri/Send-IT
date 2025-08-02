/*
  Warnings:

  - You are about to drop the column `location` on the `Courier` table. All the data in the column will be lost.
*/

-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE', 'ON_DELIVERY');

-- AlterTable
ALTER TABLE "Courier" DROP COLUMN "location",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "licensePlate" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "status" "CourierStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vehicleType" TEXT;

-- Update existing records to set updatedAt
UPDATE "Courier" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
