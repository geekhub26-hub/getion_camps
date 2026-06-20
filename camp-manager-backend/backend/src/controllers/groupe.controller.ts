import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendSuccess, sendCreated } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

// ─── GET /camps/:campId/groupes ──────────────────────────────
export const getGroupes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { page = 1, perPage = 20 } = req.query

    const skip = (Number(page) - 1) * Number(perPage)

    const [groupes, total] = await Promise.all([
      prisma.groupe.findMany({
        where: { campId },
        skip,
        take: Number(perPage),
        orderBy: { nom: 'asc' },
        include: {
          animateur: {
            select: { id: true, nom: true, prenom: true, telephone: true }
          },
          _count: { select: { participants: true } }
        },
      }),
      prisma.groupe.count({ where: { campId } }),
    ])

    sendSuccess(res, groupes, 'Groupes récupérés', 200, {
      total,
      page: Number(page),
      perPage: Number(perPage),
      totalPages: Math.ceil(total / Number(perPage)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /groupes/:id ─────────────────────────────────────────
export const getGroupeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groupe = await prisma.groupe.findUnique({
      where: { id: req.params.id },
      include: {
        camp: { select: { id: true, nom: true } },
        animateur: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        participants: {
          include: {
            participant: {
              select: { id: true, nom: true, prenom: true, statutInscription: true }
            }
          }
        },
        activites: {
          include: { activite: { select: { id: true, titre: true, dateHeureDebut: true } } }
        }
      },
    })
    if (!groupe) throw new AppError('Groupe introuvable', 404)

    sendSuccess(res, groupe)
  } catch (err) {
    next(err)
  }
}

// ─── POST /camps/:campId/groupes ──────────────────────────────
export const createGroupe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.params
    const { nom, couleur, animateurId, description } = req.body

    // Vérifier que le camp existe
    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    // Vérifier que l'animateur existe si fourni
    if (animateurId) {
      const animateur = await prisma.animateur.findUnique({ where: { id: animateurId } })
      if (!animateur) throw new AppError('Animateur introuvable', 404)
    }

    const groupe = await prisma.groupe.create({
      data: {
        campId,
        nom,
        couleur: couleur || '#6366f1',
        animateurId: animateurId || null,
        description,
      },
      include: {
        animateur: true
      }
    })

    sendCreated(res, groupe, 'Groupe créé avec succès')
  } catch (err) {
    next(err)
  }
}

// ─── PUT /groupes/:id ─────────────────────────────────────────
export const updateGroupe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groupe = await prisma.groupe.findUnique({ where: { id: req.params.id } })
    if (!groupe) throw new AppError('Groupe introuvable', 404)

    if (req.body.animateurId) {
      const animateur = await prisma.animateur.findUnique({ where: { id: req.body.animateurId } })
      if (!animateur) throw new AppError('Animateur introuvable', 404)
    }

    const updated = await prisma.groupe.update({
      where: { id: req.params.id },
      data: {
        nom: req.body.nom,
        couleur: req.body.couleur,
        animateurId: req.body.animateurId || null,
        description: req.body.description,
      },
      include: {
        animateur: true
      }
    })

    sendSuccess(res, updated, 'Groupe mis à jour')
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /groupes/:id ──────────────────────────────────────
export const deleteGroupe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groupe = await prisma.groupe.findUnique({ where: { id: req.params.id } })
    if (!groupe) throw new AppError('Groupe introuvable', 404)

    await prisma.groupe.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Groupe supprimé')
  } catch (err) {
    next(err)
  }
}

// ─── POST /groupes/:groupeId/participants/:participantId ──────
export const addParticipantToGroupe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupeId, participantId } = req.params

    const groupe = await prisma.groupe.findUnique({ where: { id: groupeId } })
    if (!groupe) throw new AppError('Groupe introuvable', 404)

    const participant = await prisma.participant.findUnique({ where: { id: participantId } })
    if (!participant) throw new AppError('Participant introuvable', 404)

    const existing = await prisma.participantGroupe.findUnique({
      where: { participantId_groupeId: { participantId, groupeId } }
    })

    if (existing) throw new AppError('Participant déjà dans ce groupe', 409)

    const link = await prisma.participantGroupe.create({
      data: { participantId, groupeId }
    })

    sendSuccess(res, link, 'Participant ajouté au groupe')
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /groupes/:groupeId/participants/:participantId ────
export const removeParticipantFromGroupe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupeId, participantId } = req.params

    await prisma.participantGroupe.delete({
      where: { participantId_groupeId: { participantId, groupeId } }
    })

    sendSuccess(res, null, 'Participant retiré du groupe')
  } catch (err) {
    next(err)
  }
}
