import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendSuccess, sendCreated } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

// ─── GET /camps ──────────────────────────────────────────────
export const getCamps = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 10, search, statut } = req.query

    const skip = (Number(page) - 1) * Number(perPage)
    const where: any = {}

    if (search) {
      where.OR = [
        { nom: { contains: String(search), mode: 'insensitive' } },
        { lieu: { contains: String(search), mode: 'insensitive' } },
      ]
    }
    if (statut) where.statut = statut

    const [camps, total] = await Promise.all([
      prisma.camp.findMany({
        where,
        skip,
        take: Number(perPage),
        orderBy: { dateDebut: 'desc' },
        include: {
          _count: { select: { participants: true, animateurs: true, activites: true } },
        },
      }),
      prisma.camp.count({ where }),
    ])

    sendSuccess(res, camps, 'Camps récupérés', 200, {
      total,
      page: Number(page),
      perPage: Number(perPage),
      totalPages: Math.ceil(total / Number(perPage)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /camps/:id ──────────────────────────────────────────
export const getCampById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const camp = await prisma.camp.findUnique({
      where: { id: req.params.id },
      include: {
        animateurs: true,
        groupes: { include: { _count: { select: { participants: true } } } },
        _count: { select: { participants: true, activites: true } },
      },
    })
    if (!camp) throw new AppError('Camp introuvable', 404)

    sendSuccess(res, camp)
  } catch (err) {
    next(err)
  }
}

// ─── POST /camps ─────────────────────────────────────────────
export const createCamp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { nom, description, lieu, adresse, dateDebut, dateFin, capaciteMax, prixBase } = req.body

    if (new Date(dateDebut) >= new Date(dateFin)) {
      throw new AppError('La date de début doit être avant la date de fin', 400)
    }

    const camp = await prisma.camp.create({
      data: { nom, description, lieu, adresse, dateDebut: new Date(dateDebut), dateFin: new Date(dateFin), capaciteMax: Number(capaciteMax), prixBase: prixBase || 0 },
    })

    sendCreated(res, camp, 'Camp créé avec succès')
  } catch (err) {
    next(err)
  }
}

// ─── PUT /camps/:id ──────────────────────────────────────────
export const updateCamp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const camp = await prisma.camp.findUnique({ where: { id: req.params.id } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    const updated = await prisma.camp.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        dateDebut: req.body.dateDebut ? new Date(req.body.dateDebut) : undefined,
        dateFin: req.body.dateFin ? new Date(req.body.dateFin) : undefined,
      },
    })

    sendSuccess(res, updated, 'Camp mis à jour')
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /camps/:id ───────────────────────────────────────
export const deleteCamp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const camp = await prisma.camp.findUnique({ where: { id: req.params.id } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    await prisma.camp.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Camp supprimé')
  } catch (err) {
    next(err)
  }
}

// ─── GET /camps/:id/stats ────────────────────────────────────
export const getCampStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campId = req.params.id

    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    const [participants, paiements, activites, documents] = await Promise.all([
      prisma.participant.groupBy({ by: ['statutInscription'], where: { campId }, _count: true }),
      prisma.paiement.aggregate({ where: { participant: { campId } }, _sum: { montant: true, montantTotal: true }, _count: true }),
      prisma.activite.count({ where: { campId } }),
      prisma.document.groupBy({ by: ['statut'], where: { participant: { campId } }, _count: true }),
    ])

    const totalParticipants = participants.reduce((acc, p) => acc + p._count, 0)
    const confirmes = participants.find(p => p.statutInscription === 'CONFIRME')?._count || 0
    const tauxOccupation = camp.capaciteMax > 0 ? Math.round((totalParticipants / camp.capaciteMax) * 100) : 0

    sendSuccess(res, {
      camp: { id: campId, nom: camp.nom, capaciteMax: camp.capaciteMax },
      participants: { total: totalParticipants, confirmes, tauxOccupation, parStatut: participants },
      finance: {
        totalEncaisse: paiements._sum.montant || 0,
        totalAttendu: paiements._sum.montantTotal || 0,
        nombrePaiements: paiements._count,
      },
      activites,
      documents: { parStatut: documents },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /camps/:campId/paroisses ─────────────────────────────
export const getCampParoisses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paroisses = await prisma.campParoisse.findMany({
      where: { campId: req.params.campId },
      orderBy: { nom: 'asc' },
    })
    sendSuccess(res, paroisses)
  } catch (err) { next(err) }
}

// ─── POST /camps/:campId/paroisses ────────────────────────────
export const createCampParoisse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { nom, responsable, telephone } = req.body
    if (!nom) throw new AppError('Nom de paroisse requis', 400)
    const p = await prisma.campParoisse.create({
      data: { campId: req.params.campId, nom, responsable, telephone },
    })
    sendCreated(res, p, 'Paroisse ajoutée')
  } catch (err) { next(err) }
}

// ─── DELETE /camps/:campId/paroisses/:paroisseId ──────────────
export const deleteCampParoisse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.campParoisse.delete({ where: { id: req.params.paroisseId } })
    sendSuccess(res, null, 'Paroisse supprimée')
  } catch (err) { next(err) }
}
