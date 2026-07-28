-- CreateTable
CREATE TABLE "passes" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#ff4081',
    "imageUrl" TEXT,
    "eventName" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventVenue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_holders" (
    "id" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "fanId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInAt" TIMESTAMP(3),

    CONSTRAINT "pass_holders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "passes_pageId_idx" ON "passes"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "pass_holders_passId_fanId_key" ON "pass_holders"("passId", "fanId");

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_holders" ADD CONSTRAINT "pass_holders_passId_fkey" FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_holders" ADD CONSTRAINT "pass_holders_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "fans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
