import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, statut } = req.query
    const where: any = {}

    if (campId) where.participant = { campId: String(campId) }
    if (statut) where.statut = statut

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        participant: { select: { id: true, nom: true, prenom: true, camp: { select: { id: true, nom: true } } } },
      },
    })

    sendSuccess(res, documents, 'Documents récupérés')
  } catch (err) {
    next(err)
  }
}

export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { participantId, nom, type, urlFichier, notes } = req.body

    const participant = await prisma.participant.findUnique({ where: { id: participantId } })
    if (!participant) throw new AppError('Participant introuvable', 404)

    const document = await prisma.document.create({
      data: { participantId, nom, type, urlFichier, notes },
    })

    sendCreated(res, document, 'Document ajouté')
  } catch (err) {
    next(err)
  }
}

export const updateDocumentStatut = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { statut, notes } = req.body
    const document = await prisma.document.findUnique({ where: { id: req.params.id } })
    if (!document) throw new AppError('Document introuvable', 404)

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        statut,
        notes,
        valideAt: statut === 'VALIDE' ? new Date() : undefined,
      },
    })

    sendSuccess(res, updated, 'Document mis à jour')
  } catch (err) {
    next(err)
  }
}
