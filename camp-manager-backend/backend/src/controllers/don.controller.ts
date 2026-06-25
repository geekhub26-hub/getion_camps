import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getDons = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.query
    const where = campId ? { campId: String(campId) } : {}

    const dons = await prisma.don.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { camp: { select: { id: true, nom: true } } },
    })

    sendSuccess(res, dons, 'Dons récupérés')
  } catch (err) {
    next(err)
  }
}

export const createDon = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, nom, prenom, telephone, description, montant, notes } = req.body

    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    const don = await prisma.don.create({
      data: {
        campId,
        nom,
        prenom,
        telephone,
        description,
        montant: montant ? Number(montant) : undefined,
        notes,
      },
    })

    sendCreated(res, don, 'Don enregistré')
  } catch (err) {
    next(err)
  }
}

export const updateDon = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const don = await prisma.don.findUnique({ where: { id: req.params.id } })
    if (!don) throw new AppError('Don introuvable', 404)

    const { nom, prenom, telephone, description, montant, notes } = req.body
    const updated = await prisma.don.update({
      where: { id: req.params.id },
      data: { nom, prenom, telephone, description, notes,
        montant: montant !== undefined ? (montant ? Number(montant) : null) : undefined },
    })
    sendSuccess(res, updated, 'Don mis à jour')
  } catch (err) {
    next(err)
  }
}

export const deleteDon = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const don = await prisma.don.findUnique({ where: { id: req.params.id } })
    if (!don) throw new AppError('Don introuvable', 404)

    await prisma.don.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Don supprimé')
  } catch (err) {
    next(err)
  }
}
