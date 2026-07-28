-- CreateEnum
CREATE TYPE "AmpsTransactionType" AS ENUM ('SIGNUP_BONUS', 'MOMENTUM_MILESTONE', 'FAN_ENGAGEMENT', 'PREDICTION_STAKE', 'PREDICTION_PAYOUT', 'LEADERBOARD_BOOST', 'THEME_UNLOCK');

-- CreateEnum
CREATE TYPE "PredictionOutcome" AS ENUM ('PENDING', 'HIT', 'MISS');

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "country" TEXT,
ADD COLUMN     "discoverBoostedUntil" TIMESTAMP(3),
ADD COLUMN     "genre" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ampsBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unlockedThemes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "amps_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AmpsTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amps_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_markets" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "outcome" "PredictionOutcome" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_picks" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stakeAmount" INTEGER NOT NULL,
    "payout" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_picks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "amps_transactions_userId_createdAt_idx" ON "amps_transactions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_markets_pageId_key" ON "prediction_markets"("pageId");

-- CreateIndex
CREATE INDEX "prediction_picks_marketId_idx" ON "prediction_picks"("marketId");

-- CreateIndex
CREATE INDEX "prediction_picks_userId_idx" ON "prediction_picks"("userId");

-- CreateIndex
CREATE INDEX "pages_genre_country_idx" ON "pages"("genre", "country");

-- AddForeignKey
ALTER TABLE "amps_transactions" ADD CONSTRAINT "amps_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_markets" ADD CONSTRAINT "prediction_markets_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_picks" ADD CONSTRAINT "prediction_picks_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "prediction_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_picks" ADD CONSTRAINT "prediction_picks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
