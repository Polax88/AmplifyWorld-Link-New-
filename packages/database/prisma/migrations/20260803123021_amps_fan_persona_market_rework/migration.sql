-- CreateEnum
CREATE TYPE "PredictionSubjectType" AS ENUM ('ARTIST', 'GENRE', 'COUNTRY');

-- AlterEnum
ALTER TYPE "AmpsTransactionType" ADD VALUE 'MARKET_RAKE';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FAN';

-- DropIndex
DROP INDEX "prediction_markets_pageId_key";

-- AlterTable
ALTER TABLE "prediction_markets" ADD COLUMN     "country" TEXT,
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "subjectType" "PredictionSubjectType" NOT NULL DEFAULT 'ARTIST',
ALTER COLUMN "pageId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "prediction_markets_pageId_idx" ON "prediction_markets"("pageId");

-- CreateIndex
CREATE INDEX "prediction_markets_subjectType_idx" ON "prediction_markets"("subjectType");
