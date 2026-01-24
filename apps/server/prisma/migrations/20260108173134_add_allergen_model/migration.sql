-- CreateTable
CREATE TABLE "Allergen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Allergen_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Allergen_restaurantId_idx" ON "Allergen"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_name_restaurantId_key" ON "Allergen"("name", "restaurantId");
