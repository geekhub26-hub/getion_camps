import { Router } from 'express'
import * as e from '../controllers/enseignement.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })
router.use(authenticate)

router.get('/',    staffOnly, e.getEnseignements)
router.post('/',   staffOnly, e.createEnseignement)
router.put('/:id', staffOnly, e.updateEnseignement)
router.delete('/:id', adminOnly, e.deleteEnseignement)

export default router
