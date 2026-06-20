import { Router } from 'express'
import * as animateur from '../controllers/animateur.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/',     staffOnly, animateur.getAnimateurs)
router.post('/',    adminOnly, animateur.createAnimateur)
router.get('/:id',  staffOnly, animateur.getAnimateurById)
router.put('/:id',  adminOnly, animateur.updateAnimateur)
router.delete('/:id', adminOnly, animateur.deleteAnimateur)

export default router
