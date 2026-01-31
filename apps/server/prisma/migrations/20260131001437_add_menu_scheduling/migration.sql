-- AlterTable
ALTER TABLE "Order" ADD COLUMN "claimedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "restaurantId" TEXT NOT NULL,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleStart" TEXT,
    "scheduleEnd" TEXT,
    "scheduleDays" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("createdAt", "id", "imageUrl", "name", "restaurantId", "sortOrder", "updatedAt") SELECT "createdAt", "id", "imageUrl", "name", "restaurantId", "sortOrder", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "weight" TEXT,
    "ingredients" TEXT,
    "nutritionalValues" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleStart" TEXT,
    "scheduleEnd" TEXT,
    "scheduleDays" TEXT,
    "allergens" TEXT,
    "modifiers" TEXT,
    "isCombo" BOOLEAN NOT NULL DEFAULT false,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("allergens", "categoryId", "createdAt", "description", "id", "ingredients", "isAvailable", "isCombo", "isFeatured", "modifiers", "name", "nutritionalValues", "price", "restaurantId", "updatedAt", "weight") SELECT "allergens", "categoryId", "createdAt", "description", "id", "ingredients", "isAvailable", "isCombo", "isFeatured", "modifiers", "name", "nutritionalValues", "price", "restaurantId", "updatedAt", "weight" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
