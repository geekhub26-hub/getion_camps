import { Router } from 'express'
import * as document from '../controllers/document.controller'
import { authenticate, staffOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', staffOnly, document.getDocuments)
router.post('/', staffOnly, document.createDocument)
router.put('/:id/statut', staffOnly, document.updateDocumentStatut)

export default router
