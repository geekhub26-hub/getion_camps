import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendSuccess, sendCreated } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

// ─── GET /camps/:campId/animateurs ────────────────────────────
export const getAnimateurs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { page = 1, perPage = 20, statut } = req.query

    const skip = (Number(page) - 1) * Number(perPage)
    const where: any = { campId }
    if (statut) where.statut = statut

    const [animateurs, total] = await Promise.all([
      prisma.animateur.findMany({
        where,
        skip,
        take: Number(perPage),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, nom: true, prenom: true, email: true, avatarUrl: true, actif: true }
          },
          _count: { select: { activites: true, groupes: true } }
        },
      }),
      prisma.animateur.count({ where }),
    ])

    sendSuccess(res, animateurs, 'Animateurs récupérés', 200, {
      total,
      page: Number(page),
      perPage: Number(perPage),
      totalPages: Math.ceil(total / Number(perPage)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /animateurs/:id ──────────────────────────────────────
export const getAnimateurById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const animateur = await prisma.animateur.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true, avatarUrl: true, actif: true, role: true }
        },
        camp: { select: { id: true, nom: true } },
        groupes: { select: { id: true, nom: true, couleur: true, _count: { select: { participants: true } } } },
        activites: {
          orderBy: { dateHeureDebut: 'desc' },
          take: 10,
          select: { id: true, titre: true, dateHeureDebut: true, statut: true }
        }
      },
    })
    if (!animateur) throw new AppError('Animateur introuvable', 404)

    sendSuccess(res, animateur)
  } catch (err) {
    next(err)
  }
}

// ─── POST /camps/:campId/animateurs ───────────────────────────
export const createAnimateur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { userId, specialite, telephone, dateArrivee, dateDepart } = req.body

    // Vérifier que le camp existe
    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('Utilisateur introuvable', 404)

    // Vérifier que l'utilisateur n'est pas déjà animateur dans ce camp
    const existing = await prisma.animateur.findFirst({
      where: { userId, campId }
    })
    if (existing) throw new AppError('Cet utilisateur est déjà animateur dans ce camp', 409)

    const animateur = await prisma.animateur.create({
      data: {
        userId,
        campId,
        specialite,
        telephone,
        dateArrivee: dateArrivee ? new Date(dateArrivee) : undefined,
        dateDepart: dateDepart ? new Date(dateDepart) : undefined,
      },
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        camp: { select: { nom: true } }
      }
    })

    sendCreated(res, animateur, 'Animateur ajouté au camp')
  } catch (err) {
    next(err)
  }
}

// ─── PUT /animateurs/:id ──────────────────────────────────────
export const updateAnimateur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const animateur = await prisma.animateur.findUnique({ where: { id: req.params.id } })
    if (!animateur) throw new AppError('Animateur introuvable', 404)

    const updated = await prisma.animateur.update({
      where: { id: req.params.id },
      data: {
        specialite: req.body.specialite,
        telephone: req.body.telephone,
        statut: req.body.statut,
        dateArrivee: req.body.dateArrivee ? new Date(req.body.dateArrivee) : undefined,
        dateDepart: req.body.dateDepart ? new Date(req.body.dateDepart) : undefined,
      },
      include: {
        user: { select: { nom: true, prenom: true, email: true } }
      }
    })

    sendSuccess(res, updated, 'Animateur mis à jour')
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /animateurs/:id ───────────────────────────────────
export const deleteAnimateur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const animateur = await prisma.animateur.findUnique({ where: { id: req.params.id } })
    if (!animateur) throw new AppError('Animateur introuvable', 404)

    await prisma.animateur.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Animateur retiré du camp')
  } catch (err) {
    next(err)
  }
}

// ─── GET /animateurs/disponibles ──────────────────────────────
export const getAnimateursDisponibles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const animateurs = await prisma.animateur.findMany({
      where: { statut: 'ACTIF' },
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true } },
        camp: { select: { id: true, nom: true } }
      },
      orderBy: { user: { nom: 'asc' } }
    })

    sendSuccess(res, animateurs, 'Animateurs disponibles récupérés')
  } catch (err) {
    next(err)
  }
}
