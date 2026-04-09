-- AlterTable: remove qrCodeUrl, add bank fields
ALTER TABLE "app_config" DROP COLUMN "qrCodeUrl";
ALTER TABLE "app_config" ADD COLUMN "bankCode" TEXT;
ALTER TABLE "app_config" ADD COLUMN "bankAccount" TEXT;
ALTER TABLE "app_config" ADD COLUMN "bankAccountName" TEXT;
