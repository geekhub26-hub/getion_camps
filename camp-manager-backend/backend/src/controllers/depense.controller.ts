import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getDepenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.query
    const where = campId ? { campId: String(campId) } : {}

    const depenses = await prisma.depense.findMany({
      where,
      orderBy: { dateDepense: 'desc' },
      include: { camp: { select: { id: true, nom: true } } },
    })

    sendSuccess(res, depenses, 'Dépenses récupérées')
  } catch (err) {
    next(err)
  }
}

export const createDepense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, libelle, categorie, montant, dateDepense, reference, notes } = req.body
    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)
    if (Number(montant) <= 0) throw new AppError('Le montant doit être supérieur à 0', 400)

    const depense = await prisma.depense.create({
      data: {
        campId,
        libelle,
        categorie,
        montant: Number(montant),
        dateDepense: dateDepense ? new Date(dateDepense) : new Date(),
        reference,
        notes,
      },
    })

    sendCreated(res, depense, 'Sortie enregistrée')
  } catch (err) {
    next(err)
  }
}

export const deleteDepense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const depense = await prisma.depense.findUnique({ where: { id: req.params.id } })
    if (!depense) throw new AppError('Dépense introuvable', 404)

    await prisma.depense.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Dépense supprimée')
  } catch (err) {
    next(err)
  }
}
