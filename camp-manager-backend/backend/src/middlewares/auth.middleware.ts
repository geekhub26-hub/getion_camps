import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { verifyAccessToken } from '../utils/jwt'
import { sendError } from '../utils/response'
import { Role } from '@prisma/client'

// ─── Vérifie le token JWT ────────────────────────────────────
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 'Token d\'authentification manquant', 401)
      return
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    sendError(res, 'Token invalide ou expiré', 401)
  }
}

// ─── Vérifie que l'utilisateur a le rôle requis ──────────────
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Non authentifié', 401)
      return
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Accès refusé — droits insuffisants', 403)
      return
    }
    next()
  }
}

// ─── Raccourcis pratiques ────────────────────────────────────
export const adminOnly = authorize(Role.SUPER_ADMIN, Role.ADMIN)
export const staffOnly = authorize(Role.SUPER_ADMIN, Role.ADMIN, Role.ANIMATEUR)
