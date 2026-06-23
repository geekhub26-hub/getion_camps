import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Plus, Trash2, Printer, RotateCcw, ChevronDown, ChevronUp, Check } from 'lucide-react'
import api from './http'
import type { Camp } from './index'

interface GroupeMin {
  id: string
  nom: string
  couleur: string
  animateur?: { prenom: string; nom: string } | null
  _count?: { participants: number }
}

interface Causerie {
  id: string
  groupeId: string
  date: string
  theme: string
  resume?: string
  notes?: string
  groupe: GroupeMin
}

function todayLocal() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function prevDay(d: string) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() - 1)
  return dt.toISOString().slice(0, 10)
}

function formatDateLabel(iso: string) {
  return new Date(iso + 'T12:00:00')
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CauseriesPage() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [campId, setCampId] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [groupes, setGroupes] = useState<GroupeMin[]>([])
  const [causeries, setCauseries] = useState<Causerie[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [forms, setForms] = useState<Record<string, { theme: string; resume: string; notes: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [reconduireLoading, setReconduireLoading] = useState(false)

  useEffect(() => {
    api.get('/camps?perPage=100')
      .then(r => { const list = r.data.data || []; setCamps(list); if (list.length) setCampId(list[0].id) })
  }, [])

  const loadGroupes = () => {
    if (!campId) return
    api.get(`/camps/${campId}/groupes?perPage=100`)
      .then(r => setGroupes(r.data.data || []))
      .catch(() => setGroupes([]))
  }

  const loadCauseries = () => {
    if (!campId) return
    api.get(`/camps/${campId}/causeries?date=${date}`)
      .then(r => {
        const list: Causerie[] = r.data.data || []
        setCauseries(list)
        // Pré-remplir les forms avec les causeries existantes
        const next: Record<string, { theme: string; resume: string; notes: string }> = {}
        list.forEach(c => { next[c.groupeId] = { theme: c.theme, resume: c.resume || '', notes: c.notes || '' } })
        setForms(prev => {
          // Garder les valeurs non sauvegardées si l'utilisateur est en train d'éditer
          const merged = { ...prev }
          list.forEach(c => { merged[c.groupeId] = next[c.groupeId] })
          return merged
        })
      })
  }

  useEffect(() => { loadGroupes(); loadCauseries() }, [campId])
  useEffect(() => { loadCauseries() }, [date])

  const causerieByGroupe = useMemo(() => {
    const m = new Map<string, Causerie>()
    causeries.forEach(c => m.set(c.groupeId, c))
    return m
  }, [causeries])

  const getForm = (groupeId: string) =>
    forms[groupeId] ?? { theme: '', resume: '', notes: '' }

  const setFormField = (groupeId: string, field: string, value: string) =>
    setForms(prev => ({ ...prev, [groupeId]: { ...getForm(groupeId), [field]: value } }))

  const saveCauserie = async (groupeId: string) => {
    const f = getForm(groupeId)
    if (!f.theme.trim()) return
    setSaving(groupeId)
    try {
      await api.post(`/camps/${campId}/causeries`, { groupeId, date, theme: f.theme, resume: f.resume, notes: f.notes })
      setSaved(prev => { const s = new Set(prev); s.add(groupeId); return s })
      setTimeout(() => setSaved(prev => { const s = new Set(prev); s.delete(groupeId); return s }), 2000)
      loadCauseries()
    } finally { setSaving(null) }
  }

  const deleteCauserie = async (id: string, groupeId: string) => {
    if (!window.confirm('Supprimer cette causerie ?')) return
    await api.delete(`/camps/${campId}/causeries/${id}`)
    setForms(prev => ({ ...prev, [groupeId]: { theme: '', resume: '', notes: '' } }))
    loadCauseries()
  }

  const reconduire = async () => {
    const hier = prevDay(date)
    setReconduireLoading(true)
    try {
      const res = await api.post(`/camps/${campId}/causeries/reconduire`, { dateSource: hier, dateCible: date })
      const n = res.data.data?.reconduites ?? 0
      alert(`${n} causerie${n > 1 ? 's' : ''} reconduite${n > 1 ? 's' : ''} depuis la veille.`)
      loadCauseries()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Aucune causerie à reconduire hier.')
    } finally { setReconduireLoading(false) }
  }

  const handlePrint = () => {
    const camp = camps.find(c => c.id === campId)
    const win = window.open('', '_blank')
    if (!win) return
    const rows = groupes.map(g => {
      const c = causerieByGroupe.get(g.id)
      return c ? `
        <div class="entry">
          <h3 style="color:${g.couleur}">${g.nom}</h3>
          <p><strong>Thème :</strong> ${c.theme}</p>
          ${c.resume ? `<p><strong>Résumé :</strong><br>${c.resume.replace(/\n/g, '<br>')}</p>` : ''}
          ${c.notes ? `<p class="notes">Notes : ${c.notes}</p>` : ''}
        </div>` : ''
    }).join('')
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <title>Causeries — ${camp?.nom || 'Camp'} — ${formatDateLabel(date)}</title>
      <style>
        body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#111;line-height:1.6}
        h1{text-align:center;font-size:20px;border-bottom:2px solid #555;padding-bottom:8px;margin-bottom:6px}
        h2{text-align:center;font-size:14px;color:#666;margin-top:0;margin-bottom:24px;text-transform:capitalize}
        .entry{margin:16px 0;padding:12px 16px;border:1px solid #ddd;border-radius:6px;page-break-inside:avoid}
        h3{margin:0 0 6px;font-size:15px}
        p{margin:4px 0;font-size:13px}
        .notes{color:#777;font-style:italic;font-size:12px}
      </style></head><body>
      <h1>Causeries des groupes — ${camp?.nom || 'Camp'}</h1>
      <h2>${formatDateLabel(date)}</h2>
      ${rows || '<p style="text-align:center;color:#999">Aucune causerie enregistrée pour ce jour.</p>'}
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const nbAvecCauserie = groupes.filter(g => causerieByGroupe.has(g.id)).length
  const toggle = (id: string) => setExpanded(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Causeries des groupes</h1>
          <p className="text-sm text-ink-3 mt-0.5">Thème et résumé quotidien par groupe</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className="input-field w-44" value={campId} onChange={e => setCampId(e.target.value)}>
            {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <input type="date" className="input-field w-40" value={date} onChange={e => setDate(e.target.value)} />
          <button onClick={reconduire} disabled={reconduireLoading} className="btn-ghost flex items-center gap-1.5 text-sm" title="Reconduire les causeries de la veille">
            <RotateCcw size={14} /> Reconduire veille
          </button>
          {nbAvecCauserie > 0 && (
            <button onClick={handlePrint} className="btn-ghost flex items-center gap-1.5 text-sm">
              <Printer size={14} /> Imprimer
            </button>
          )}
        </div>
      </div>

      {/* Indicateur progression */}
      {groupes.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-ink-3">
          <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${groupes.length ? (nbAvecCauserie / groupes.length) * 100 : 0}%` }} />
          </div>
          <span className="shrink-0">{nbAvecCauserie} / {groupes.length} groupes renseignés</span>
        </div>
      )}

      {/* Date label */}
      <p className="text-sm font-medium text-ink-2 capitalize">{formatDateLabel(date)}</p>

      {/* Cartes groupe */}
      {groupes.length === 0 ? (
        <div className="text-center py-16 text-ink-3">
          <MessageSquare size={38} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium text-ink-2">Aucun groupe</p>
          <p className="text-sm mt-1">Créez des groupes dans la section Groupes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupes.map(g => {
            const causerie = causerieByGroupe.get(g.id)
            const f = getForm(g.id)
            const isOpen = expanded.has(g.id)
            const isDone = !!causerie
            const isSaving = saving === g.id
            const isSaved = saved.has(g.id)

            return (
              <div key={g.id} className={`rounded-2xl border overflow-hidden transition-colors ${isDone ? 'border-sage/30' : 'border-border'}`}>
                {/* Header */}
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDone ? 'bg-sage/5 hover:bg-sage/10' : 'bg-surface/50 hover:bg-surface'}`}
                  onClick={() => toggle(g.id)}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.couleur }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink">{g.nom}</p>
                    <p className="text-xs text-ink-3">
                      {g._count?.participants ?? 0} participants
                      {g.animateur ? ` · ${g.animateur.prenom} ${g.animateur.nom}` : ''}
                      {causerie ? <span className="ml-2 text-sage font-medium">· {causerie.theme}</span> : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isDone && <span className="w-5 h-5 rounded-full bg-sage flex items-center justify-center"><Check size={11} className="text-white" /></span>}
                    {isOpen ? <ChevronUp size={15} className="text-ink-3" /> : <ChevronDown size={15} className="text-ink-3" />}
                  </div>
                </button>

                {/* Formulaire inline */}
                {isOpen && (
                  <div className="px-4 py-4 space-y-3 border-t border-border bg-canvas">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-ink-2">Thème de la causerie *</span>
                      <input
                        className="input-field"
                        placeholder="Ex : La foi et l'action, Le pardon…"
                        value={f.theme}
                        onChange={e => setFormField(g.id, 'theme', e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-ink-2">Résumé / Points clés</span>
                      <textarea
                        className="input-field min-h-28 resize-y"
                        placeholder="Ce qui a été dit, les questions soulevées, les décisions prises…"
                        value={f.resume}
                        onChange={e => setFormField(g.id, 'resume', e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-ink-2">Notes</span>
                      <input
                        className="input-field"
                        placeholder="Observations, ambiance, points à suivre…"
                        value={f.notes}
                        onChange={e => setFormField(g.id, 'notes', e.target.value)}
                      />
                    </label>
                    <div className="flex items-center justify-between pt-1">
                      {causerie && (
                        <button
                          onClick={() => deleteCauserie(causerie.id, g.id)}
                          className="text-xs flex items-center gap-1 text-ember hover:bg-ember/5 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        {isSaved && <span className="text-xs text-sage flex items-center gap-1"><Check size={12} /> Sauvegardé</span>}
                        <button
                          onClick={() => saveCauserie(g.id)}
                          disabled={isSaving || !f.theme.trim()}
                          className="btn-primary flex items-center gap-1.5 text-sm"
                        >
                          {isSaving ? 'Sauvegarde…' : causerie ? 'Mettre à jour' : <><Plus size={13} /> Enregistrer</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
