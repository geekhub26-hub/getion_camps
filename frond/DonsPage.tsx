import { useEffect, useState } from 'react'
import { Gift, Plus, X, Trash2, Phone, TrendingUp, Printer, Download, Edit2 } from 'lucide-react'
import api from './http'
import type { Camp, Don } from './index'

type ApiList<T> = { data: T[] }

const formatCFA = (n: number) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function getErrorMessage(err: unknown): string {
  return (err as any)?.response?.data?.message || 'Une erreur est survenue'
}

const emptyForm = { campIdForm: '', nom: '', prenom: '', telephone: '', description: '', montant: '', notes: '' }

export default function DonsPage() {
  const [camps, setCamps]   = useState<Camp[]>([])
  const [campId, setCampId] = useState('')
  const [dons, setDons]     = useState<Don[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]     = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.get<ApiList<Camp>>('/camps?perPage=100')
      .then(({ data }) => { setCamps(data.data || []); if (data.data[0]) setCampId(data.data[0].id) })
  }, [])

  const load = () => {
    api.get<ApiList<Don>>(`/dons${campId ? `?campId=${campId}` : ''}`)
      .then(({ data }) => setDons(data.data || []))
      .catch(() => setDons([]))
  }

  useEffect(load, [campId])

  const totalMontant = dons.reduce((s, d) => s + (d.montant ? Number(d.montant) : 0), 0)
  const donsAvecMontant = dons.filter(d => d.montant && Number(d.montant) > 0).length

  const openNew = () => {
    setEditingId(null)
    setForm({ ...emptyForm, campIdForm: campId })
    setError(''); setShowModal(true)
  }

  const openEdit = (d: Don) => {
    setEditingId(d.id)
    setForm({
      campIdForm: d.campId,
      nom: d.nom, prenom: d.prenom,
      telephone: d.telephone, description: d.description,
      montant: d.montant ? String(d.montant) : '',
      notes: d.notes || '',
    })
    setError(''); setShowModal(true)
  }

  const save = async () => {
    if (!form.nom || !form.prenom || !form.telephone || !form.description) {
      setError('Veuillez remplir tous les champs obligatoires.'); return
    }
    if (!editingId && !form.campIdForm) {
      setError('Veuillez sélectionner un camp.'); return
    }
    setError(''); setSaving(true)
    try {
      const payload = {
        nom: form.nom, prenom: form.prenom,
        telephone: form.telephone, description: form.description,
        montant: form.montant ? Number(form.montant) : undefined,
        notes: form.notes || undefined,
      }
      if (editingId) {
        await api.put(`/dons/${editingId}`, payload)
      } else {
        await api.post('/dons', { ...payload, campId: form.campIdForm })
      }
      setShowModal(false); load()
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  const deleteDon = async (id: string) => {
    if (!window.confirm('Supprimer ce don ?')) return
    await api.delete(`/dons/${id}`)
    load()
  }

  const campNom = camps.find(c => c.id === campId)?.nom || 'Camp'
  const dateGen = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:32px;color:#0f172a;font-size:12.5px}.hdr{padding-bottom:16px;border-bottom:2px solid #16a34a;margin-bottom:20px}.hdr h1{font-size:22px;font-weight:700}.hdr .camp{font-size:13px;color:#64748b;margin-top:2px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}.stat{border:1px solid #e2e8f0;border-radius:10px;padding:12px}.stat .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.stat .val{font-size:18px;font-weight:700}.green{color:#16a34a}.gold{color:#d97706}.sky{color:#0284c7}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;font-size:10px;text-transform:uppercase;color:#94a3b8;padding:8px 10px;text-align:left;border-bottom:1px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}tr:nth-child(even){background:#fafafa}.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;background:#f1f5f9;color:#475569}footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}@media print{body{padding:16px}}`

  const printPDF = () => {
    const win = window.open('', '_blank', 'width=900,height=1000')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Registre des dons — ${campNom}</title><style>${css}</style></head><body>
    <div class="hdr">
      <h1>Registre des dons</h1>
      <div class="camp">${campNom} &mdash; Généré le ${dateGen}</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="lbl">Total dons</div><div class="val">${dons.length}</div></div>
      <div class="stat"><div class="lbl">Montant total</div><div class="val green">${formatCFA(totalMontant)}</div></div>
      <div class="stat"><div class="lbl">Dons en nature</div><div class="val sky">${dons.length - donsAvecMontant}</div></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Nom &amp; Prénom</th><th>Téléphone</th><th>Description du don</th><th>Montant</th><th>Notes</th><th>Date</th></tr></thead>
      <tbody>
        ${dons.map((d, i) => `<tr>
          <td style="color:#94a3b8">${i + 1}</td>
          <td style="font-weight:600">${d.prenom} ${d.nom}</td>
          <td>${d.telephone}</td>
          <td>${d.description}</td>
          <td>${d.montant && Number(d.montant) > 0 ? `<span style="font-weight:700;color:#16a34a">${formatCFA(Number(d.montant))}</span>` : '<span class="badge">En nature</span>'}</td>
          <td style="color:#64748b">${d.notes || '—'}</td>
          <td style="color:#64748b;white-space:nowrap">${formatDateTime(d.createdAt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <footer><span>Camp Manager — Registre des dons</span><span>${campNom} · ${dateGen}</span></footer>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`)
    win.document.close()
  }

  const exportCSV = () => {
    const cols = ['N°','Prénom','Nom','Téléphone','Description','Montant (FCFA)','Type','Notes','Date']
    const rows = dons.map((d, i) => [
      i + 1, d.prenom, d.nom, d.telephone, d.description,
      d.montant && Number(d.montant) > 0 ? Number(d.montant) : '',
      d.montant && Number(d.montant) > 0 ? 'Espèces' : 'En nature',
      d.notes || '', formatDateTime(d.createdAt),
    ])
    const content = [cols, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }))
    a.download = `dons-${campNom}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Registre des dons</h1>
          <p className="text-sm text-ink-3">{dons.length} don{dons.length !== 1 ? 's' : ''} enregistré{dons.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <select className="input-field w-auto" value={campId} onChange={e => setCampId(e.target.value)}>
            {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <button onClick={exportCSV} disabled={!dons.length} className="btn-ghost flex items-center gap-2 px-3 disabled:opacity-40">
            <Download size={15} /> CSV
          </button>
          <button onClick={printPDF} disabled={!dons.length} className="btn-ghost flex items-center gap-2 px-3 disabled:opacity-40">
            <Printer size={15} /> PDF
          </button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={15} /> Enregistrer don
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-sage" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Total des dons (FCFA)</p>
            <p className="font-display font-700 text-xl text-sage">{formatCFA(totalMontant)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-gold" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Dons en espèces</p>
            <p className="font-display font-700 text-xl text-ink">{donsAvecMontant}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-sky" />
          </div>
          <div>
            <p className="text-xs text-ink-3">Dons en nature</p>
            <p className="font-display font-700 text-xl text-ink">{dons.length - donsAvecMontant}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between">
          <h2 className="font-display font-700 text-sm text-ink">Liste des dons</h2>
          {totalMontant > 0 && (
            <span className="text-xs font-semibold text-sage">Total : {formatCFA(totalMontant)}</span>
          )}
        </div>

        {dons.length === 0 ? (
          <div className="text-center py-14">
            <Gift size={36} className="mx-auto mb-3 text-ink-3 opacity-30" />
            <p className="text-ink-2 font-medium text-sm">Aucun don enregistré</p>
            <p className="text-ink-3 text-xs mt-1">Les dons reçus apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs font-semibold text-ink-3 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Nom / Prénom</th>
                  <th className="px-4 py-3 text-left">Téléphone</th>
                  <th className="px-4 py-3 text-left">Don / Description</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {dons.map((d, i) => (
                  <tr key={d.id} className={`border-b border-border last:border-0 hover:bg-surface/60 transition-colors ${i % 2 === 0 ? '' : 'bg-surface/30'}`}>
                    <td className="px-5 py-3 font-semibold text-ink">{d.prenom} {d.nom}</td>
                    <td className="px-4 py-3">
                      <a href={`tel:${d.telephone}`} className="flex items-center gap-1.5 text-sky hover:underline">
                        <Phone size={13} /> {d.telephone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-ink max-w-[200px] truncate">{d.description}</td>
                    <td className="px-4 py-3">
                      {d.montant && Number(d.montant) > 0
                        ? <span className="font-semibold text-sage">{formatCFA(Number(d.montant))}</span>
                        : <span className="badge-muted">En nature</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-ink-3 text-xs max-w-[160px] truncate">{d.notes || '—'}</td>
                    <td className="px-4 py-3 text-ink-3 whitespace-nowrap">{formatDateTime(d.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(d)} className="text-ink-3 hover:text-sage transition-colors p-0.5" title="Modifier">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => deleteDon(d.id)} className="text-ink-3 hover:text-ember transition-colors p-0.5" title="Supprimer">
                          <Trash2 size={13} />
                        </button>
                      </div>
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
              <h2 className="font-display font-700 text-base text-ink">
                {editingId ? 'Modifier le don' : 'Enregistrer un don'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-ink-3 hover:text-ink p-1 rounded-lg hover:bg-surface"><X size={17} /></button>
            </div>
            {error && <div className="rounded-xl border border-ember/20 bg-ember/8 px-3 py-2.5 text-sm text-ember">{error}</div>}
            <div className="space-y-3">
              {!editingId && (
                <div>
                  <label className="text-xs font-medium text-ink-3 mb-1 block">Camp *</label>
                  <select className="input-field" value={form.campIdForm} onChange={e => setForm({ ...form, campIdForm: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Nom *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                <input className="input-field" placeholder="Prénom *" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <input className="input-field" placeholder="Numéro de téléphone *" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              <input className="input-field" placeholder="Description du don * (ex: Riz 50kg, Médicaments, …)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Montant en FCFA (laisser vide si don en nature)</label>
                <input type="number" min={0} className="input-field" placeholder="0" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} />
              </div>
              <textarea className="input-field min-h-[60px] resize-none" placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                : editingId ? 'Enregistrer les modifications' : 'Enregistrer le don'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
