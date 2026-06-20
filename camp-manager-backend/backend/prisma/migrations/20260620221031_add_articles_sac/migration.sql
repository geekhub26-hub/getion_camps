-- CreateTable
CREATE TABLE "articles_sac" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "categorie" TEXT,
    "confisque" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_sac_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "articles_sac" ADD CONSTRAINT "articles_sac_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
