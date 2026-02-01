-- AlterTable
ALTER TABLE "User" ADD COLUMN "impersonatedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "impersonating" TEXT;
ALTER TABLE "User" ADD COLUMN "impersonationStart" DATETIME;

-- CreateTable
CREATE TABLE "TableCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TableCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "chairs" INTEGER DEFAULT 4,
    "form" TEXT DEFAULT 'square',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "qrTokenSeed" TEXT,
    "lastResetAt" DATETIME,
    "serverId" TEXT,
    "categoryId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Table_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Table_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TableCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Table" ("chairs", "createdAt", "form", "id", "lastResetAt", "name", "qrTokenSeed", "restaurantId", "serverId", "status", "updatedAt") SELECT "chairs", "createdAt", "form", "id", "lastResetAt", "name", "qrTokenSeed", "restaurantId", "serverId", "status", "updatedAt" FROM "Table";
DROP TABLE "Table";
ALTER TABLE "new_Table" RENAME TO "Table";
CREATE INDEX "Table_categoryId_idx" ON "Table"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TableCategory_restaurantId_idx" ON "TableCategory"("restaurantId");
