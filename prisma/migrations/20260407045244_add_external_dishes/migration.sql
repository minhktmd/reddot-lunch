-- AlterTable
ALTER TABLE "menu_of_days" ADD COLUMN     "externalDishes" JSONB NOT NULL DEFAULT '[]';
