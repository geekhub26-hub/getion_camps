import { Router } from 'express'
import * as message from '../controllers/message.controller'
import { authenticate, staffOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', staffOnly, message.getMessages)
router.post('/', staffOnly, message.createMessage)
router.put('/:id/read', staffOnly, message.markMessageRead)

export default router
