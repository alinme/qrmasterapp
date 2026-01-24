-- CreateTable
CREATE TABLE "BillRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "orderIds" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "tipAmount" REAL NOT NULL DEFAULT 0,
    "tipType" TEXT,
    "tipValue" REAL,
    "paymentType" TEXT NOT NULL,
    "totalWithTip" REAL NOT NULL,
    "deviceId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillRequest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BillRequest_tableId_idx" ON "BillRequest"("tableId");

-- CreateIndex
CREATE INDEX "BillRequest_processed_idx" ON "BillRequest"("processed");
