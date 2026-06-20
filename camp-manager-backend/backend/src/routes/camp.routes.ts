import { Router } from 'express'
import * as camp from '../controllers/camp.controller'
import * as participant from '../controllers/participant.controller'
import { authenticate, adminOnly, staffOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', camp.getCamps)
router.post('/', adminOnly, camp.createCamp)
router.get('/:id', camp.getCampById)
router.put('/:id', adminOnly, camp.updateCamp)
router.delete('/:id', adminOnly, camp.deleteCamp)
router.get('/:id/stats', staffOnly, camp.getCampStats)

// Participants imbriqués sous /camps/:campId/participants
router.get('/:campId/participants', staffOnly, participant.getParticipants)
router.post('/:campId/participants', staffOnly, participant.createParticipant)

// Paroisses d'un camp
router.get('/:campId/paroisses', staffOnly, camp.getCampParoisses)
router.post('/:campId/paroisses', adminOnly, camp.createCampParoisse)
router.delete('/:campId/paroisses/:paroisseId', adminOnly, camp.deleteCampParoisse)

export default router
