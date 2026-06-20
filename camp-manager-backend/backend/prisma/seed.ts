import { PrismaClient, Role, StatutCamp, StatutInscription, MethodePaiement, StatutPaiement } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Valeurs par défaut (sans process.env)
const ADMIN_EMAIL = 'admin@camp.cm'
const ADMIN_PASSWORD = 'Admin1234!'

async function main() {
  console.log('🌱 Début du seed...')

  // ── Nettoyage ────────────────────────────────────────────
  console.log('   Nettoyage de la base...')
  await prisma.statistiqueSnap.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.document.deleteMany()
  await prisma.depense.deleteMany()
  await prisma.paiement.deleteMany()
  await prisma.participantGroupe.deleteMany()
  await prisma.activiteGroupe.deleteMany()
  await prisma.activite.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.groupe.deleteMany()
  await prisma.animateur.deleteMany()
  await prisma.camp.deleteMany()
  await prisma.user.deleteMany()
  console.log('   ✓ Base nettoyée')

  // ── Utilisateurs ─────────────────────────────────────────
  const hash = (p: string) => bcrypt.hash(p, 12)

  const superAdmin = await prisma.user.create({ 
    data: { 
      nom: 'Système', 
      prenom: 'Admin', 
      email: ADMIN_EMAIL, 
      motDePasseHash: await hash(ADMIN_PASSWORD), 
      role: Role.SUPER_ADMIN 
    } 
  })
  
  const admin = await prisma.user.create({ 
    data: { 
      nom: 'Nguema', 
      prenom: 'Brigitte', 
      email: 'brigitte@camp.cm', 
      motDePasseHash: await hash('Animateur1!'), 
      role: Role.ADMIN 
    } 
  })
  
  console.log('   ✓ Utilisateurs créés')

  // ── Camp ─────────────────────────────────────────────────
  const camp = await prisma.camp.create({
    data: {
      nom: 'Camp Été Yaoundé 2025',
      description: 'Camp de vacances pour adolescents de 12 à 17 ans',
      lieu: 'Yaoundé',
      adresse: 'Centre de loisirs de Mfandena, Yaoundé',
      dateDebut: new Date('2025-07-07'),
      dateFin: new Date('2025-07-21'),
      capaciteMax: 60,
      prixBase: 75000,
      statut: StatutCamp.OUVERT,
    },
  })
  console.log('   ✓ Camp créé')

  // ── Animateurs ────────────────────────────────────────────
  const anim1 = await prisma.animateur.create({
    data: {
      nom: 'Mvondo', prenom: 'Jean-Paul',
      campId: camp.id,
      specialite: 'Sports & Plein air',
      telephone: '+237600000001',
      missions: 'Encadrement des activités sportives et plein air',
    }
  })

  const anim2 = await prisma.animateur.create({
    data: {
      nom: 'Bella', prenom: 'Sophie',
      campId: camp.id,
      specialite: 'Arts & Créativité',
      telephone: '+237600000002',
      missions: 'Animation des ateliers artistiques et créatifs',
    }
  })
  console.log('   ✓ Animateurs créés')

  // ── Groupes ───────────────────────────────────────────────
  const groupeA = await prisma.groupe.create({ 
    data: { 
      campId: camp.id, 
      nom: 'Les Lions', 
      couleur: '#f59e0b', 
      animateurId: anim1.id 
    } 
  })
  
  const groupeB = await prisma.groupe.create({ 
    data: { 
      campId: camp.id, 
      nom: 'Les Aigles', 
      couleur: '#3b82f6', 
      animateurId: anim2.id 
    } 
  })
  console.log('   ✓ Groupes créés')

  // ── Participants ──────────────────────────────────────────
  const participantsData = [
    { nom: 'Ateba', prenom: 'Loïc', groupeId: groupeA.id, statut: StatutInscription.CONFIRME, paye: true },
    { nom: 'Essomba', prenom: 'Marie', groupeId: groupeA.id, statut: StatutInscription.CONFIRME, paye: true },
    { nom: 'Nkodo', prenom: 'Pierre', groupeId: groupeA.id, statut: StatutInscription.CONFIRME, paye: false },
    { nom: 'Biyong', prenom: 'Ange', groupeId: groupeB.id, statut: StatutInscription.CONFIRME, paye: true },
    { nom: 'Manga', prenom: 'Cécile', groupeId: groupeB.id, statut: StatutInscription.EN_ATTENTE, paye: false },
    { nom: 'Owona', prenom: 'Samuel', groupeId: groupeB.id, statut: StatutInscription.CONFIRME, paye: true },
  ]

  for (const p of participantsData) {
    const participant = await prisma.participant.create({
      data: {
        campId: camp.id,
        nom: p.nom,
        prenom: p.prenom,
        dateNaissance: new Date('2010-06-15'),
        nomUrgence: `Parent de ${p.prenom}`,
        telephoneUrgence: '+237699000000',
        statutInscription: p.statut,
        parents: {
          create: [{
            nom: p.nom,
            prenom: 'Parent',
            email: `parent.${p.nom.toLowerCase()}@email.com`,
            telephone: '+237699000001',
            relation: 'PERE',
            principal: true,
          }],
        },
      },
    })

    await prisma.participantGroupe.create({
      data: { participantId: participant.id, groupeId: p.groupeId },
    })

    await prisma.paiement.create({
      data: {
        participantId: participant.id,
        montant: p.paye ? 75000 : 25000,
        montantTotal: 75000,
        statut: p.paye ? StatutPaiement.PAYE : StatutPaiement.PARTIEL,
        methode: MethodePaiement.MOBILE_MONEY,
        datePaiement: p.paye ? new Date() : undefined,
      },
    })
  }
  console.log('   ✓ Participants créés')

  // ── Activités ─────────────────────────────────────────────
  const activitesData = [
    { 
      titre: 'Football', 
      description: 'Match de football inter-groupes', 
      lieu: 'Terrain extérieur', 
      dateHeureDebut: new Date('2025-07-08T09:00:00'),
      dateHeureFin: new Date('2025-07-08T11:00:00')
    },
    { 
      titre: 'Atelier peinture', 
      description: 'Création artistique libre', 
      lieu: 'Salle polyvalente', 
      dateHeureDebut: new Date('2025-07-08T14:00:00'),
      dateHeureFin: new Date('2025-07-08T16:00:00')
    },
    { 
      titre: 'Jeux de piste', 
      description: 'Chasse au trésor dans le camp', 
      lieu: 'Ensemble du camp', 
      dateHeureDebut: new Date('2025-07-09T10:00:00'),
      dateHeureFin: new Date('2025-07-09T12:00:00')
    },
  ]

  for (const a of activitesData) {
    const activite = await prisma.activite.create({
      data: { 
        campId: camp.id, 
        titre: a.titre, 
        description: a.description, 
        lieu: a.lieu, 
        dateHeureDebut: a.dateHeureDebut, 
        dateHeureFin: a.dateHeureFin, 
        animateurId: anim1.id 
      },
    })
    await prisma.activiteGroupe.createMany({
      data: [
        { activiteId: activite.id, groupeId: groupeA.id },
        { activiteId: activite.id, groupeId: groupeB.id },
      ],
    })
  }
  console.log('   ✓ Activités créées')

  // ── Dépenses ──────────────────────────────────────────────
  await prisma.depense.createMany({
    data: [
      { campId: camp.id, libelle: 'Location terrain', categorie: 'Logistique', montant: 120000, dateDepense: new Date('2025-07-01'), reference: 'DEP-001' },
      { campId: camp.id, libelle: 'Matériel sportif', categorie: 'Activités', montant: 85000, dateDepense: new Date('2025-07-03'), reference: 'DEP-002' },
    ],
  })
  console.log('   ✓ Dépenses créées')

  console.log('\n✅ Seed terminé avec succès !')
  console.log(`   Admin : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    throw e  // Au lieu de process.exit(1)
  })
  .finally(() => prisma.$disconnect())