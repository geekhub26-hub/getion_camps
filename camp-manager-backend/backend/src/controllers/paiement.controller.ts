import { Response, NextFunction } from 'express'
import prisma from '../config/prisma'
import { sendCreated, sendSuccess } from '../utils/response'
import { AppError } from '../middlewares/error.middleware'
import { AuthRequest } from '../types'

export const getPaiements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campId, statut } = req.query
    const where: any = {}

    if (campId) {
      // Include both participant-linked and direct cash entries for this camp
      where.OR = [
        { participant: { campId: String(campId) } },
        { campId: String(campId), participantId: null },
      ]
    }
    if (statut) where.statut = statut

    const paiements = await prisma.paiement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        participant: { select: { id: true, nom: true, prenom: true, camp: { select: { id: true, nom: true } } } },
      },
    })

    sendSuccess(res, paiements, 'Paiements récupérés')
  } catch (err) {
    next(err)
  }
}

export const createPaiement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { participantId, campId, libelle, montant, montantTotal, statut, methode, reference, datePaiement, notes, recu } = req.body

    const montantNumber = Number(montant)
    if (!montantNumber || montantNumber <= 0) throw new AppError('Le montant doit être supérieur à 0', 400)

    // ── Direct cash entry (no participant) ──
    if (!participantId) {
      if (!campId) throw new AppError('campId requis pour une entrée directe', 400)
      if (!libelle) throw new AppError('Libellé requis pour une entrée directe', 400)
      const p = await prisma.paiement.create({
        data: {
          campId,
          libelle,
          montant: montantNumber,
          statut: statut || 'PAYE',
          methode: methode || 'ESPECES',
          reference,
          datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
          notes,
          recu: Boolean(recu),
        },
      })
      return sendCreated(res, p, 'Entrée directe enregistrée')
    }

    // ── Participant payment ──
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { camp: { select: { prixBase: true } } },
    })
    if (!participant) throw new AppError('Participant introuvable', 404)

    const montantTotalNumber = Number(montantTotal || participant.camp.prixBase)

    const dejaPaye = await prisma.paiement.aggregate({
      where: { participantId, statut: { notIn: ['ANNULE', 'REMBOURSE'] } },
      _sum: { montant: true },
    })
    const totalApresPaiement = Number(dejaPaye._sum.montant || 0) + montantNumber
    if (totalApresPaiement > montantTotalNumber) {
      throw new AppError(`Paiement refusé : le total payé (${totalApresPaiement}) dépasse le montant fixé (${montantTotalNumber})`, 400)
    }

    const paiement = await prisma.paiement.create({
      data: {
        participantId,
        montant: montantNumber,
        montantTotal: montantTotalNumber,
        statut: statut || (totalApresPaiement >= montantTotalNumber ? 'PAYE' : 'PARTIEL'),
        methode,
        reference,
        datePaiement: datePaiement ? new Date(datePaiement) : undefined,
        notes,
        recu: Boolean(recu),
      },
    })

    sendCreated(res, paiement, 'Paiement enregistré')
  } catch (err) {
    next(err)
  }
}

export const deletePaiement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paiement = await prisma.paiement.findUnique({ where: { id: req.params.id } })
    if (!paiement) throw new AppError('Paiement introuvable', 404)
    await prisma.paiement.delete({ where: { id: req.params.id } })
    sendSuccess(res, null, 'Paiement supprimé')
  } catch (err) {
    next(err)
  }
}

export const updatePaiement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paiement = await prisma.paiement.findUnique({ where: { id: req.params.id } })
    if (!paiement) throw new AppError('Paiement introuvable', 404)

    // Only block increases that would exceed the total; corrections (reductions) are always allowed
    if (paiement.participantId && req.body.montant) {
      const prochainMontant = Number(req.body.montant)
      const ancienMontant = Number(paiement.montant)
      if (prochainMontant > ancienMontant) {
        const prochainTotal = req.body.montantTotal ? Number(req.body.montantTotal) : Number(paiement.montantTotal)
        if (prochainTotal > 0) {
          const dejaPaye = await prisma.paiement.aggregate({
            where: { participantId: paiement.participantId!, id: { not: paiement.id }, statut: { notIn: ['ANNULE', 'REMBOURSE'] } },
            _sum: { montant: true },
          })
          const totalApresModification = Number(dejaPaye._sum.montant || 0) + prochainMontant
          if (totalApresModification > prochainTotal) {
            throw new AppError(`Modification refusée : le total payé (${totalApresModification}) dépasse le montant fixé (${prochainTotal})`, 400)
          }
        }
      }
    }

    // Recalculate statut when amount changes
    let statutAuto: string | undefined
    if (req.body.montant && paiement.participantId) {
      const nouveauMontant = Number(req.body.montant)
      const total = req.body.montantTotal ? Number(req.body.montantTotal) : Number(paiement.montantTotal)
      const dejaPaye = await prisma.paiement.aggregate({
        where: { participantId: paiement.participantId!, id: { not: paiement.id }, statut: { notIn: ['ANNULE', 'REMBOURSE'] } },
        _sum: { montant: true },
      })
      const totalPaye = Number(dejaPaye._sum.montant || 0) + nouveauMontant
      if (total > 0) statutAuto = totalPaye >= total ? 'PAYE' : 'PARTIEL'
    }

    const updated = await prisma.paiement.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        montant: req.body.montant ? Number(req.body.montant) : undefined,
        montantTotal: req.body.montantTotal ? Number(req.body.montantTotal) : undefined,
        datePaiement: req.body.datePaiement ? new Date(req.body.datePaiement) : undefined,
        ...(statutAuto && !req.body.statut ? { statut: statutAuto } : {}),
      },
    })

    sendSuccess(res, updated, 'Paiement mis à jour')
  } catch (err) {
    next(err)
  }
}
