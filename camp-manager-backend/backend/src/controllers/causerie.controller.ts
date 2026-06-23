import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

// GET /camps/:campId/causeries?date=YYYY-MM-DD
export const getCauseries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { date } = req.query
    const where: Record<string, unknown> = { campId }
    if (date) where.date = new Date(String(date))

    const causeries = await prisma.causerieGroupe.findMany({
      where,
      include: { groupe: { select: { id: true, nom: true, couleur: true, animateurId: true, animateur: { select: { prenom: true, nom: true } }, _count: { select: { participants: true } } } } },
      orderBy: [{ date: 'asc' }, { groupe: { nom: 'asc' } }],
    })
    sendSuccess(res, causeries)
  } catch (err) { next(err) }
}

// POST /camps/:campId/causeries
export const upsertCauserie = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { groupeId, date, theme, resume, notes } = req.body
    if (!groupeId || !date || !theme) throw new AppError('groupeId, date et thème sont requis', 400)

    const dateObj = new Date(date)
    const c = await prisma.causerieGroupe.upsert({
      where: { groupeId_date: { groupeId, date: dateObj } },
      create: { campId, groupeId, date: dateObj, theme, resume, notes },
      update: { theme, resume, notes },
    })
    sendCreated(res, c, 'Causerie enregistrée')
  } catch (err) { next(err) }
}

// DELETE /camps/:campId/causeries/:id
export const deleteCauserie = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.causerieGroupe.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new AppError('Causerie introuvable', 404)
    await prisma.causerieGroupe.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Causerie supprimée')
  } catch (err) { next(err) }
}

// POST /camps/:campId/causeries/reconduire — copie causeries d'un jour au suivant
export const reconduireCauseries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { dateSource, dateCible } = req.body
    if (!dateSource || !dateCible) throw new AppError('dateSource et dateCible requis', 400)

    const sources = await prisma.causerieGroupe.findMany({
      where: { campId, date: new Date(dateSource) },
    })
    if (sources.length === 0) throw new AppError('Aucune causerie ce jour-là à reconduire', 404)

    const cibleDate = new Date(dateCible)
    const results = await Promise.allSettled(
      sources.map(s =>
        prisma.causerieGroupe.upsert({
          where: { groupeId_date: { groupeId: s.groupeId, date: cibleDate } },
          create: { campId, groupeId: s.groupeId, date: cibleDate, theme: s.theme, resume: s.resume ?? undefined, notes: s.notes ?? undefined },
          update: {},
        })
      )
    )
    const ok = results.filter(r => r.status === 'fulfilled').length
    sendSuccess(res, { reconduites: ok }, `${ok} causerie(s) reconduites`)
  } catch (err) { next(err) }
}
