import { Router } from 'express'
import * as activite from '../controllers/activite.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', staffOnly, activite.getActivites)
router.post('/', staffOnly, activite.createActivite)
router.put('/:id', staffOnly, activite.updateActivite)
router.delete('/:id', adminOnly, activite.deleteActivite)

export default router
