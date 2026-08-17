-- DropIndex
DROP INDEX "routine_items_group_id_order_no_idx";

-- AlterTable
ALTER TABLE "routine_items" ADD COLUMN     "weekday" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "routine_items_group_id_weekday_order_no_idx" ON "routine_items"("group_id", "weekday", "order_no");
