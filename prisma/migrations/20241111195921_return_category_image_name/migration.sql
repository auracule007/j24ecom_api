/*
  Warnings:

  - You are about to drop the column `img` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "img",
ADD COLUMN     "image" TEXT;
