/*
  Warnings:

  - Added the required column `updatedAt` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "postalCode" DROP NOT NULL;
