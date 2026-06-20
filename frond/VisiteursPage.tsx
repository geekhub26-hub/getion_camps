import { useEffect, useState } from 'react'
import { UserCheck, Plus, X, Trash2, Phone, Printer, Download } from 'lucide-react'
import api from './http'
import type { Camp, Visiteur } from './index'

type ApiList<T> = { data: T[] }

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function getErrorMessage(err: unknown): string {
  return (err as any)?.response?.data?.message || 'Une erreur est survenue'
}

const emptyForm = { campIdForm: '', nom: '', prenom: '', telephone: '', qualite: '', notes: '' }

export default function VisiteursPage() {
  const [camps, setCamps]     = useState<Camp[]>([])
  const [campId, setCampId]   = useState('')
  const [visiteurs, setVisiteurs] = useState<Visiteur[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get<ApiList<Camp>>('/camps?perPage=100')
      .then(({ data }) => { setCamps(data.data || []); if (data.data[0]) setCampId(data.data[0].id) })
  }, [])

  const load = () => {
    api.get<ApiList<Visiteur>>(`/visiteurs${campId ? `?campId=${campId}` : ''}`)
      .then(({ data }) => setVisiteurs(data.data || []))
      .catch(() => setVisiteurs([]))
  }

  useEffect(load, [campId])

  const openNew = () => {
    setForm({ ...emptyForm, campIdForm: campId })
    setError(''); setShowModal(true)
  }

  const save = async () => {
    if (!form.campIdForm || !form.nom || !form.prenom || !form.telephone || !form.qualite) {
      setError('Veuillez remplir tous les champs obligatoires.'); return
    }
    setError(''); setSaving(true)
    try {
      const { campIdForm, ...rest } = form
      await api.post('/visiteurs', { ...rest, campId: campIdForm })
      setShowModal(false); load()
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  const deleteVisiteur = async (id: string) => {
    if (!window.confirm('Supprimer ce visiteur ?')) return
    await api.delete(`/visiteurs/${id}`)
    load()
  }

  const campNom = camps.find(c => c.id === campId)?.nom || 'Camp'
  const dateGen = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:32px;color:#0f172a;font-size:12.5px}.hdr{padding-bottom:16px;border-bottom:2px solid #d97706;margin-bottom:20px}.hdr h1{font-size:22px;font-weight:700}.hdr .camp{font-size:13px;color:#64748b;margin-top:2px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}.stat{border:1px solid #e2e8f0;border-radius:10px;padding:12px}.stat .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.stat .val{font-size:18px;font-weight:700}.sky{color:#0284c7}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;font-size:10px;text-transform:uppercase;color:#94a3b8;padding:8px 10px;text-align:left;border-bottom:1px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}tr:nth-child(even){background:#fafafa}.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;background:#f1f5f9;color:#475569}footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}@media print{body{padding:16px}}`

  const printPDF = () => {
    const win = window.open('', '_blank', 'width=900,height=1000')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Registre des visiteurs — ${campNom}</title><style>${css}</style></head><body>
    <div class="hdr">
      <h1>Registre des visiteurs</h1>
      <div class="camp">${campNom} &mdash; Généré le ${dateGen}</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="lbl">Total visiteurs</div><div class="val sky">${visiteurs.length}</div></div>
      <div class="stat"><div class="lbl">Fonctions distinctes</div><div class="val">${new Set(visiteurs.map(v => v.qualite)).size}</div></div>
      <div class="stat"><div class="lbl">Aujourd'hui</div><div class="val">${visiteurs.filter(v => new Date(v.createdAt).toDateString() === new Date().toDateString()).length}</div></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Prénom &amp; Nom</th><th>Téléphone</th><th>Qualité / Fonction</th><th>Notes</th><th>Date de visite</th></tr></thead>
      <tbody>
        ${visiteurs.map((v, i) => `<tr>
          <td style="color:#94a3b8">${i + 1}</td>
          <td style="font-weight:600">${v.prenom} ${v.nom}</td>
          <td>${v.telephone}</td>
          <td><span class="badge">${v.qualite}</span></td>
          <td style="color:#64748b">${v.notes || '—'}</td>
          <td style="color:#64748b;white-space:nowrap">${new Date(v.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <footer><span>Camp Manager — Registre des visiteurs</span><span>${campNom} · ${dateGen}</span></footer>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`)
    win.document.close()
  }

  const exportCSV = () => {
    const cols = ['N°','Prénom','Nom','Téléphone','Qualité / Fonction','Notes','Date de visite']
    const rows = visiteurs.map((v, i) => [
      i + 1, v.prenom, v.nom, v.telephone, v.qualite, v.notes || '',
      new Date(v.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    ])
    const content = [cols, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }))
    a.download = `visiteurs-${campNom}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Fiche des visiteurs</h1>
          <p className="text-sm text-ink-3">{visiteurs.length} visiteur{visiteurs.length !== 1 ? 's' : ''} enregistré{visiteurs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <select className="input-field w-auto" value={campId} onChange={e => setCampId(e.target.value)}>
            {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <button onClick={exportCSV} disabled={!visiteurs.length} className="btn-ghost flex items-center gap-2 px-3 disabled:opacity-40">
            <Download size={15} /> CSV
          </button>
          <button onClick={printPDF} disabled={!visiteurs.length} className="btn-ghost flex items-center gap-2 px-3 disabled:opacity-40">
            <Printer size={15} /> PDF
          </button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={15} /> Enregistrer visiteur
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between">
          <h2 className="font-display font-700 text-sm text-ink">Registre des visiteurs</h2>
          <span className="badge-sky">{visiteurs.length} total</span>
        </div>

        {visiteurs.length === 0 ? (
          <div className="text-center py-14">
            <UserCheck size={36} className="mx-auto mb-3 text-ink-3 opacity-30" />
            <p className="text-ink-2 font-medium text-sm">Aucun visiteur enregistré</p>
            <p className="text-ink-3 text-xs mt-1">Les visiteurs du camp apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs font-semibold text-ink-3 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Nom / Prénom</th>
                  <th className="px-4 py-3 text-left">Téléphone</th>
                  <th className="px-4 py-3 text-left">Qualité / Fonction</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Date de visite</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visiteurs.map((v, i) => (
                  <tr key={v.id} className={`border-b border-border last:border-0 hover:bg-surface/60 transition-colors ${i % 2 === 0 ? '' : 'bg-surface/30'}`}>
                    <td className="px-5 py-3 font-semibold text-ink">{v.prenom} {v.nom}</td>
                    <td className="px-4 py-3">
                      <a href={`tel:${v.telephone}`} className="flex items-center gap-1.5 text-sky hover:underline">
                        <Phone size={13} /> {v.telephone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-muted">{v.qualite}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-3 text-xs max-w-[180px] truncate">{v.notes || '—'}</td>
                    <td className="px-4 py-3 text-ink-3 whitespace-nowrap">{formatDateTime(v.createdAt)}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => deleteVisiteur(v.id)} className="text-ink-3 hover:text-ember transition-colors">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-base text-ink">Nouveau visiteur</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Nom *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                <input className="input-field" placeholder="Prénom *" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <input className="input-field" placeholder="Numéro de téléphone *" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              <input className="input-field" placeholder="Qualité / Fonction * (ex: Parent, Inspecteur, Journaliste…)" value={form.qualite} onChange={e => setForm({ ...form, qualite: e.target.value })} />
              <textarea className="input-field min-h-[60px] resize-none" placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</> : 'Enregistrer le visiteur'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
