import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getActivites = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.query
    const where = campId ? { campId: String(campId) } : {}

    const activites = await prisma.activite.findMany({
      where,
      orderBy: { dateHeureDebut: 'asc' },
      include: {
        camp: { select: { id: true, nom: true } },
        animateur: true,
        groupes: { include: { groupe: { select: { nom: true, couleur: true } } } },
      },
    })

    sendSuccess(res, activites, 'Activités récupérées')
  } catch (err) {
    next(err)
  }
}

export const createActivite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, titre, description, lieu, dateHeureDebut, dateHeureFin, capaciteMax, couleur, materiel, statut } = req.body

    if (new Date(dateHeureDebut) >= new Date(dateHeureFin)) {
      throw new AppError('La date de début doit être avant la date de fin', 400)
    }

    const activite = await prisma.activite.create({
      data: {
        campId,
        titre,
        description,
        lieu,
        dateHeureDebut: new Date(dateHeureDebut),
        dateHeureFin: new Date(dateHeureFin),
        capaciteMax: capaciteMax ? Number(capaciteMax) : undefined,
        couleur,
        materiel,
        statut,
      },
    })

    sendCreated(res, activite, 'Activité créée')
  } catch (err) {
    next(err)
  }
}

export const updateActivite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activite = await prisma.activite.findUnique({ where: { id: req.params.id } })
    if (!activite) throw new AppError('Activité introuvable', 404)

    const updated = await prisma.activite.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        dateHeureDebut: req.body.dateHeureDebut ? new Date(req.body.dateHeureDebut) : undefined,
        dateHeureFin: req.body.dateHeureFin ? new Date(req.body.dateHeureFin) : undefined,
        capaciteMax: req.body.capaciteMax ? Number(req.body.capaciteMax) : undefined,
      },
    })

    sendSuccess(res, updated, 'Activité mise à jour')
  } catch (err) {
    next(err)
  }
}

export const deleteActivite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activite = await prisma.activite.findUnique({ where: { id: req.params.id } })
    if (!activite) throw new AppError('Activité introuvable', 404)

    await prisma.activite.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Activité supprimée')
  } catch (err) {
    next(err)
  }
}
