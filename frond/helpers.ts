import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { StatutInscription, StatutPaiement, StatutCamp } from './index'

export const formatDate = (d: string) => format(parseISO(d), 'dd MMM yyyy', { locale: fr })
export const formatDateTime = (d: string) => format(parseISO(d), 'dd MMM yyyy · HH:mm', { locale: fr })
export const fromNow = (d: string) => formatDistanceToNow(parseISO(d), { addSuffix: true, locale: fr })
export const formatCFA = (n: number) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

export const statutInscriptionLabel: Record<StatutInscription, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  LISTE_ATTENTE: "Liste d'attente",
}

export const statutInscriptionBadge: Record<StatutInscription, string> = {
  EN_ATTENTE: 'badge-gold',
  CONFIRME: 'badge-green',
  ANNULE: 'badge-ember',
  LISTE_ATTENTE: 'badge-sky',
}

export const statutPaiementLabel: Record<StatutPaiement, string> = {
  EN_ATTENTE: 'En attente',
  PARTIEL: 'Partiel',
  PAYE: 'Payé',
  REMBOURSE: 'Remboursé',
  ANNULE: 'Annulé',
}

export const statutPaiementBadge: Record<StatutPaiement, string> = {
  EN_ATTENTE: 'badge-gold',
  PARTIEL: 'badge-sky',
  PAYE: 'badge-green',
  REMBOURSE: 'badge-muted',
  ANNULE: 'badge-ember',
}

export const statutCampLabel: Record<StatutCamp, string> = {
  BROUILLON: 'Brouillon',
  OUVERT: 'Ouvert',
  COMPLET: 'Complet',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
}

export const statutCampBadge: Record<StatutCamp, string> = {
  BROUILLON: 'badge-muted',
  OUVERT: 'badge-green',
  COMPLET: 'badge-gold',
  EN_COURS: 'badge-sky',
  TERMINE: 'badge-muted',
  ANNULE: 'badge-ember',
}

export const initials = (nom: string, prenom: string) =>
  `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()

export const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(' ')
