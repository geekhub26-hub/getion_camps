import { Router } from 'express'
import * as fp from '../controllers/fichePresence.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()
router.use(authenticate)

router.get('/',     staffOnly, fp.getFiches)
router.post('/',    staffOnly, fp.createFiche)
router.put('/:id',  staffOnly, fp.updateFiche)
router.delete('/:id', adminOnly, fp.deleteFiche)

export default router
