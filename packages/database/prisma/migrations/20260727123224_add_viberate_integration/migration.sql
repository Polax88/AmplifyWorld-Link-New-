-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "viberateArtistId" TEXT,
ADD COLUMN     "viberateConnectedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "viberate_snapshots" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rankScore" DOUBLE PRECISION,
    "profile" JSONB NOT NULL DEFAULT '{}',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viberate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "viberate_snapshots_pageId_date_key" ON "viberate_snapshots"("pageId", "date");

-- AddForeignKey
ALTER TABLE "viberate_snapshots" ADD CONSTRAINT "viberate_snapshots_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
