-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "pushover_receipt" TEXT;
