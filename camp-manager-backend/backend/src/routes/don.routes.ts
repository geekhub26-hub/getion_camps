import { Router } from 'express'
import * as d from '../controllers/don.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()
router.use(authenticate)

router.get('/',      staffOnly, d.getDons)
router.post('/',     staffOnly, d.createDon)
router.delete('/:id', adminOnly, d.deleteDon)

export default router
