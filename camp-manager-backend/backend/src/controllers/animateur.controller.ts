import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendSuccess, sendCreated } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

const include = {
  camp: { select: { id: true, nom: true } },
  _count: { select: { activites: true, groupes: true } },
}

// GET /api/animateurs?campId=xxx
export const getAnimateurs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, page = 1, perPage = 50 } = req.query
    const where: any = {}
    if (campId) where.campId = campId

    const [animateurs, total] = await Promise.all([
      prisma.animateur.findMany({
        where,
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage),
        orderBy: { nom: 'asc' },
        include,
      }),
      prisma.animateur.count({ where }),
    ])
    sendSuccess(res, animateurs, 'Animateurs récupérés', 200, {
      total, page: Number(page), perPage: Number(perPage),
      totalPages: Math.ceil(total / Number(perPage)),
    })
  } catch (e) { next(e) }
}

// GET /api/animateurs/:id
export const getAnimateurById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const animateur = await prisma.animateur.findUnique({
      where: { id: req.params.id },
      include: {
        ...include,
        groupes: { select: { id: true, nom: true, couleur: true } },
        activites: { orderBy: { dateHeureDebut: 'desc' }, take: 10, select: { id: true, titre: true, dateHeureDebut: true, statut: true } },
      },
    })
    if (!animateur) throw new AppError('Animateur introuvable', 404)
    sendSuccess(res, animateur)
  } catch (e) { next(e) }
}

// POST /api/animateurs
export const createAnimateur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, nom, prenom, specialite, telephone, missions, statut, dateArrivee, dateDepart } = req.body
    if (!campId || !nom?.trim() || !prenom?.trim()) {
      throw new AppError('Camp, nom et prénom sont requis', 400)
    }
    const camp = await prisma.camp.findUnique({ where: { id: campId } })
    if (!camp) throw new AppError('Camp introuvable', 404)

    const animateur = await prisma.animateur.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        campId,
        specialite: specialite || null,
        telephone: telephone || null,
        missions: missions || null,
        statut: statut || 'ACTIF',
        dateArrivee: dateArrivee ? new Date(dateArrivee) : undefined,
        dateDepart: dateDepart ? new Date(dateDepart) : undefined,
      },
      include,
    })
    sendCreated(res, animateur, 'Animateur créé')
  } catch (e) { next(e) }
}

// PUT /api/animateurs/:id
export const updateAnimateur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const animateur = await prisma.animateur.findUnique({ where: { id: req.params.id } })
    if (!animateur) throw new AppError('Animateur introuvable', 404)
    const { nom, prenom, specialite, telephone, missions, statut, dateArrivee, dateDepart } = req.body
    const updated = await prisma.animateur.update({
      where: { id: req.params.id },
      data: {
        nom: nom?.trim() ?? animateur.nom,
        prenom: prenom?.trim() ?? animateur.prenom,
        specialite: specialite !== undefined ? (specialite || null) : animateur.specialite,
        telephone: telephone !== undefined ? (telephone || null) : animateur.telephone,
        missions: missions !== undefined ? (missions || null) : animateur.missions,
        statut: statut ?? animateur.statut,
        dateArrivee: dateArrivee ? new Date(dateArrivee) : animateur.dateArrivee,
        dateDepart: dateDepart ? new Date(dateDepart) : animateur.dateDepart,
      },
      include,
    })
    sendSuccess(res, updated, 'Animateur mis à jour')
  } catch (e) { next(e) }
}

// DELETE /api/animateurs/:id
export const deleteAnimateur = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const animateur = await prisma.animateur.findUnique({ where: { id: req.params.id } })
    if (!animateur) throw new AppError('Animateur introuvable', 404)
    await prisma.animateur.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Animateur supprimé')
  } catch (e) { next(e) }
}
