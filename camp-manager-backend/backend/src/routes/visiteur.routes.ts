import { Router } from 'express'
import * as v from '../controllers/visiteur.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()
router.use(authenticate)

router.get('/',       staffOnly, v.getVisiteurs)
router.post('/',      staffOnly, v.createVisiteur)
router.put('/:id',    staffOnly, v.updateVisiteur)
router.delete('/:id', adminOnly, v.deleteVisiteur)

export default router
