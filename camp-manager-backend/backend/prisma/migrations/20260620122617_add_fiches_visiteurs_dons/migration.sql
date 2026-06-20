-- CreateEnum
CREATE TYPE "TypePresence" AS ENUM ('ANIMATEUR', 'ENFANT');

-- CreateTable
CREATE TABLE "fiches_presence" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "type" "TypePresence" NOT NULL DEFAULT 'ANIMATEUR',
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "heure_sortie" TIMESTAMP(3) NOT NULL,
    "motif" TEXT NOT NULL,
    "heure_retour" TIMESTAMP(3),
    "signature" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiches_presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visiteurs" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "qualite" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visiteurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dons" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "montant" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fiches_presence" ADD CONSTRAINT "fiches_presence_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visiteurs" ADD CONSTRAINT "visiteurs_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dons" ADD CONSTRAINT "dons_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
