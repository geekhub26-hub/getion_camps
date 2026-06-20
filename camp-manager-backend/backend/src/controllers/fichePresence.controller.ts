import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getFiches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, type } = req.query
    const where: any = {}
    if (campId) where.campId = String(campId)
    if (type) where.type = String(type)

    const fiches = await prisma.fichePresence.findMany({
      where,
      orderBy: { heureSortie: 'desc' },
      include: { camp: { select: { id: true, nom: true } } },
    })

    sendSuccess(res, fiches, 'Fiches récupérées')
  } catch (err) {
    next(err)
  }
}

export const createFiche = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, type, nom, prenom, heureSortie, motif, notes } = req.body

    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    const fiche = await prisma.fichePresence.create({
      data: {
        campId,
        type: type || 'ANIMATEUR',
        nom,
        prenom,
        heureSortie: new Date(heureSortie),
        motif,
        notes,
      },
    })

    sendCreated(res, fiche, 'Fiche créée')
  } catch (err) {
    next(err)
  }
}

export const updateFiche = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fiche = await prisma.fichePresence.findUnique({ where: { id: req.params.id } })
    if (!fiche) throw new AppError('Fiche introuvable', 404)

    const updated = await prisma.fichePresence.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        heureSortie: req.body.heureSortie ? new Date(req.body.heureSortie) : undefined,
        heureRetour: req.body.heureRetour ? new Date(req.body.heureRetour) : undefined,
      },
    })

    sendSuccess(res, updated, 'Fiche mise à jour')
  } catch (err) {
    next(err)
  }
}

export const deleteFiche = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const fiche = await prisma.fichePresence.findUnique({ where: { id: req.params.id } })
    if (!fiche) throw new AppError('Fiche introuvable', 404)

    await prisma.fichePresence.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Fiche supprimée')
  } catch (err) {
    next(err)
  }
}
