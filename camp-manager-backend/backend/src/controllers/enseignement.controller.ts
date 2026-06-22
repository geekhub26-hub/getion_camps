import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getEnseignements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campId = req.params.campId || String(req.query.campId || '')
    const enseignements = await prisma.enseignement.findMany({
      where: { campId },
      orderBy: { date: 'asc' },
    })
    sendSuccess(res, enseignements, 'Enseignements récupérés')
  } catch (err) {
    next(err)
  }
}

export const createEnseignement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campId = req.params.campId
    const { date, orateur, theme, contenu, notes } = req.body
    if (!date || !orateur || !theme || !contenu) throw new AppError('date, orateur, thème et contenu sont requis', 400)

    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    const e = await prisma.enseignement.create({
      data: { campId, date: new Date(date), orateur, theme, contenu, notes },
    })
    sendCreated(res, e, 'Enseignement créé')
  } catch (err) {
    next(err)
  }
}

export const updateEnseignement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.enseignement.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new AppError('Enseignement introuvable', 404)

    const { date, orateur, theme, contenu, notes } = req.body
    const e = await prisma.enseignement.update({
      where: { id: req.params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(orateur !== undefined && { orateur }),
        ...(theme !== undefined && { theme }),
        ...(contenu !== undefined && { contenu }),
        ...(notes !== undefined && { notes }),
      },
    })
    sendSuccess(res, e, 'Enseignement mis à jour')
  } catch (err) {
    next(err)
  }
}

export const deleteEnseignement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.enseignement.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new AppError('Enseignement introuvable', 404)

    await prisma.enseignement.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Enseignement supprimé')
  } catch (err) {
    next(err)
  }
}
