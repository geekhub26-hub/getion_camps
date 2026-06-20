-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "camp_id" TEXT,
ADD COLUMN     "libelle" TEXT,
ALTER COLUMN "participant_id" DROP NOT NULL,
ALTER COLUMN "montant_total" DROP NOT NULL;

-- CreateTable
CREATE TABLE "camp_paroisses" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "responsable" TEXT,
    "telephone" TEXT,

    CONSTRAINT "camp_paroisses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "camp_paroisses" ADD CONSTRAINT "camp_paroisses_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
