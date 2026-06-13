-- Allow multiple payments per job (deposit + balance + additional charges)
DROP INDEX IF EXISTS "Payment_jobId_key";

-- Tag each payment with its kind
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'deposit';
