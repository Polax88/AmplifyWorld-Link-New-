/*
  Warnings:

  - You are about to drop the column `outcome` on the `prediction_markets` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `prediction_markets` table. All the data in the column will be lost.
  - Added the required column `hit` to the `prediction_picks` table without a default value. This is not possible if the table is not empty.
  - Made the column `payout` on table `prediction_picks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "prediction_markets" DROP COLUMN "outcome",
DROP COLUMN "resolvedAt";

-- AlterTable
ALTER TABLE "prediction_picks" ADD COLUMN     "hit" BOOLEAN NOT NULL,
ALTER COLUMN "payout" SET NOT NULL;

-- DropEnum
DROP TYPE "PredictionOutcome";
