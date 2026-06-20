import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import prisma from '../config/prisma'
import { sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'

export const getArticles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const articles = await prisma.articleSac.findMany({
      where: { participantId: req.params.participantId },
      orderBy: { createdAt: 'asc' },
    })
    sendSuccess(res, articles)
  } catch (e) { next(e) }
}

export const createArticle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { article, quantite, categorie, confisque, notes } = req.body
    if (!article?.trim()) throw new AppError('Le nom de l\'article est requis', 400)
    const created = await prisma.articleSac.create({
      data: {
        participantId: req.params.participantId,
        article: article.trim(),
        quantite: Number(quantite) || 1,
        categorie: categorie || null,
        confisque: Boolean(confisque),
        notes: notes || null,
      },
    })
    sendSuccess(res, created, 'Article ajouté', 201)
  } catch (e) { next(e) }
}

export const updateArticle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.articleSac.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new AppError('Article introuvable', 404)
    const { article, quantite, categorie, confisque, notes } = req.body
    const updated = await prisma.articleSac.update({
      where: { id: req.params.id },
      data: {
        article: article?.trim() ?? existing.article,
        quantite: quantite !== undefined ? Number(quantite) : existing.quantite,
        categorie: categorie !== undefined ? (categorie || null) : existing.categorie,
        confisque: confisque !== undefined ? Boolean(confisque) : existing.confisque,
        notes: notes !== undefined ? (notes || null) : existing.notes,
      },
    })
    sendSuccess(res, updated, 'Article mis à jour')
  } catch (e) { next(e) }
}

export const deleteArticle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.articleSac.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new AppError('Article introuvable', 404)
    await prisma.articleSac.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Article supprimé')
  } catch (e) { next(e) }
}
