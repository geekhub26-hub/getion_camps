import { useEffect, useState } from 'react'
import { ClipboardList, Plus, X, Trash2, Check, Clock, LogIn, Printer, Download } from 'lucide-react'
import api from './http'
import type { Camp, FichePresence, TypePresence } from './index'

type ApiList<T> = { data: T[] }

const TYPE_LABELS: Record<TypePresence, string> = {
  ANIMATEUR: 'Encadrant',
  ENFANT: 'Enfant',
}

function toLocalInput(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function formatHeure(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function getErrorMessage(err: unknown): string {
  const r = (err as any)?.response?.data?.message
  return r || 'Une erreur est survenue'
}

const emptyForm = {
  campIdForm: '', type: 'ANIMATEUR' as TypePresence,
  nom: '', prenom: '', heureSortie: '', motif: '', notes: '',
}

export default function FichePresencePage() {
  const [camps, setCamps]       = useState<Camp[]>([])
  const [campId, setCampId]     = useState('')
  const [filtre, setFiltre]     = useState<TypePresence | ''>('')
  const [fiches, setFiches]     = useState<FichePresence[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showRetour, setShowRetour] = useState<FichePresence | null>(null)
  const [retourForm, setRetourForm] = useState({ heureRetour: '', signature: '' })
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get<ApiList<Camp>>('/camps?perPage=100')
      .then(({ data }) => { setCamps(data.data || []); if (data.data[0]) setCampId(data.data[0].id) })
  }, [])

  const load = () => {
    const params = new URLSearchParams()
    if (campId) params.set('campId', campId)
    if (filtre) params.set('type', filtre)
    api.get<ApiList<FichePresence>>(`/fiches-presence?${params}`)
      .then(({ data }) => setFiches(data.data || []))
      .catch(() => setFiches([]))
  }

  useEffect(load, [campId, filtre])

  const openNew = () => {
    const now = toLocalInput(new Date().toISOString())
    setForm({ ...emptyForm, campIdForm: campId, heureSortie: now })
    setError('')
    setShowModal(true)
  }

  const toUTC = (local: string) => local ? new Date(local).toISOString() : ''

  const save = async () => {
    if (!form.campIdForm || !form.nom || !form.prenom || !form.heureSortie || !form.motif) {
      setError('Veuillez remplir tous les champs obligatoires.'); return
    }
    setError(''); setSaving(true)
    try {
      const { campIdForm, ...rest } = form
      await api.post('/fiches-presence', {
        ...rest,
        heureSortie: toUTC(rest.heureSortie),
        campId: campIdForm,
      })
      setShowModal(false); load()
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  const openRetour = (f: FichePresence) => {
    setRetourForm({ heureRetour: toLocalInput(new Date().toISOString()), signature: '' })
    setShowRetour(f)
  }

  const saveRetour = async () => {
    if (!showRetour) return
    await api.put(`/fiches-presence/${showRetour.id}`, {
      heureRetour: toUTC(retourForm.heureRetour),
      signature: retourForm.signature || undefined,
    })
    setShowRetour(null); load()
  }

  const deleteFiche = async (id: string) => {
    if (!window.confirm('Supprimer cette fiche ?')) return
    await api.delete(`/fiches-presence/${id}`)
    load()
  }

  const presente = fiches.filter(f => !f.heureRetour)
  const revenue  = fiches.filter(f => !!f.heureRetour)

  const campNom = camps.find(c => c.id === campId)?.nom || 'Camp'
  const dateGen = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:32px;color:#0f172a;font-size:12.5px}.hdr{padding-bottom:16px;border-bottom:2px solid #0284c7;margin-bottom:20px}.hdr h1{font-size:22px;font-weight:700}.hdr .camp{font-size:13px;color:#64748b;margin-top:2px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}.stat{border:1px solid #e2e8f0;border-radius:10px;padding:12px}.stat .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.stat .val{font-size:18px;font-weight:700}.green{color:#16a34a}.red{color:#dc2626}.sky{color:#0284c7}.gold{color:#d97706}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;font-size:10px;text-transform:uppercase;color:#94a3b8;padding:8px 10px;text-align:left;border-bottom:1px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}tr:nth-child(even){background:#fafafa}.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600}.bg{background:#e0f2fe;color:#0284c7}.br{background:#fee2e2;color:#dc2626}.bge{background:#fef3c7;color:#d97706}footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}@media print{body{padding:16px}}`

  const printPDF = () => {
    const win = window.open('', '_blank', 'width=1000,height=1000')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fiche de présence — ${campNom}</title><style>${css}</style></head><body>
    <div class="hdr">
      <h1>Fiche de présence / Sorties</h1>
      <div class="camp">${campNom} &mdash; Généré le ${dateGen}</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="lbl">Total mouvements</div><div class="val">${fiches.length}</div></div>
      <div class="stat"><div class="lbl">Actuellement dehors</div><div class="val red">${presente.length}</div></div>
      <div class="stat"><div class="lbl">Retours enregistrés</div><div class="val green">${revenue.length}</div></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Nom &amp; Prénom</th><th>Type</th><th>Date</th><th>H. Sortie</th><th>Motif</th><th>H. Retour</th><th>Signature</th><th>Statut</th></tr></thead>
      <tbody>
        ${fiches.map((f, i) => `<tr>
          <td style="color:#94a3b8">${i + 1}</td>
          <td style="font-weight:600">${f.prenom} ${f.nom}</td>
          <td><span class="badge ${f.type === 'ANIMATEUR' ? 'bg' : 'bge'}">${f.type === 'ANIMATEUR' ? 'Encadrant' : 'Enfant'}</span></td>
          <td style="color:#64748b;white-space:nowrap">${formatDate(f.heureSortie)}</td>
          <td style="font-family:monospace">${formatHeure(f.heureSortie)}</td>
          <td>${f.motif}</td>
          <td style="font-family:monospace">${f.heureRetour ? formatHeure(f.heureRetour) : '—'}</td>
          <td style="color:#64748b">${f.signature || '—'}</td>
          <td>${f.heureRetour ? '<span class="badge" style="background:#dcfce7;color:#16a34a">Retour</span>' : '<span class="badge br">Absent</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <footer><span>Camp Manager — Fiche de présence</span><span>${campNom} · ${dateGen}</span></footer>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`)
    win.document.close()
  }

  const exportCSV = () => {
    const cols = ['N°','Prénom','Nom','Type','Date','H. Sortie','Motif','H. Retour','Signature','Statut']
    const rows = fiches.map((f, i) => [
      i + 1, f.prenom, f.nom,
      f.type === 'ANIMATEUR' ? 'Encadrant' : 'Enfant',
      formatDate(f.heureSortie), formatHeure(f.heureSortie), f.motif,
      f.heureRetour ? formatHeure(f.heureRetour) : '',
      f.signature || '',
      f.heureRetour ? 'Retour' : 'Absent',
    ])
    const content = [cols, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }))
    a.download = `presence-${campNom}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Fiche de présence</h1>
          <p className="text-sm text-ink-3">Sorties et retours des encadrants et enfants</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className="input-field w-auto" value={campId} onChange={e => setCampId(e.target.value)}>
            {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <div className="flex border border-border rounded-xl overflow-hidden text-sm">
            {([['', 'Tous'], ['ANIMATEUR', 'Encadrants'], ['ENFANT', 'Enfants']] as [string, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setFiltre(v as any)}
                className={`px-3 py-2 font-medium transition-colors ${filtre === v ? 'bg-sage text-white' : 'text-ink-2 hover:bg-surface'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} disabled={!fiches.length} className="btn-ghost flex items-center gap-2 px-3 disabled:opacity-40">
            <Download size={15} /> CSV
          </button>
          <button onClick={printPDF} disabled={!fiches.length} className="btn-ghost flex items-center gap-2 px-3 disabled:opacity-40">
            <Printer size={15} /> PDF
          </button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Nouvelle sortie
          </button>
        </div>
      </div>

      {/* Compteurs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-ember/10 flex items-center justify-center shrink-0">
            <ClipboardList size={18} className="text-ember" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Dehors actuellement</p>
            <p className="font-display font-700 text-2xl text-ink">{presente.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
            <LogIn size={18} className="text-sage" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Retours enregistrés</p>
            <p className="font-display font-700 text-2xl text-ink">{revenue.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-sky" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Total mouvements</p>
            <p className="font-display font-700 text-2xl text-ink">{fiches.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface">
          <h2 className="font-display font-700 text-sm text-ink">Registre des sorties</h2>
        </div>
        {fiches.length === 0 ? (
          <div className="text-center py-14">
            <ClipboardList size={36} className="mx-auto mb-3 text-ink-3 opacity-30" />
            <p className="text-ink-2 font-medium text-sm">Aucune fiche enregistrée</p>
            <p className="text-ink-3 text-xs mt-1">Les sorties apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs font-semibold text-ink-3 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Nom / Prénom</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">H. Sortie</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                  <th className="px-4 py-3 text-left">H. Retour</th>
                  <th className="px-4 py-3 text-left">Signature</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {fiches.map((f, i) => (
                  <tr key={f.id} className={`border-b border-border last:border-0 hover:bg-surface/60 transition-colors ${i % 2 === 0 ? '' : 'bg-surface/30'}`}>
                    <td className="px-5 py-3 font-semibold text-ink">{f.prenom} {f.nom}</td>
                    <td className="px-4 py-3">
                      <span className={f.type === 'ANIMATEUR' ? 'badge-sky' : 'badge-gold'}>
                        {TYPE_LABELS[f.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-3 whitespace-nowrap">{formatDate(f.heureSortie)}</td>
                    <td className="px-4 py-3 font-mono text-sm">{formatHeure(f.heureSortie)}</td>
                    <td className="px-4 py-3 text-ink-2 max-w-[160px] truncate">{f.motif}</td>
                    <td className="px-4 py-3 font-mono text-sm text-sage">
                      {f.heureRetour ? formatHeure(f.heureRetour) : (
                        <button onClick={() => openRetour(f)} className="text-xs text-sky font-medium hover:underline flex items-center gap-1">
                          <LogIn size={13} /> Enregistrer
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-3 text-xs">{f.signature || '—'}</td>
                    <td className="px-4 py-3">
                      {f.heureRetour
                        ? <span className="badge-green"><Check size={11} /> Retour</span>
                        : <span className="badge-ember">Dehors</span>
                      }
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => deleteFiche(f.id)} className="text-ink-3 hover:text-ember transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nouvelle fiche */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-base text-ink">Enregistrer une sortie</h2>
              <button onClick={() => setShowModal(false)} className="text-ink-3 hover:text-ink p-1 rounded-lg hover:bg-surface"><X size={17} /></button>
            </div>
            {error && <div className="rounded-xl border border-ember/20 bg-ember/8 px-3 py-2.5 text-sm text-ember">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Camp *</label>
                <select className="input-field" value={form.campIdForm} onChange={e => setForm({ ...form, campIdForm: e.target.value })}>
                  <option value="">— Sélectionner —</option>
                  {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Type de personne *</label>
                <div className="flex border border-border rounded-xl overflow-hidden text-sm">
                  {(['ANIMATEUR', 'ENFANT'] as TypePresence[]).map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2.5 font-medium transition-colors ${form.type === t ? 'bg-sage text-white' : 'text-ink-2 hover:bg-surface'}`}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Nom *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                <input className="input-field" placeholder="Prénom *" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Heure de sortie *</label>
                <input type="datetime-local" className="input-field" value={form.heureSortie} onChange={e => setForm({ ...form, heureSortie: e.target.value })} />
              </div>
              <input className="input-field" placeholder="Motif de la sortie *" value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} />
              <textarea className="input-field min-h-[60px] resize-none" placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</> : 'Enregistrer la sortie'}
            </button>
          </div>
        </div>
      )}

      {/* Modal enregistrer retour */}
      {showRetour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={() => setShowRetour(null)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-base text-ink">Retour de {showRetour.prenom} {showRetour.nom}</h2>
              <button onClick={() => setShowRetour(null)} className="text-ink-3 hover:text-ink p-1 rounded-lg hover:bg-surface"><X size={17} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Heure de retour *</label>
                <input type="datetime-local" className="input-field" value={retourForm.heureRetour} onChange={e => setRetourForm({ ...retourForm, heureRetour: e.target.value })} />
              </div>
              <input className="input-field" placeholder="Signature (nom complet)" value={retourForm.signature} onChange={e => setRetourForm({ ...retourForm, signature: e.target.value })} />
            </div>
            <button onClick={saveRetour} className="btn-primary w-full flex items-center justify-center gap-2">
              <Check size={15} /> Confirmer le retour
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
