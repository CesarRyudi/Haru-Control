-- CreateEnum
CREATE TYPE "WasteReason" AS ENUM ('EXPIRED', 'DAMAGE', 'BAKING_FAILURE', 'TASTING', 'OTHER');

-- AlterEnum
ALTER TYPE "LedgerOperationType" ADD VALUE 'WASTE';

-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "waste_reason" "WasteReason";
