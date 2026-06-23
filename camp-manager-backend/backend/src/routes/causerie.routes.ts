import { Router } from 'express'
import * as c from '../controllers/causerie.controller'
import { authenticate, staffOnly } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })
router.use(authenticate)

router.get('/',                 staffOnly, c.getCauseries)
router.post('/',                staffOnly, c.upsertCauserie)
router.post('/reconduire',      staffOnly, c.reconduireCauseries)
router.delete('/:id',           staffOnly, c.deleteCauserie)

export default router
