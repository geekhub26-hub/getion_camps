import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId } = req.query
    const where = campId ? { campId: String(campId) } : {}

    const messages = await prisma.message.findMany({
      where,
      orderBy: { envoyeAt: 'desc' },
      include: {
        camp: { select: { id: true, nom: true } },
        expediteur: { select: { nom: true, prenom: true, email: true } },
        parent: { select: { nom: true, prenom: true, email: true, telephone: true } },
      },
    })

    sendSuccess(res, messages, 'Messages récupérés')
  } catch (err) {
    next(err)
  }
}

export const createMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Non authentifié', 401)

    const { campId, parentId, sujet, contenu } = req.body
    const message = await prisma.message.create({
      data: {
        campId,
        parentId: parentId || undefined,
        expediteurId: req.user.userId,
        sujet,
        contenu,
      },
    })

    sendCreated(res, message, 'Message envoyé')
  } catch (err) {
    next(err)
  }
}

export const markMessageRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } })
    if (!message) throw new AppError('Message introuvable', 404)

    const updated = await prisma.message.update({
      where: { id: req.params.id },
      data: { lu: true, luAt: new Date() },
    })

    sendSuccess(res, updated, 'Message marqué comme lu')
  } catch (err) {
    next(err)
  }
}
