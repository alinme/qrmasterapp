/*
  Warnings:

  - You are about to drop the column `customerGender` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "contactPerson" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "contractEnd" DATETIME;
ALTER TABLE "Restaurant" ADD COLUMN "contractStart" DATETIME;
ALTER TABLE "Restaurant" ADD COLUMN "phoneNumber" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "serverNotes" TEXT,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "deviceId" TEXT,
    "customerName" TEXT,
    "customerAvatar" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerAvatar", "customerName", "deviceId", "id", "notes", "paymentStatus", "restaurantId", "serverNotes", "status", "tableId", "total", "updatedAt") SELECT "createdAt", "customerAvatar", "customerName", "deviceId", "id", "notes", "paymentStatus", "restaurantId", "serverNotes", "status", "tableId", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");
CREATE INDEX "Order_deviceId_idx" ON "Order"("deviceId");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
