-- CreateTable
CREATE TABLE "causerie_groupes" (
    "id" TEXT NOT NULL,
    "groupe_id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "theme" TEXT NOT NULL,
    "resume" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "causerie_groupes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "causerie_groupes_groupe_id_date_key" ON "causerie_groupes"("groupe_id", "date");

-- AddForeignKey
ALTER TABLE "causerie_groupes" ADD CONSTRAINT "causerie_groupes_groupe_id_fkey" FOREIGN KEY ("groupe_id") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "causerie_groupes" ADD CONSTRAINT "causerie_groupes_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
