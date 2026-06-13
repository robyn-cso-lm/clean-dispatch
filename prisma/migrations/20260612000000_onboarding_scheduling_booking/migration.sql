-- Cleaner: self-service access token + Checkr background-check tracking
ALTER TABLE "Cleaner" ADD COLUMN     "accessToken" TEXT;
ALTER TABLE "Cleaner" ADD COLUMN     "checkrCandidateId" TEXT;
ALTER TABLE "Cleaner" ADD COLUMN     "checkrReportId" TEXT;
ALTER TABLE "Cleaner" ADD COLUMN     "checkrStatus" TEXT NOT NULL DEFAULT 'none';

-- Job: deposit taken at booking
ALTER TABLE "Job" ADD COLUMN     "depositAmount" DOUBLE PRECISION;

-- CreateTable: work photos submitted with a cleaner application
CREATE TABLE "CleanerWorkPhoto" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "driveItemId" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerWorkPhoto_pkey" PRIMARY KEY ("id")
);

-- Backfill access tokens for any existing cleaners (random, unguessable)
UPDATE "Cleaner" SET "accessToken" = gen_random_uuid()::text WHERE "accessToken" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cleaner_accessToken_key" ON "Cleaner"("accessToken");

-- AddForeignKey
ALTER TABLE "CleanerWorkPhoto" ADD CONSTRAINT "CleanerWorkPhoto_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
