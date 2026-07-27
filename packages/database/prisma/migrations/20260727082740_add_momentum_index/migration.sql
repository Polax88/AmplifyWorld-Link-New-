-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "country" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "visitorId" TEXT;

-- CreateTable
CREATE TABLE "page_momentum_scores" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "scoreChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breakdown" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_momentum_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_momentum_scores_date_scoreChange_idx" ON "page_momentum_scores"("date", "scoreChange");

-- CreateIndex
CREATE UNIQUE INDEX "page_momentum_scores_pageId_date_key" ON "page_momentum_scores"("pageId", "date");

-- CreateIndex
CREATE INDEX "analytics_events_pageId_visitorId_idx" ON "analytics_events"("pageId", "visitorId");

-- AddForeignKey
ALTER TABLE "page_momentum_scores" ADD CONSTRAINT "page_momentum_scores_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
