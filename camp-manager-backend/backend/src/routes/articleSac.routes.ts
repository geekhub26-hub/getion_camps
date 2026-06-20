import { Router } from 'express'
import { authenticate, staffOnly } from '../middlewares/auth.middleware'
import * as articleSac from '../controllers/articleSac.controller'

const router = Router({ mergeParams: true })

router.use(authenticate, staffOnly)

router.get('/', articleSac.getArticles)
router.post('/', articleSac.createArticle)
router.put('/:id', articleSac.updateArticle)
router.delete('/:id', articleSac.deleteArticle)

export default router
