import { useEffect, useState } from 'react'
import {
  FileText, Printer, Download, RefreshCw, CreditCard,
  ArrowUpRight, ClipboardList, UserCheck, Gift, Calendar,
} from 'lucide-react'
import api from './http'
import type { Don, FichePresence, Visiteur } from './index'
import { formatCFA } from './helpers'

type ApiList<T> = { data: T[] }

type PayItem = {
  id: string; participantId: string; montant: number; montantTotal: number
  statut: string; methode: string; reference?: string; datePaiement?: string
  participant: { nom: string; prenom: string; camp?: { nom: string } }
}
type DepItem = {
  id: string; libelle: string; categorie: string; montant: number
  dateDepense: string; reference?: string; camp?: { nom: string }
}
type ActiviteItem = {
  id: string; titre: string; lieu?: string; dateHeureDebut: string; dateHeureFin: string
  statut: string; camp?: { nom: string }
}

function inRange(isoStr: string | undefined, debut: string, fin: string): boolean {
  if (!isoStr) return false
  const d = new Date(isoStr)
  const start = new Date(debut)
  const end   = new Date(fin); end.setHours(23, 59, 59, 999)
  return d >= start && d <= end
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function Section({ title, icon: Icon, color, count, children }: {
  title: string; icon: any; color: string; count: number; children: React.ReactNode
}) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className={`px-5 py-3 border-b border-border flex items-center gap-3 bg-surface`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${color}/10`}>
          <Icon size={14} className={`text-${color}`} />
        </div>
        <h2 className="font-display font-700 text-sm text-ink flex-1">{title}</h2>
        <span className="badge-muted">{count}</span>
      </div>
      {children}
    </div>
  )
}

const METHODES: Record<string, string> = {
  MOBILE_MONEY: 'Mobile Money', ESPECES: 'Espèces', VIREMENT: 'Virement',
  CARTE_BANCAIRE: 'Carte', CHEQUE: 'Chèque',
}

export default function RapportPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [dateDebut, setDateDebut] = useState(today)
  const [dateFin,   setDateFin]   = useState(today)
  const [loading, setLoading] = useState(false)

  const [paiements, setPaiements] = useState<PayItem[]>([])
  const [depenses, setDepenses]   = useState<DepItem[]>([])
  const [fiches, setFiches]       = useState<FichePresence[]>([])
  const [visiteurs, setVisiteurs] = useState<Visiteur[]>([])
  const [dons, setDons]           = useState<Don[]>([])
  const [activites, setActivites] = useState<ActiviteItem[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, dRes, fRes, vRes, donRes, actRes] = await Promise.all([
        api.get<ApiList<PayItem>>('/paiements?perPage=1000'),
        api.get<ApiList<DepItem>>('/depenses?perPage=1000'),
        api.get<ApiList<FichePresence>>('/fiches-presence?perPage=1000'),
        api.get<ApiList<Visiteur>>('/visiteurs?perPage=1000'),
        api.get<ApiList<Don>>('/dons?perPage=1000'),
        api.get<ApiList<ActiviteItem>>('/activites?perPage=1000'),
      ])
      setPaiements((pRes.data.data || []).filter(p => inRange(p.datePaiement, dateDebut, dateFin)))
      setDepenses((dRes.data.data || []).filter(d => inRange(d.dateDepense, dateDebut, dateFin)))
      setFiches((fRes.data.data || []).filter(f => inRange(f.heureSortie, dateDebut, dateFin)))
      setVisiteurs((vRes.data.data || []).filter(v => inRange(v.createdAt, dateDebut, dateFin)))
      setDons((donRes.data.data || []).filter(d => inRange(d.createdAt, dateDebut, dateFin)))
      setActivites((actRes.data.data || []).filter(a => inRange(a.dateHeureDebut, dateDebut, dateFin)))
    } catch { /* silence */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [dateDebut, dateFin])

  const totalEncaisse = paiements.filter(p => !['ANNULE','REMBOURSE'].includes(p.statut)).reduce((s, p) => s + Number(p.montant), 0)
  const totalDepenses = depenses.reduce((s, d) => s + Number(d.montant), 0)
  const totalDons     = dons.filter(d => d.montant && Number(d.montant) > 0).reduce((s, d) => s + Number(d.montant), 0)
  const soldeDuJour   = totalEncaisse - totalDepenses

  const periodeLabel = () => {
    const fmt = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    return dateDebut === dateFin ? fmt(dateDebut) : `du ${fmt(dateDebut)} au ${fmt(dateFin)}`
  }

  const printRapport = () => {
    const periode = periodeLabel()
    const tableRows = (cols: string[], items: string[][]) =>
      `<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${items.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`

    const win = window.open('', '_blank', 'width=860,height=1000')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport ${periode}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;padding:32px;color:#0f172a;font-size:12.5px}
      h1{font-size:22px;font-weight:700;margin-bottom:2px}
      p.sub{color:#64748b;font-size:13px;margin-bottom:24px}
      .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
      .kpi{border:1px solid #e2e8f0;border-radius:10px;padding:12px}
      .kpi .label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
      .kpi .val{font-size:18px;font-weight:700}
      .green{color:#16a34a}.red{color:#dc2626}.gold{color:#d97706}.blue{color:#2563eb}
      h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:20px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px}
      th{background:#f8fafc;font-size:10px;text-transform:uppercase;color:#94a3b8;padding:7px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
      .empty{padding:12px 10px;color:#94a3b8;font-style:italic;font-size:12px}
      footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
    </style></head><body>
    <h1>Rapport de caisse</h1>
    <p class="sub">${periode}</p>
    <div class="kpis">
      <div class="kpi"><div class="label">Encaissements</div><div class="val green">${formatCFA(totalEncaisse)}</div></div>
      <div class="kpi"><div class="label">Dépenses</div><div class="val red">${formatCFA(totalDepenses)}</div></div>
      <div class="kpi"><div class="label">Solde net</div><div class="val ${soldeDuJour >= 0 ? 'green' : 'red'}">${formatCFA(soldeDuJour)}</div></div>
      <div class="kpi"><div class="label">Dons reçus</div><div class="val gold">${totalDons > 0 ? formatCFA(totalDons) : dons.length + ' don(s)'}</div></div>
    </div>

    <h2>Encaissements (${paiements.length})</h2>
    ${paiements.length ? tableRows(['Participant','Camp','Montant','Mode','Référence'], paiements.map(p => [
      `${p.participant.prenom} ${p.participant.nom}`,
      p.participant.camp?.nom || '—',
      `<span class="green" style="font-weight:600">+${formatCFA(Number(p.montant))}</span>`,
      METHODES[p.methode] || p.methode,
      p.reference || '—'
    ])) : '<p class="empty">Aucun encaissement ce jour.</p>'}

    <h2>Dépenses (${depenses.length})</h2>
    ${depenses.length ? tableRows(['Libellé','Camp','Catégorie','Montant','Référence'], depenses.map(d => [
      d.libelle,
      d.camp?.nom || '—',
      d.categorie,
      `<span class="red" style="font-weight:600">-${formatCFA(Number(d.montant))}</span>`,
      d.reference || '—'
    ])) : '<p class="empty">Aucune dépense ce jour.</p>'}

    <h2>Sorties / Présence (${fiches.length})</h2>
    ${fiches.length ? tableRows(['Nom','Type','H. Sortie','Motif','H. Retour','Statut'], fiches.map(f => [
      `${f.prenom} ${f.nom}`,
      f.type === 'ANIMATEUR' ? 'Encadrant' : 'Enfant',
      fmt(f.heureSortie),
      f.motif,
      f.heureRetour ? fmt(f.heureRetour) : '—',
      f.heureRetour ? '<span class="green">Retour</span>' : '<span class="red">Absent</span>'
    ])) : '<p class="empty">Aucune sortie enregistrée ce jour.</p>'}

    <h2>Visiteurs (${visiteurs.length})</h2>
    ${visiteurs.length ? tableRows(['Nom','Téléphone','Qualité/Fonction'], visiteurs.map(v => [
      `${v.prenom} ${v.nom}`, v.telephone, v.qualite
    ])) : '<p class="empty">Aucun visiteur ce jour.</p>'}

    <h2>Dons reçus (${dons.length})</h2>
    ${dons.length ? tableRows(['Donateur','Téléphone','Description','Montant'], dons.map(d => [
      `${d.prenom} ${d.nom}`,
      d.telephone,
      d.description,
      d.montant && Number(d.montant) > 0 ? `<span class="gold" style="font-weight:600">${formatCFA(Number(d.montant))}</span>` : 'En nature'
    ])) : '<p class="empty">Aucun don ce jour.</p>'}

    <h2>Activités planifiées ce jour (${activites.length})</h2>
    ${activites.length ? tableRows(['Titre','Horaires','Statut'], activites.map(a => [
      a.titre,
      `${fmt(a.dateHeureDebut)} — ${fmt(a.dateHeureFin)}`,
      a.statut
    ])) : '<p class="empty">Aucune activité planifiée ce jour.</p>'}

    <footer>Généré le ${new Date().toLocaleString('fr-FR')} &mdash; Camp Manager</footer>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`)
    win.document.close()
  }

  const exportCSV = () => {
    const rows: object[] = [
      ...paiements.map(p => ({ module: 'Encaissement', date: p.datePaiement || '', label: `${p.participant.prenom} ${p.participant.nom}`, detail: METHODES[p.methode] || p.methode, montant: `+${p.montant}`, note: p.reference || '' })),
      ...depenses.map(d => ({ module: 'Dépense', date: d.dateDepense, label: d.libelle, detail: d.categorie, montant: `-${d.montant}`, note: d.reference || '' })),
      ...fiches.map(f => ({ module: 'Sortie/Présence', date: f.heureSortie, label: `${f.prenom} ${f.nom}`, detail: f.type, montant: '', note: f.motif })),
      ...visiteurs.map(v => ({ module: 'Visiteur', date: v.createdAt, label: `${v.prenom} ${v.nom}`, detail: v.qualite, montant: '', note: v.telephone })),
      ...dons.map(d => ({ module: 'Don', date: d.createdAt, label: `${d.prenom} ${d.nom}`, detail: d.description, montant: d.montant ? `+${d.montant}` : 'nature', note: d.telephone })),
    ]
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const content = [headers.join(','), ...rows.map(r => headers.map(h => `"${String((r as any)[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `rapport-${dateDebut}-${dateFin}.csv`; a.click()
  }

  const isEmpty = !paiements.length && !depenses.length && !fiches.length && !visiteurs.length && !dons.length && !activites.length

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Rapport</h1>
          <p className="text-sm text-ink-3">Synthèse des activités sur une période</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-ink-3 shrink-0">Du</label>
            <input type="date" className="input-field w-auto" value={dateDebut} max={today}
              onChange={e => { setDateDebut(e.target.value); if (e.target.value > dateFin) setDateFin(e.target.value) }} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-ink-3 shrink-0">au</label>
            <input type="date" className="input-field w-auto" value={dateFin} min={dateDebut} max={today}
              onChange={e => setDateFin(e.target.value)} />
          </div>
          <button onClick={load} disabled={loading} className="btn-ghost p-2.5"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={exportCSV} disabled={isEmpty} className="btn-ghost flex items-center gap-2 px-3 disabled:opacity-40"><Download size={15} /> CSV</button>
          <button onClick={printRapport} disabled={isEmpty} className="btn-primary flex items-center gap-2 disabled:opacity-40"><Printer size={15} /> Imprimer / PDF</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-sage" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Encaissé</p>
            <p className="font-display font-700 text-lg text-sage">{formatCFA(totalEncaisse)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember/10 flex items-center justify-center shrink-0">
            <ArrowUpRight size={18} className="text-ember" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Dépensé</p>
            <p className="font-display font-700 text-lg text-ember">{formatCFA(totalDepenses)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${soldeDuJour >= 0 ? 'bg-sky/10' : 'bg-ember/10'}`}>
            <FileText size={18} className={soldeDuJour >= 0 ? 'text-sky' : 'text-ember'} />
          </div>
          <div>
            <p className="text-xs text-ink-3">Solde net</p>
            <p className={`font-display font-700 text-lg ${soldeDuJour >= 0 ? 'text-sky' : 'text-ember'}`}>{formatCFA(soldeDuJour)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-gold" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Dons</p>
            <p className="font-display font-700 text-lg text-gold">{dons.length > 0 ? (totalDons > 0 ? formatCFA(totalDons) : `${dons.length} don(s)`) : '—'}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card flex items-center justify-center py-12 text-ink-3 gap-3">
          <RefreshCw size={18} className="animate-spin" /> Chargement du rapport…
        </div>
      )}

      {!loading && isEmpty && (
        <div className="card text-center py-16">
          <FileText size={36} className="mx-auto mb-3 text-ink-3 opacity-30" />
          <p className="text-ink-2 font-medium">Aucune activité enregistrée</p>
          <p className="text-ink-3 text-sm mt-1">{periodeLabel()}</p>
        </div>
      )}

      {!loading && !isEmpty && (
        <div className="space-y-4">
          {/* Encaissements */}
          <Section title="Encaissements" icon={CreditCard} color="sage" count={paiements.length}>
            {paiements.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-3 italic">Aucun encaissement ce jour.</p>
            ) : (
              <div className="divide-y divide-border">
                {paiements.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink">{p.participant.prenom} {p.participant.nom}</p>
                      <p className="text-xs text-ink-3">{METHODES[p.methode] || p.methode}{p.reference ? ` · ${p.reference}` : ''}{p.participant.camp ? ` · ${p.participant.camp.nom}` : ''}</p>
                    </div>
                    <span className="font-display font-700 text-sm text-sage">+{formatCFA(Number(p.montant))}</span>
                  </div>
                ))}
                <div className="px-5 py-2.5 bg-sage/5 border-t border-sage/20 flex justify-between text-sm font-semibold">
                  <span className="text-sage">Total encaissé</span>
                  <span className="text-sage">{formatCFA(totalEncaisse)}</span>
                </div>
              </div>
            )}
          </Section>

          {/* Dépenses */}
          <Section title="Dépenses" icon={ArrowUpRight} color="ember" count={depenses.length}>
            {depenses.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-3 italic">Aucune dépense ce jour.</p>
            ) : (
              <div className="divide-y divide-border">
                {depenses.map(d => (
                  <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink">{d.libelle}</p>
                      <p className="text-xs text-ink-3">{d.categorie}{d.camp ? ` · ${d.camp.nom}` : ''}</p>
                    </div>
                    <span className="font-display font-700 text-sm text-ember">-{formatCFA(Number(d.montant))}</span>
                  </div>
                ))}
                <div className="px-5 py-2.5 bg-ember/5 border-t border-ember/20 flex justify-between text-sm font-semibold">
                  <span className="text-ember">Total dépensé</span>
                  <span className="text-ember">-{formatCFA(totalDepenses)}</span>
                </div>
              </div>
            )}
          </Section>

          {/* Sorties / Présence */}
          <Section title="Sorties / Présence" icon={ClipboardList} color="sky" count={fiches.length}>
            {fiches.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-3 italic">Aucune sortie enregistrée ce jour.</p>
            ) : (
              <div className="divide-y divide-border">
                {fiches.map(f => (
                  <div key={f.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink">{f.prenom} {f.nom}</p>
                      <p className="text-xs text-ink-3">{f.type === 'ANIMATEUR' ? 'Encadrant' : 'Enfant'} · {f.motif}</p>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <p className="text-ink-2">Sortie : <span className="font-mono">{new Date(f.heureSortie).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                      {f.heureRetour
                        ? <p className="text-sage">Retour : <span className="font-mono">{new Date(f.heureRetour).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                        : <p className="text-ember font-semibold">Absent</p>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Visiteurs */}
          <Section title="Visiteurs" icon={UserCheck} color="gold" count={visiteurs.length}>
            {visiteurs.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-3 italic">Aucun visiteur ce jour.</p>
            ) : (
              <div className="divide-y divide-border">
                {visiteurs.map(v => (
                  <div key={v.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-ink">{v.prenom} {v.nom}</p>
                      <p className="text-xs text-ink-3">{v.qualite} · {v.telephone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Dons */}
          <Section title="Dons" icon={Gift} color="gold" count={dons.length}>
            {dons.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-3 italic">Aucun don ce jour.</p>
            ) : (
              <div className="divide-y divide-border">
                {dons.map(d => (
                  <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-ink">{d.prenom} {d.nom}</p>
                      <p className="text-xs text-ink-3">{d.description} · {d.telephone}</p>
                    </div>
                    <span className={`text-sm font-semibold ${d.montant && Number(d.montant) > 0 ? 'text-gold' : 'text-ink-3'}`}>
                      {d.montant && Number(d.montant) > 0 ? formatCFA(Number(d.montant)) : 'En nature'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Activités */}
          {activites.length > 0 && (
            <Section title="Activités planifiées" icon={Calendar} color="sky" count={activites.length}>
              <div className="divide-y divide-border">
                {activites.map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-ink">{a.titre}</p>
                      <p className="text-xs text-ink-3">{a.lieu || 'Lieu non défini'}{a.camp ? ` · ${a.camp.nom}` : ''}</p>
                    </div>
                    <div className="text-right text-xs shrink-0 text-ink-3">
                      <p className="font-mono">{new Date(a.dateHeureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {new Date(a.dateHeureFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      <span className="badge-sky mt-1 inline-block">{a.statut}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Solde final */}
          <div className={`card border-2 ${soldeDuJour >= 0 ? 'border-sage/30 bg-sage/3' : 'border-ember/30 bg-ember/3'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-ink-3">Solde net du jour</p>
                <p className="text-xs text-ink-3 mt-0.5">Encaissements − Dépenses</p>
              </div>
              <p className={`font-display font-700 text-3xl ${soldeDuJour >= 0 ? 'text-sage' : 'text-ember'}`}>
                {soldeDuJour >= 0 ? '+' : ''}{formatCFA(soldeDuJour)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
