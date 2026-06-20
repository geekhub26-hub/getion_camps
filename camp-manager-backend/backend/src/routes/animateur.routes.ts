import { Router } from 'express'
import * as animateur from '../controllers/animateur.controller'
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

// Routes pour les animateurs d'un camp spécifique
router.get('/camps/:campId/animateurs', staffOnly, animateur.getAnimateurs)
router.post('/camps/:campId/animateurs', adminOnly, animateur.createAnimateur)

// Routes pour un animateur spécifique
router.get('/animateurs/:id', staffOnly, animateur.getAnimateurById)
router.put('/animateurs/:id', adminOnly, animateur.updateAnimateur)
router.delete('/animateurs/:id', adminOnly, animateur.deleteAnimateur)

// Créer compte + animateur en une étape (admin only)
router.post('/animateurs/creer', adminOnly, animateur.createAnimateurAvecCompte)

// Route utilitaire
router.get('/animateurs/disponibles/liste', staffOnly, animateur.getAnimateursDisponibles)

export default router
