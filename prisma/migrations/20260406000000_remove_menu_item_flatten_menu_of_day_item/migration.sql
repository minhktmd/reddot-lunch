-- Step 1: Add name column (nullable temporarily)
ALTER TABLE "menu_of_day_items" ADD COLUMN "name" TEXT;

-- Step 2: Populate name from joined menu_items table
UPDATE "menu_of_day_items"
SET "name" = mi."name"
FROM "menu_items" mi
WHERE "menu_of_day_items"."menuItemId" = mi."id";

-- Step 3: Set any remaining nulls (safety net)
UPDATE "menu_of_day_items"
SET "name" = 'Unknown'
WHERE "name" IS NULL;

-- Step 4: Make name NOT NULL
ALTER TABLE "menu_of_day_items" ALTER COLUMN "name" SET NOT NULL;

-- Step 5: Drop the FK constraint and menuItemId column
ALTER TABLE "menu_of_day_items" DROP CONSTRAINT IF EXISTS "menu_of_day_items_menuItemId_fkey";
ALTER TABLE "menu_of_day_items" DROP COLUMN "menuItemId";

-- Step 6: Add unique constraint on (menuOfDayId, name)
CREATE UNIQUE INDEX "menu_of_day_items_menuOfDayId_name_key" ON "menu_of_day_items"("menuOfDayId", "name");

-- Step 7: Drop the menu_items table
DROP TABLE "menu_items";
