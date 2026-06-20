import { Router } from 'express'
import * as participant from '../controllers/participant.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/:id', staffOnly, participant.getParticipantById)
router.put('/:id', staffOnly, participant.updateParticipant)
router.delete('/:id', adminOnly, participant.deleteParticipant)
router.put('/:id/statut', adminOnly, participant.updateStatutInscription)

export default router
