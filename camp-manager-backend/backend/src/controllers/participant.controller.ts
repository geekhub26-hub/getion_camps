import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendSuccess, sendCreated } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

// ─── GET /camps/:campId/participants ──────────────────────────
export const getParticipants = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { page = 1, perPage = 20, search, statut, groupeId } = req.query

    const skip = (Number(page) - 1) * Number(perPage)
    const where: any = { campId }

    if (search) {
      where.OR = [
        { nom: { contains: String(search), mode: 'insensitive' } },
        { prenom: { contains: String(search), mode: 'insensitive' } },
      ]
    }
    if (statut) where.statutInscription = statut
    if (groupeId) where.groupes = { some: { groupeId: String(groupeId) } }

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        skip,
        take: Number(perPage),
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
        include: {
          parents: { where: { principal: true }, take: 1 },
          groupes: { include: { groupe: { select: { nom: true, couleur: true } } } },
          paiements: { select: { montant: true, montantTotal: true, statut: true } },
          _count: { select: { documents: true } },
        },
      }),
      prisma.participant.count({ where }),
    ])

    sendSuccess(res, participants, 'Participants récupérés', 200, {
      total, page: Number(page), perPage: Number(perPage),
      totalPages: Math.ceil(total / Number(perPage)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /participants/:id ────────────────────────────────────
export const getParticipantById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: req.params.id },
      include: {
        camp: { select: { nom: true, dateDebut: true, dateFin: true } },
        parents: true,
        paiements: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        groupes: { include: { groupe: true } },
      },
    })
    if (!participant) throw new AppError('Participant introuvable', 404)

    sendSuccess(res, participant)
  } catch (err) {
    next(err)
  }
}

// ─── POST /camps/:campId/participants ─────────────────────────
export const createParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: { _count: { select: { participants: true } } },
    })
    if (!camp) throw new AppError('Camp introuvable', 404)
    if (camp._count.participants >= camp.capaciteMax) {
      throw new AppError('Le camp est complet', 409)
    }

    const { parents, montantVerse, ...participantData } = req.body

    const participant = await prisma.participant.create({
      data: {
        ...participantData,
        campId,
        dateNaissance: participantData.dateNaissance ? new Date(participantData.dateNaissance) : new Date('2000-01-01'),
        participationsAnterieures: participantData.participationsAnterieures
          ? Number(participantData.participationsAnterieures) : 0,
        parents: parents?.length ? { create: parents } : undefined,
      },
      include: { parents: true },
    })

    // Créer un paiement initial si un montant versé est fourni
    if (montantVerse && Number(montantVerse) > 0) {
      await prisma.paiement.create({
        data: {
          participantId: participant.id,
          montant: Number(montantVerse),
          montantTotal: camp.prixBase,
          statut: Number(montantVerse) >= Number(camp.prixBase) ? 'PAYE' : 'PARTIEL',
          methode: 'ESPECES',
          datePaiement: new Date(),
        },
      })
    }

    sendCreated(res, participant, 'Participant inscrit avec succès')
  } catch (err) {
    next(err)
  }
}

// ─── PUT /participants/:id ────────────────────────────────────
export const updateParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const participant = await prisma.participant.findUnique({ where: { id: req.params.id } })
    if (!participant) throw new AppError('Participant introuvable', 404)

    const { parents, ...data } = req.body
    const updated = await prisma.participant.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
      },
    })

    sendSuccess(res, updated, 'Participant mis à jour')
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /participants/:id ─────────────────────────────────
export const deleteParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const participant = await prisma.participant.findUnique({ where: { id: req.params.id } })
    if (!participant) throw new AppError('Participant introuvable', 404)

    await prisma.participant.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Participant supprimé')
  } catch (err) {
    next(err)
  }
}

// ─── PUT /participants/:id/statut ─────────────────────────────
export const updateStatutInscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { statut } = req.body
    const updated = await prisma.participant.update({
      where: { id: req.params.id },
      data: { statutInscription: statut },
    })
    sendSuccess(res, updated, 'Statut mis à jour')
  } catch (err) {
    next(err)
  }
}
