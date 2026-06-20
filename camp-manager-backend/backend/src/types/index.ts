import { Request } from 'express'
import { Role } from '@prisma/client'

// ─── Payload JWT ────────────────────────────────────────────
export interface JwtPayload {
  userId: string
  email: string
  role: Role
}

// ─── Request étendue avec l'utilisateur authentifié ─────────
export interface AuthRequest extends Request {
  user?: JwtPayload
}

// ─── Réponse API standard ───────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: string[]
  meta?: {
    total?: number
    page?: number
    perPage?: number
    totalPages?: number
  }
}

// ─── Pagination ─────────────────────────────────────────────
export interface PaginationQuery {
  page?: number
  perPage?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
