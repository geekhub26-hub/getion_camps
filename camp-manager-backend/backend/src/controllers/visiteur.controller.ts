import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getVisiteurs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.query
    const where = campId ? { campId: String(campId) } : {}

    const visiteurs = await prisma.visiteur.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { camp: { select: { id: true, nom: true } } },
    })

    sendSuccess(res, visiteurs, 'Visiteurs récupérés')
  } catch (err) {
    next(err)
  }
}

export const createVisiteur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, nom, prenom, telephone, qualite, notes, heureArrivee, heureDepart } = req.body

    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    const visiteur = await prisma.visiteur.create({
      data: { campId, nom, prenom, telephone, qualite, notes, heureArrivee, heureDepart },
    })

    sendCreated(res, visiteur, 'Visiteur enregistré')
  } catch (err) {
    next(err)
  }
}

export const updateVisiteur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visiteur = await prisma.visiteur.findUnique({ where: { id: req.params.id } })
    if (!visiteur) throw new AppError('Visiteur introuvable', 404)

    const { nom, prenom, telephone, qualite, notes, heureArrivee, heureDepart } = req.body

    const updated = await prisma.visiteur.update({
      where: { id: req.params.id },
      data: { nom, prenom, telephone, qualite, notes, heureArrivee, heureDepart },
    })

    sendSuccess(res, updated, 'Visiteur mis à jour')
  } catch (err) {
    next(err)
  }
}

export const deleteVisiteur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const visiteur = await prisma.visiteur.findUnique({ where: { id: req.params.id } })
    if (!visiteur) throw new AppError('Visiteur introuvable', 404)

    await prisma.visiteur.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Visiteur supprimé')
  } catch (err) {
    next(err)
  }
}
