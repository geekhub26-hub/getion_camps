import { Router } from 'express'
import * as depense from '../controllers/depense.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', staffOnly, depense.getDepenses)
router.post('/', staffOnly, depense.createDepense)
router.put('/:id', adminOnly, depense.updateDepense)
router.delete('/:id', adminOnly, depense.deleteDepense)

export default router
