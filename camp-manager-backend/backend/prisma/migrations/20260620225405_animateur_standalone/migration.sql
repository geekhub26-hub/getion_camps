/*
  Warnings:

  - You are about to drop the column `user_id` on the `animateurs` table. All the data in the column will be lost.
  - Added the required column `nom` to the `animateurs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prenom` to the `animateurs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "animateurs" DROP CONSTRAINT "animateurs_user_id_fkey";

-- DropIndex
DROP INDEX "animateurs_user_id_key";

-- AlterTable
ALTER TABLE "animateurs" DROP COLUMN "user_id",
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "prenom" TEXT NOT NULL;
