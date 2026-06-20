import { useEffect, useMemo, useState } from 'react'
import {
  CreditCard, Pencil, Plus, Printer, Download, RefreshCw, Save, Trash2, TrendingUp,
  TrendingDown, Wallet, X, CheckCircle, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react'
import api from './http'
import type { Camp, Depense, Paiement, Participant } from './index'
import { formatCFA } from './helpers'

type ApiList<T> = { data: T[]; meta?: { total?: number } }

type PayItem = Paiement & { participant?: { id: string; nom: string; prenom: string } | null }
type DepItem = Depense & { camp?: { id: string; nom: string } }

const METHODES = [
  { value: 'MOBILE_MONEY',   label: 'Mobile Money' },
  { value: 'ESPECES',        label: 'Espèces' },
  { value: 'VIREMENT',       label: 'Virement' },
  { value: 'CARTE_BANCAIRE', label: 'Carte bancaire' },
  { value: 'CHEQUE',         label: 'Chèque' },
]

function getError(err: unknown) {
  return (err as any)?.response?.data?.message || 'Erreur inconnue'
}

function isToday(iso: string) {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function exportCSV(rows: object[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const content = [headers.join(','), ...rows.map(r =>
    headers.map(h => `"${String((r as any)[h] ?? '').replace(/"/g, '""')}"`).join(',')
  )].join('\n')
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  URL.revokeObjectURL(a.href)
}

function printRapport(campNom: string, periode: string, entrees: PayItem[], depenses: DepItem[]) {
  const totalE = entrees.reduce((s, p) => s + Number(p.montant), 0)
  const totalD = depenses.reduce((s, d) => s + Number(d.montant), 0)
  const win = window.open('', '_blank', 'width=780,height=900')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport ${periode}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:32px;color:#0f172a;font-size:13px}
    h1{font-size:22px;margin-bottom:2px}p.sub{color:#64748b;margin-bottom:24px}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
    .card{border:1px solid #e2e8f0;border-radius:12px;padding:14px}
    .card .label{font-size:11px;color:#94a3b8;margin-bottom:4px}
    .card .val{font-size:20px;font-weight:700}
    .green{color:#16a34a}.red{color:#dc2626}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#f8fafc;font-size:11px;text-transform:uppercase;color:#94a3b8;padding:8px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
    td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
    h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:16px 0 8px}
    footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    @media print{body{padding:16px}}
  </style></head><body>
  <h1>Rapport de caisse</h1>
  <p class="sub">${campNom} &mdash; ${periode}</p>
  <div class="summary">
    <div class="card"><div class="label">Total encaissé</div><div class="val green">${formatCFA(totalE)}</div></div>
    <div class="card"><div class="label">Total dépensé</div><div class="val red">${formatCFA(totalD)}</div></div>
    <div class="card"><div class="label">Solde net</div><div class="val ${totalE - totalD >= 0 ? 'green' : 'red'}">${formatCFA(totalE - totalD)}</div></div>
  </div>
  <h2>Encaissements (${entrees.length})</h2>
  <table><thead><tr><th>Date</th><th>Participant / Libellé</th><th>Mode</th><th style="text-align:right">Montant</th></tr></thead><tbody>
  ${entrees.map(p => `<tr>
    <td style="color:#64748b;white-space:nowrap">${p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : '—'}</td>
    <td>${p.participant ? `${p.participant.prenom} ${p.participant.nom}` : (p.libelle || 'Entrée directe')}</td>
    <td style="color:#64748b">${METHODES.find(m => m.value === p.methode)?.label ?? p.methode}${p.reference ? ' · ' + p.reference : ''}</td>
    <td class="green" style="text-align:right;font-weight:600">+${formatCFA(Number(p.montant))}</td>
  </tr>`).join('')}
  </tbody></table>
  <h2>Dépenses (${depenses.length})</h2>
  <table><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th style="text-align:right">Montant</th></tr></thead><tbody>
  ${depenses.map(d => `<tr>
    <td style="color:#64748b;white-space:nowrap">${new Date(d.dateDepense).toLocaleDateString('fr-FR')}</td>
    <td>${d.libelle}</td>
    <td style="color:#64748b">${d.categorie}</td>
    <td class="red" style="text-align:right;font-weight:600">-${formatCFA(Number(d.montant))}</td>
  </tr>`).join('')}
  </tbody></table>
  <footer>Généré le ${new Date().toLocaleString('fr-FR')} &mdash; Camp Manager</footer>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`)
  win.document.close()
}

export default function CaissePage() {
  const [camps, setCamps]       = useState<Camp[]>([])
  const [campId, setCampId]     = useState('')
  const [campPrice, setCampPrice] = useState(0)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [paiements, setPaiements]       = useState<PayItem[]>([])
  const [depenses, setDepenses]         = useState<DepItem[]>([])
  const [tab, setTab]           = useState<'today' | 'all'>('today')
  const [error, setError]       = useState('')
  const [paySuccess, setPaySuccess] = useState('')
  const [saving, setSaving]     = useState(false)

  const [payForm, setPayForm] = useState({
    participantId: '', montant: '', methode: 'MOBILE_MONEY', reference: '', notes: '',
  })
  const [depForm, setDepForm] = useState({
    libelle: '', categorie: 'Logistique', montant: '', reference: '',
  })
  const [directForm, setDirectForm] = useState({
    libelle: '', montant: '', methode: 'ESPECES', reference: '',
  })
  const [editPayId, setEditPayId]     = useState<string | null>(null)
  const [editPayMontant, setEditPayMontant] = useState('')
  const todayISO = new Date().toISOString().slice(0, 10)
  const [showRapportModal, setShowRapportModal] = useState(false)
  const [rapportDebut, setRapportDebut] = useState(todayISO)
  const [rapportFin, setRapportFin]   = useState(todayISO)

  useEffect(() => {
    api.get<ApiList<Camp>>('/camps?perPage=100')
      .then(({ data }) => { setCamps(data.data || []); if (data.data[0]) setCampId(data.data[0].id) })
  }, [])

  useEffect(() => {
    if (!campId) return
    const camp = camps.find(c => c.id === campId)
    if (camp) setCampPrice(camp.prixBase)
    api.get<ApiList<Participant>>(`/camps/${campId}/participants?perPage=200`)
      .then(({ data }) => { setParticipants(data.data || []); setPayForm(f => ({ ...f, participantId: data.data[0]?.id || '' })) })
  }, [campId, camps])

  const load = () => {
    void api.get<ApiList<PayItem>>(`/paiements?campId=${campId}`).then(({ data }) => setPaiements(data.data || [])).catch(() => setPaiements([]))
    void api.get<ApiList<DepItem>>(`/depenses?campId=${campId}`).then(({ data }) => setDepenses(data.data || [])).catch(() => setDepenses([]))
  }
  useEffect(() => { if (campId) load() }, [campId])

  const totalEntrees = useMemo(() => paiements.filter(p => !['ANNULE','REMBOURSE'].includes(p.statut)).reduce((s, p) => s + Number(p.montant), 0), [paiements])
  const totalSorties = useMemo(() => depenses.reduce((s, d) => s + Number(d.montant), 0), [depenses])
  const solde = totalEntrees - totalSorties

  const entreesAujourd = useMemo(() => paiements.filter(p => isToday(p.datePaiement ?? '')), [paiements])
  const depensesAujourd = useMemo(() => depenses.filter(d => isToday(d.dateDepense)), [depenses])

  const submitPay = async () => {
    if (!payForm.participantId || !payForm.montant) { setError('Sélectionnez un participant et entrez un montant.'); return }
    setError(''); setSaving(true)
    try {
      const montant = Number(payForm.montant)
      const alreadyPaid = paiements
        .filter(p => p.participantId === payForm.participantId && !['ANNULE','REMBOURSE'].includes(p.statut))
        .reduce((s, p) => s + Number(p.montant), 0)
      const statut = (alreadyPaid + montant) >= campPrice ? 'PAYE' : 'PARTIEL'
      await api.post('/paiements', {
        participantId: payForm.participantId,
        montant,
        montantTotal: campPrice,
        methode: payForm.methode,
        reference: payForm.reference || undefined,
        notes: payForm.notes || undefined,
        statut,
        datePaiement: new Date().toISOString(),
      })
      const p = participants.find(x => x.id === payForm.participantId)
      setPaySuccess(`Paiement de ${formatCFA(montant)} enregistré pour ${p?.prenom} ${p?.nom}`)
      setTimeout(() => setPaySuccess(''), 4000)
      setPayForm(f => ({ ...f, montant: '', reference: '', notes: '' }))
      load()
    } catch (err) { setError(getError(err)) }
    finally { setSaving(false) }
  }

  const submitDirect = async () => {
    if (!directForm.libelle || !directForm.montant) { setError('Remplissez le libellé et le montant.'); return }
    setError(''); setSaving(true)
    try {
      await api.post('/paiements', {
        campId, libelle: directForm.libelle, montant: Number(directForm.montant),
        methode: directForm.methode, reference: directForm.reference || undefined,
        statut: 'PAYE', datePaiement: new Date().toISOString(),
      })
      setDirectForm({ libelle: '', montant: '', methode: 'ESPECES', reference: '' })
      load()
    } catch (err) { setError(getError(err)) }
    finally { setSaving(false) }
  }

  const submitDep = async () => {
    if (!depForm.libelle || !depForm.montant) { setError('Remplissez le libellé et le montant.'); return }
    setError(''); setSaving(true)
    try {
      await api.post('/depenses', { ...depForm, montant: Number(depForm.montant), campId, dateDepense: new Date().toISOString() })
      setDepForm({ libelle: '', categorie: 'Logistique', montant: '', reference: '' })
      load()
    } catch (err) { setError(getError(err)) }
    finally { setSaving(false) }
  }

  const handleExportCSV = () => {
    const today = new Date().toLocaleDateString('fr-FR')
    const rows = [
      ...paiements.map(p => ({
        date: new Date(p.datePaiement || '').toLocaleString('fr-FR'),
        participant: p.participant ? `${p.participant.prenom} ${p.participant.nom}` : (p.libelle || 'Entrée directe'),
        type: 'Entrée',
        montant: Number(p.montant),
        methode: METHODES.find(m => m.value === p.methode)?.label || p.methode,
        statut: p.statut,
        reference: p.reference || '',
      })),
      ...depenses.map(d => ({
        date: new Date(d.dateDepense).toLocaleString('fr-FR'),
        participant: '',
        type: 'Dépense',
        montant: -Number(d.montant),
        methode: d.categorie,
        statut: '',
        reference: d.reference || '',
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    exportCSV(rows, `caisse-${campId}-${today}.csv`)
  }

  const genererRapport = () => {
    const debut = new Date(rapportDebut)
    const fin   = new Date(rapportFin)
    fin.setHours(23, 59, 59, 999)
    const inRange = (ts: string) => { const d = new Date(ts); return d >= debut && d <= fin }
    const entreesFiltrees = paiements.filter(p => inRange(p.datePaiement ?? ''))
    const depensesFiltrees = depenses.filter(d => inRange(d.dateDepense))
    const campNom = camps.find(c => c.id === campId)?.nom || ''
    const fmt = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const periode = rapportDebut === rapportFin
      ? fmt(rapportDebut)
      : `du ${fmt(rapportDebut)} au ${fmt(rapportFin)}`
    setShowRapportModal(false)
    printRapport(campNom, periode, entreesFiltrees, depensesFiltrees)
  }

  const displayList = tab === 'today'
    ? [...entreesAujourd.map(p => ({ id: p.id, participantId: p.participantId, label: p.participant ? `${p.participant.prenom} ${p.participant.nom}` : (p.libelle || 'Entrée directe'), detail: METHODES.find(m => m.value === p.methode)?.label || p.methode, montant: Number(p.montant), sign: '+' as const, statut: p.statut, ts: p.datePaiement || '' })),
       ...depensesAujourd.map(d => ({ id: d.id, participantId: undefined as string | undefined, label: d.libelle, detail: d.categorie, montant: Number(d.montant), sign: '-' as const, statut: '', ts: d.dateDepense }))]
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    : [...paiements.map(p => ({ id: p.id, participantId: p.participantId, label: p.participant ? `${p.participant.prenom} ${p.participant.nom}` : (p.libelle || 'Entrée directe'), detail: METHODES.find(m => m.value === p.methode)?.label || p.methode, montant: Number(p.montant), sign: '+' as const, statut: p.statut, ts: p.datePaiement ?? '' })),
       ...depenses.map(d => ({ id: d.id, participantId: undefined as string | undefined, label: d.libelle, detail: d.categorie, montant: Number(d.montant), sign: '-' as const, statut: '', ts: d.dateDepense }))]
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  const alreadyPaidForSelected = useMemo(() => {
    if (!payForm.participantId) return 0
    return paiements
      .filter(p => p.participantId === payForm.participantId && !['ANNULE','REMBOURSE'].includes(p.statut))
      .reduce((s, p) => s + Number(p.montant), 0)
  }, [paiements, payForm.participantId])

  const restant = Math.max(0, campPrice - alreadyPaidForSelected)

  // Participants qui ont encore un solde > 0 et non dispensés
  const unpaidParticipants = useMemo(() =>
    participants.filter(p => {
      if (p.dispense) return false
      const paid = paiements
        .filter(pay => pay.participantId === p.id && !['ANNULE','REMBOURSE'].includes(pay.statut))
        .reduce((s, pay) => s + Number(pay.montant), 0)
      return paid < campPrice
    }), [participants, paiements, campPrice])

  const marquerSolde = async () => {
    if (!payForm.participantId) return
    const pid = payForm.participantId
    const p = participants.find(x => x.id === pid)
    setError(''); setSaving(true)
    try {
      await api.put(`/participants/${pid}`, { dispense: true })
      // Mettre à jour l'état local immédiatement sans recharger
      setParticipants(ps => ps.map(x => x.id === pid ? { ...x, dispense: true } : x))
      setPayForm(f => ({ ...f, participantId: '', montant: '' }))
      setPaySuccess(`${p?.prenom} ${p?.nom} marqué(e) comme soldé(e).`)
      setTimeout(() => setPaySuccess(''), 5000)
    } catch (err) { setError(getError(err)) }
    finally { setSaving(false) }
  }

  const deletePay = async (id: string) => {
    if (!confirm('Supprimer ce paiement ?')) return
    try {
      await api.delete(`/paiements/${id}`)
      load()
    } catch (err) { setError(getError(err)) }
  }

  const saveEditPay = async (id: string, participantId: string | undefined) => {
    const montant = Number(editPayMontant)
    if (!montant || montant <= 0) { setEditPayId(null); return }
    setError('')
    try {
      await api.put(`/paiements/${id}`, {
        montant,
        ...(participantId ? { montantTotal: campPrice } : {}),
      })
      setEditPayId(null)
      load()
    } catch (err) { setError(getError(err)) }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Caisse</h1>
          <p className="text-sm text-ink-3">Encaissements et dépenses du camp</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input-field w-auto" value={campId} onChange={e => setCampId(e.target.value)}>
            {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <button onClick={load} className="btn-ghost p-2.5"><RefreshCw size={15} /></button>
          <button onClick={handleExportCSV} className="btn-ghost flex items-center gap-2 px-3">
            <Download size={15} /> CSV
          </button>
          <button onClick={() => setShowRapportModal(true)} className="btn-ghost flex items-center gap-2 px-3">
            <Printer size={15} /> Rapport
          </button>
        </div>
      </div>

      {/* Modale sélection de période */}
      {showRapportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={() => setShowRapportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 space-y-5 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-base text-ink">Rapport de caisse</h2>
              <button onClick={() => setShowRapportModal(false)} className="text-ink-3 hover:text-ink p-1.5 rounded-lg hover:bg-surface">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Date de début</label>
                <input type="date" className="input-field" value={rapportDebut}
                  onChange={e => setRapportDebut(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Date de fin</label>
                <input type="date" className="input-field" value={rapportFin} min={rapportDebut}
                  onChange={e => setRapportFin(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowRapportModal(false)} className="flex-1 btn-ghost py-2.5">Annuler</button>
              <button onClick={genererRapport} className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5">
                <Printer size={15} /> Générer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card col-span-2 lg:col-span-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sage/10 flex items-center justify-center shrink-0">
            <Wallet size={22} className="text-sage" />
          </div>
          <div>
            <p className="text-xs text-ink-3 font-medium">Solde global</p>
            <p className={`font-display font-700 text-2xl ${solde >= 0 ? 'text-sage' : 'text-ember'}`}>{formatCFA(solde)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center shrink-0">
            <ArrowDownLeft size={18} className="text-sky" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Entrées totales</p>
            <p className="font-display font-700 text-lg text-ink">{formatCFA(totalEntrees)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember/10 flex items-center justify-center shrink-0">
            <ArrowUpRight size={18} className="text-ember" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Sorties totales</p>
            <p className="font-display font-700 text-lg text-ink">{formatCFA(totalSorties)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-gold" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Aujourd'hui</p>
            <p className="font-display font-700 text-lg text-gold">{formatCFA(entreesAujourd.reduce((s, p) => s + Number(p.montant), 0))}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-ember/20 bg-ember/8 px-4 py-3 text-sm text-ember flex items-center gap-2">
          <X size={14} /> {error}
          <button className="ml-auto" onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}
      {paySuccess && (
        <div className="rounded-xl border border-sage/20 bg-sage/8 px-4 py-3 text-sm text-sage flex items-center gap-2">
          <CheckCircle size={14} /> {paySuccess}
        </div>
      )}

      {/* Main layout */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Forms — left col */}
        <div className="lg:col-span-2 space-y-4">
          {/* Encaissement */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sage/10 flex items-center justify-center">
                <ArrowDownLeft size={14} className="text-sage" />
              </div>
              <h2 className="font-display font-700 text-sm text-ink">Encaissement</h2>
            </div>

            {/* Prix camp */}
            <div className="rounded-xl bg-sage/5 border border-sage/20 px-4 py-3">
              <p className="text-xs text-sage font-medium">Prix du camp (fixé)</p>
              <p className="font-display font-700 text-xl text-sage">{formatCFA(campPrice)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-3 mb-1 block">Participant *</label>
              <select className="input-field" value={payForm.participantId} onChange={e => setPayForm(f => ({ ...f, participantId: e.target.value }))}>
                <option value="">— Choisir —</option>
                {unpaidParticipants.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
              {payForm.participantId && (
                <div className="mt-2 text-xs text-ink-3 flex justify-between">
                  <span>Déjà payé : <span className="font-semibold text-sage">{formatCFA(alreadyPaidForSelected)}</span></span>
                  <span>Reste : <span className={`font-semibold ${restant > 0 ? 'text-ember' : 'text-sage'}`}>{formatCFA(restant)}</span></span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-ink-3 mb-1 block">Montant encaissé (FCFA) *</label>
              <input
                type="number" min={0} max={restant || undefined}
                className="input-field font-display font-700 text-lg"
                placeholder={`Max : ${formatCFA(restant)}`}
                value={payForm.montant}
                onChange={e => setPayForm(f => ({ ...f, montant: e.target.value }))}
              />
              {/* Quick amounts */}
              {restant > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[25000, 50000, restant].filter((v, i, a) => a.indexOf(v) === i && v > 0 && v <= restant).map(v => (
                    <button key={v} type="button" onClick={() => setPayForm(f => ({ ...f, montant: String(v) }))}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface border border-border text-ink-2 hover:border-sage hover:text-sage transition-colors">
                      {formatCFA(v)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-ink-3 mb-1 block">Mode de paiement</label>
              <select className="input-field" value={payForm.methode} onChange={e => setPayForm(f => ({ ...f, methode: e.target.value }))}>
                {METHODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <input className="input-field" placeholder="Référence / N° reçu (optionnel)" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />

            <button onClick={submitPay} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CreditCard size={16} />}
              Encaisser
            </button>
            {payForm.participantId && restant > 0 && (
              <button onClick={marquerSolde} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gold/30 text-gold bg-gold/5 hover:bg-gold/10 text-sm font-medium transition-colors disabled:opacity-50">
                <CheckCircle size={15} /> Marquer comme soldé (dispenser le solde)
              </button>
            )}
            {paySuccess && (
              <div className="rounded-xl border border-sage/20 bg-sage/8 px-4 py-3 text-sm text-sage flex items-center gap-2">
                <CheckCircle size={14} /> {paySuccess}
              </div>
            )}
          </div>

          {/* Entrée directe */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky/10 flex items-center justify-center">
                <Wallet size={14} className="text-sky" />
              </div>
              <div>
                <h2 className="font-display font-700 text-sm text-ink">Entrée directe</h2>
                <p className="text-xs text-ink-3">Sans participant inscrit</p>
              </div>
            </div>
            <input className="input-field" placeholder="Libellé (ex: Don, Subvention…) *" value={directForm.libelle} onChange={e => setDirectForm(f => ({ ...f, libelle: e.target.value }))} />
            <input type="number" min={0} className="input-field" placeholder="Montant (FCFA) *" value={directForm.montant} onChange={e => setDirectForm(f => ({ ...f, montant: e.target.value }))} />
            <select className="input-field" value={directForm.methode} onChange={e => setDirectForm(f => ({ ...f, methode: e.target.value }))}>
              {METHODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input className="input-field" placeholder="Référence (optionnel)" value={directForm.reference} onChange={e => setDirectForm(f => ({ ...f, reference: e.target.value }))} />
            <button onClick={submitDirect} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-sky/30 text-sky bg-sky/5 hover:bg-sky/10 text-sm font-medium transition-colors disabled:opacity-50">
              <Plus size={15} /> Enregistrer entrée
            </button>
          </div>

          {/* Dépense */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-ember/10 flex items-center justify-center">
                <ArrowUpRight size={14} className="text-ember" />
              </div>
              <h2 className="font-display font-700 text-sm text-ink">Dépense</h2>
            </div>
            <input className="input-field" placeholder="Libellé *" value={depForm.libelle} onChange={e => setDepForm(f => ({ ...f, libelle: e.target.value }))} />
            <select className="input-field" value={depForm.categorie} onChange={e => setDepForm(f => ({ ...f, categorie: e.target.value }))}>
              {['Logistique','Alimentation','Activités','Transport','Matériel','Santé','Autre'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" min={0} className="input-field" placeholder="Montant (FCFA) *" value={depForm.montant} onChange={e => setDepForm(f => ({ ...f, montant: e.target.value }))} />
            <input className="input-field" placeholder="Référence (optionnel)" value={depForm.reference} onChange={e => setDepForm(f => ({ ...f, reference: e.target.value }))} />
            <button onClick={submitDep} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-ember/30 text-ember bg-ember/5 hover:bg-ember/10 text-sm font-medium transition-colors disabled:opacity-50">
              <Plus size={15} /> Enregistrer dépense
            </button>
          </div>
        </div>

        {/* Transactions — right col */}
        <div className="lg:col-span-3 card p-0 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between">
            <div className="flex gap-1">
              {(['today', 'all'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${tab === t ? 'bg-sage text-white' : 'text-ink-2 hover:bg-border'}`}>
                  {t === 'today' ? "Aujourd'hui" : 'Tout voir'}
                </button>
              ))}
            </div>
            <span className="text-xs text-ink-3">{displayList.length} opération{displayList.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {displayList.length === 0 ? (
              <div className="text-center py-16">
                <TrendingDown size={32} className="mx-auto mb-3 text-ink-3 opacity-30" />
                <p className="text-ink-2 font-medium text-sm">Aucune opération</p>
                <p className="text-ink-3 text-xs mt-1">{tab === 'today' ? "Aucune transaction aujourd'hui." : 'Aucune transaction pour ce camp.'}</p>
              </div>
            ) : displayList.map(op => (
              <div key={op.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-surface/60 transition-colors ${isToday(op.ts) && tab === 'all' ? 'bg-sage/3' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${op.sign === '+' ? 'bg-sage/10' : 'bg-ember/10'}`}>
                  {op.sign === '+' ? <ArrowDownLeft size={16} className="text-sage" /> : <ArrowUpRight size={16} className="text-ember" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{op.label}</p>
                  <p className="text-xs text-ink-3 truncate">{op.detail}{op.ts ? ` · ${new Date(op.ts).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}` : ''}</p>
                </div>
                {editPayId === op.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={1}
                      value={editPayMontant}
                      onChange={e => setEditPayMontant(e.target.value)}
                      className="w-28 border border-border rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => saveEditPay(op.id, op.participantId)}
                      disabled={saving}
                      className="p-1.5 rounded-lg bg-sage/15 text-sage hover:bg-sage/25 transition-colors"
                      title="Enregistrer"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => setEditPayId(null)}
                      className="p-1.5 rounded-lg bg-surface-2 text-ink-3 hover:bg-border transition-colors"
                      title="Annuler"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`font-display font-700 text-sm ${op.sign === '+' ? 'text-sage' : 'text-ember'}`}>
                        {op.sign}{formatCFA(op.montant)}
                      </p>
                      {op.statut && (
                        <span className={`text-xs font-semibold ${op.statut === 'PAYE' ? 'text-sage' : op.statut === 'PARTIEL' ? 'text-gold' : 'text-ink-3'}`}>
                          {op.statut === 'PAYE' ? 'Soldé' : op.statut === 'PARTIEL' ? 'Partiel' : op.statut}
                        </span>
                      )}
                    </div>
                    {op.sign === '+' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditPayId(op.id); setEditPayMontant(String(op.montant)) }}
                          className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Modifier le montant"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deletePay(op.id)}
                          className="p-1.5 rounded-lg text-ink-3 hover:text-ember hover:bg-ember/10 transition-colors"
                          title="Supprimer ce paiement"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer total du jour */}
          <div className="border-t border-border bg-surface px-5 py-3 flex items-center justify-between text-sm">
            <span className="text-ink-3 font-medium">Bilan du jour</span>
            <div className="flex gap-4">
              <span className="text-sage font-semibold">+{formatCFA(entreesAujourd.reduce((s, p) => s + Number(p.montant), 0))}</span>
              <span className="text-ember font-semibold">-{formatCFA(depensesAujourd.reduce((s, d) => s + Number(d.montant), 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
