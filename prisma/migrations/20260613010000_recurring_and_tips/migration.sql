-- Saved card for off-session charges
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "stripePaymentMethodId" TEXT;

-- Tips + recurring linkage on jobs
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "planId" TEXT;

-- Recurring plans
CREATE TABLE IF NOT EXISTS "RecurringPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "squareFeet" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "addOns" TEXT,
    "specialRequests" TEXT,
    "frequency" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preferredCleanerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringPlan_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "RecurringPlan" ADD CONSTRAINT "RecurringPlan_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringPlan" ADD CONSTRAINT "RecurringPlan_preferredCleanerId_fkey"
    FOREIGN KEY ("preferredCleanerId") REFERENCES "Cleaner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "RecurringPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
