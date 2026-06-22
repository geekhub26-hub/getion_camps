-- AlterTable
ALTER TABLE "camp_paroisses" ADD COLUMN     "prix_participant" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "enseignements" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "orateur" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enseignements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
