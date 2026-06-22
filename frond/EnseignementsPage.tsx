import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Plus, Edit2, Trash2, Printer, X, ChevronDown, ChevronUp } from 'lucide-react'
import api from './http'
import type { Camp } from './index'

interface Enseignement {
  id: string
  campId: string
  date: string
  orateur: string
  theme: string
  contenu: string
  notes?: string
  createdAt: string
}

const EMPTY_FORM = { date: '', orateur: '', theme: '', contenu: '', notes: '' }

function formatDateLabel(iso: string) {
  const d = new Date(iso)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function todayLocal() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

export default function EnseignementsPage() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [campId, setCampId] = useState('')
  const [enseignements, setEnseignements] = useState<Enseignement[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Enseignement | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, date: todayLocal() })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/camps?perPage=100')
      .then(r => { const list = r.data.data || []; setCamps(list); if (list.length) setCampId(list[0].id) })
      .catch(() => {})
  }, [])

  const load = () => {
    if (!campId) return
    setLoading(true)
    api.get(`/camps/${campId}/enseignements`)
      .then(r => {
        const list: Enseignement[] = r.data.data || []
        setEnseignements(list)
        // Expand all by date key
        const keys = new Set(list.map(e => e.date.slice(0, 10)))
        setExpanded(keys)
      })
      .catch(() => setEnseignements([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [campId])

  const grouped = useMemo(() => {
    const map = new Map<string, Enseignement[]>()
    enseignements.forEach(e => {
      const key = e.date.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), e])
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [enseignements])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, date: todayLocal() })
    setShowForm(true)
  }

  const openEdit = (e: Enseignement) => {
    setEditing(e)
    setForm({ date: e.date.slice(0, 10), orateur: e.orateur, theme: e.theme, contenu: e.contenu, notes: e.notes || '' })
    setShowForm(true)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/enseignements/${editing.id}`, form)
      } else {
        await api.post(`/camps/${campId}/enseignements`, form)
      }
      setShowForm(false)
      load()
    } catch { alert('Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet enseignement ?')) return
    await api.delete(`/enseignements/${id}`)
    load()
  }

  const handlePrint = () => {
    const camp = camps.find(c => c.id === campId)
    const win = window.open('', '_blank')
    if (!win) return
    const rows = grouped.map(([dateKey, list]) => `
      <div class="day">
        <h2>${formatDateLabel(dateKey + 'T00:00:00')}</h2>
        ${list.map((e, i) => `
          <div class="entry">
            <div class="meta"><strong>${i + 1}. ${e.theme}</strong> — <em>${e.orateur}</em></div>
            <div class="contenu">${e.contenu.replace(/\n/g, '<br>')}</div>
            ${e.notes ? `<div class="notes">Notes : ${e.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <title>Enseignements — ${camp?.nom || 'Camp'}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; color: #111; line-height: 1.6; }
        h1 { text-align: center; font-size: 22px; border-bottom: 2px solid #555; padding-bottom: 8px; margin-bottom: 24px; }
        h2 { font-size: 16px; color: #444; border-left: 4px solid #7eb87a; padding-left: 10px; margin-top: 28px; text-transform: capitalize; }
        .entry { margin: 12px 0 12px 20px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 6px; }
        .meta { font-size: 15px; margin-bottom: 6px; }
        .contenu { font-size: 14px; white-space: pre-wrap; }
        .notes { font-size: 13px; color: #666; margin-top: 6px; font-style: italic; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      <h1>Résumé des Enseignements — ${camp?.nom || 'Camp'}</h1>
      ${rows || '<p style="text-align:center;color:#999">Aucun enseignement enregistré.</p>'}
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Enseignements</h1>
          <p className="text-sm text-ink-3 mt-0.5">Journal des enseignements quotidiens</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input-field w-48" value={campId} onChange={e => setCampId(e.target.value)}>
            {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          {enseignements.length > 0 && (
            <button onClick={handlePrint} className="btn-ghost flex items-center gap-2">
              <Printer size={15} /> Imprimer
            </button>
          )}
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Nouvel enseignement
          </button>
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm p-4"
          onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-700 text-lg">{editing ? 'Modifier' : 'Nouvel'} enseignement</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-3 hover:text-ink"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-2">Date</span>
                <input type="date" required className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-2">Orateur / Prédicateur</span>
                <input required className="input-field" placeholder="Nom de l'orateur" value={form.orateur} onChange={e => setForm({ ...form, orateur: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-2">Thème / Titre</span>
                <input required className="input-field" placeholder="Thème de l'enseignement" value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-2">Résumé / Contenu</span>
                <textarea required className="input-field min-h-40 resize-y" placeholder="Résumé de l'enseignement…" value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-2">Notes complémentaires</span>
                <textarea className="input-field min-h-16 resize-y" placeholder="Observations, versets clés…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </label>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Sauvegarde…' : editing ? 'Mettre à jour' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste groupée par jour */}
      {loading ? (
        <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 text-ink-3">
          <BookOpen size={38} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium text-ink-2">Aucun enseignement enregistré</p>
          <p className="text-sm mt-1">Cliquez sur «Nouvel enseignement» pour commencer le journal.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, list]) => (
            <div key={dateKey} className="card overflow-hidden !p-0">
              <button
                className="w-full flex items-center justify-between px-5 py-3 bg-surface/50 hover:bg-surface transition-colors"
                onClick={() => toggle(dateKey)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage" />
                  <span className="font-display font-700 text-sm text-ink capitalize">{formatDateLabel(dateKey + 'T00:00:00')}</span>
                  <span className="text-xs text-ink-3">{list.length} enseignement{list.length > 1 ? 's' : ''}</span>
                </div>
                {expanded.has(dateKey) ? <ChevronUp size={15} className="text-ink-3" /> : <ChevronDown size={15} className="text-ink-3" />}
              </button>

              {expanded.has(dateKey) && (
                <div className="divide-y divide-border">
                  {list.map((e, idx) => (
                    <div key={e.id} className="px-5 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-ink">{idx + 1}. {e.theme}</p>
                          <p className="text-xs text-ink-3 mt-0.5">Orateur : <span className="text-ink-2 font-medium">{e.orateur}</span></p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-ink-3 hover:text-sage hover:bg-sage/10 transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg text-ink-3 hover:text-ember hover:bg-ember/10 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p className="text-sm text-ink-2 whitespace-pre-wrap">{e.contenu}</p>
                      {e.notes && <p className="text-xs text-ink-3 italic border-t border-border pt-2">{e.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
