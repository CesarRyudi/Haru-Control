/*
  Warnings:

  - You are about to drop the column `contact` on the `customers` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `ledger_entries` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.
  - You are about to alter the column `quantity` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerOperationType" ADD VALUE 'MANUFACTURING_CONSUMPTION';
ALTER TYPE "LedgerOperationType" ADD VALUE 'MANUFACTURING_PRODUCTION';

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "contact",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "observation" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "ledger_entries" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_purchasable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_sellable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Un',

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_parent_id_child_id_key" ON "recipe_items"("parent_id", "child_id");

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
