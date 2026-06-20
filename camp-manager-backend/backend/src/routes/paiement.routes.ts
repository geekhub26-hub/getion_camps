import { Router } from 'express'
import * as paiement from '../controllers/paiement.controller'
import { authenticate, staffOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', staffOnly, paiement.getPaiements)
router.post('/', staffOnly, paiement.createPaiement)
router.put('/:id', staffOnly, paiement.updatePaiement)
router.delete('/:id', staffOnly, paiement.deletePaiement)

export default router
