-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "contact_adolescent" TEXT,
ADD COLUMN     "lieu_naissance" TEXT,
ADD COLUMN     "niveau_scolaire" TEXT,
ADD COLUMN     "paroisse" TEXT,
ADD COLUMN     "participations_anterieures" INTEGER DEFAULT 0,
ADD COLUMN     "responsable_paroisse" TEXT,
ADD COLUMN     "responsable_telephone" TEXT;
