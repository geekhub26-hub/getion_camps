import { Router } from 'express'
import * as groupe from '../controllers/groupe.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

// Routes pour les groupes d'un camp spécifique
router.get('/camps/:campId/groupes', staffOnly, groupe.getGroupes)
router.post('/camps/:campId/groupes', adminOnly, groupe.createGroupe)

// Routes pour un groupe spécifique
router.get('/groupes/:id', staffOnly, groupe.getGroupeById)
router.put('/groupes/:id', adminOnly, groupe.updateGroupe)
router.delete('/groupes/:id', adminOnly, groupe.deleteGroupe)

// Gestion des participants dans un groupe
router.post('/groupes/:groupeId/participants/:participantId', staffOnly, groupe.addParticipantToGroupe)
router.delete('/groupes/:groupeId/participants/:participantId', staffOnly, groupe.removeParticipantFromGroupe)

export default router
