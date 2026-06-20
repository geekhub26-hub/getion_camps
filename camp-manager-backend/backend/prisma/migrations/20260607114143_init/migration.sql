-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ANIMATEUR', 'PARENT');

-- CreateEnum
CREATE TYPE "StatutCamp" AS ENUM ('BROUILLON', 'OUVERT', 'COMPLET', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'LISTE_ATTENTE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'PARTIEL', 'PAYE', 'REMBOURSE', 'ANNULE');

-- CreateEnum
CREATE TYPE "MethodePaiement" AS ENUM ('ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CARTE_BANCAIRE', 'CHEQUE');

-- CreateEnum
CREATE TYPE "StatutAnimateur" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('AUTORISATION_PARENTALE', 'FICHE_SANTE', 'PHOTO_IDENTITE', 'CERTIFICAT_MEDICAL', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutDocument" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('PAIEMENT_RELANCE', 'DOCUMENT_MANQUANT', 'ACTIVITE_RAPPEL', 'INSCRIPTION_CONFIRMEE', 'MESSAGE_RECU', 'ANNONCE_GENERALE');

-- CreateEnum
CREATE TYPE "RelationParent" AS ENUM ('PERE', 'MERE', 'TUTEUR', 'AUTRE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "avatar_url" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dernier_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camps" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "lieu" TEXT NOT NULL,
    "adresse" TEXT,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "capacite_max" INTEGER NOT NULL,
    "prix_base" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "statut" "StatutCamp" NOT NULL DEFAULT 'BROUILLON',
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3) NOT NULL,
    "genre" TEXT,
    "nationalite" TEXT,
    "groupe_sanguin" TEXT,
    "infos_medicales" TEXT,
    "allergies" TEXT,
    "medicaments" TEXT,
    "nom_urgence" TEXT NOT NULL,
    "telephone_urgence" TEXT NOT NULL,
    "statut_inscription" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "numero_chambre" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "telephone2" TEXT,
    "relation" "RelationParent" NOT NULL DEFAULT 'PERE',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animateurs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "specialite" TEXT,
    "telephone" TEXT,
    "statut" "StatutAnimateur" NOT NULL DEFAULT 'ACTIF',
    "date_arrivee" TIMESTAMP(3),
    "date_depart" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupes" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#6366f1',
    "animateur_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_groupes" (
    "participant_id" TEXT NOT NULL,
    "groupe_id" TEXT NOT NULL,
    "assigne_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_groupes_pkey" PRIMARY KEY ("participant_id","groupe_id")
);

-- CreateTable
CREATE TABLE "activites" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "animateur_id" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "lieu" TEXT,
    "date_heure_debut" TIMESTAMP(3) NOT NULL,
    "date_heure_fin" TIMESTAMP(3) NOT NULL,
    "capacite_max" INTEGER,
    "couleur" TEXT NOT NULL DEFAULT '#0ea5e9',
    "materiel" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activite_groupes" (
    "activite_id" TEXT NOT NULL,
    "groupe_id" TEXT NOT NULL,

    CONSTRAINT "activite_groupes_pkey" PRIMARY KEY ("activite_id","groupe_id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "montant_total" DECIMAL(10,2) NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "methode" "MethodePaiement" NOT NULL DEFAULT 'ESPECES',
    "reference" TEXT,
    "date_paiement" TIMESTAMP(3),
    "notes" TEXT,
    "recu" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "url_fichier" TEXT NOT NULL,
    "statut" "StatutDocument" NOT NULL DEFAULT 'EN_ATTENTE',
    "taille_fichier" INTEGER,
    "mime_type" TEXT,
    "notes" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valide_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "expediteur_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "envoye" BOOLEAN NOT NULL DEFAULT true,
    "envoye_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lu_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "destinataire_id" TEXT NOT NULL,
    "camp_id" TEXT,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "lien_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lu_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistique_snaps" (
    "id" TEXT NOT NULL,
    "camp_id" TEXT NOT NULL,
    "date_snap" TIMESTAMP(3) NOT NULL,
    "total_participants" INTEGER NOT NULL,
    "total_confirmes" INTEGER NOT NULL,
    "total_paye" INTEGER NOT NULL,
    "revenus_total" DECIMAL(10,2) NOT NULL,
    "revenus_cibles" DECIMAL(10,2) NOT NULL,
    "activites_count" INTEGER NOT NULL,
    "documents_valides" INTEGER NOT NULL,
    "documents_pending" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statistique_snaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "animateurs_user_id_key" ON "animateurs"("user_id");

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animateurs" ADD CONSTRAINT "animateurs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animateurs" ADD CONSTRAINT "animateurs_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupes" ADD CONSTRAINT "groupes_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupes" ADD CONSTRAINT "groupes_animateur_id_fkey" FOREIGN KEY ("animateur_id") REFERENCES "animateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_groupes" ADD CONSTRAINT "participant_groupes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_groupes" ADD CONSTRAINT "participant_groupes_groupe_id_fkey" FOREIGN KEY ("groupe_id") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites" ADD CONSTRAINT "activites_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites" ADD CONSTRAINT "activites_animateur_id_fkey" FOREIGN KEY ("animateur_id") REFERENCES "animateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activite_groupes" ADD CONSTRAINT "activite_groupes_activite_id_fkey" FOREIGN KEY ("activite_id") REFERENCES "activites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activite_groupes" ADD CONSTRAINT "activite_groupes_groupe_id_fkey" FOREIGN KEY ("groupe_id") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_expediteur_id_fkey" FOREIGN KEY ("expediteur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_destinataire_id_fkey" FOREIGN KEY ("destinataire_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistique_snaps" ADD CONSTRAINT "statistique_snaps_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
