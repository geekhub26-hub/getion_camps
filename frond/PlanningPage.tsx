import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { X, Plus, Trash2 } from 'lucide-react'
import api from './http'
import type { Activite, Camp } from './index'

type ApiList<T> = { data: T[] }

type ActivityItem = Activite & {
  camp?: { id: string; nom: string }
  animateur?: { user: { nom: string; prenom: string } }
}

const COULEURS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777']

const toLocalInput = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err && 'response' in err) {
    const r = (err as { response?: { data?: { message?: string } } }).response
    return r?.data?.message || 'Une erreur est survenue'
  }
  return 'Une erreur est survenue'
}

export default function PlanningPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [camps, setCamps]       = useState<Camp[]>([])
  const [campId, setCampId]     = useState('')
  const [items, setItems]       = useState<ActivityItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected]  = useState<ActivityItem | null>(null)
  const [saving, setSaving]      = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    campIdForm: '',
    titre: '', lieu: '', description: '',
    dateHeureDebut: '', dateHeureFin: '',
    couleur: '#16a34a',
  })

  useEffect(() => {
    api.get<ApiList<Camp>>('/camps?perPage=100')
      .then(({ data }) => {
        setCamps(data.data || [])
        if (data.data?.[0]) setCampId(data.data[0].id)
      })
      .catch(() => {})
  }, [])

  const load = () => {
    api.get<ApiList<ActivityItem>>(`/activites${campId ? `?campId=${campId}` : ''}`)
      .then(({ data }) => setItems(data.data || []))
      .catch(() => setItems([]))
  }

  useEffect(() => { load() }, [campId])

  const fcEvents = items.map(a => ({
    id: a.id,
    title: a.titre,
    start: a.dateHeureDebut,
    end: a.dateHeureFin,
    backgroundColor: a.couleur || '#16a34a',
    borderColor: 'transparent',
    textColor: '#ffffff',
    extendedProps: { lieu: a.lieu, statut: a.statut },
  }))

  const openNew = (dateStr?: string) => {
    setSelected(null)
    setFormError('')
    const startBase = dateStr ? `${dateStr}T08:00` : ''
    const endBase   = dateStr ? `${dateStr}T09:00` : ''
    setForm({ campIdForm: campId, titre: '', lieu: '', description: '', dateHeureDebut: startBase, dateHeureFin: endBase, couleur: '#16a34a' })
    setShowModal(true)
  }

  const openEdit = (info: EventClickArg) => {
    const a = items.find(i => i.id === info.event.id)
    if (!a) return
    setSelected(a)
    setFormError('')
    setForm({
      campIdForm: a.campId,
      titre: a.titre,
      lieu: a.lieu || '',
      description: a.description || '',
      dateHeureDebut: toLocalInput(a.dateHeureDebut),
      dateHeureFin: toLocalInput(a.dateHeureFin),
      couleur: a.couleur || '#16a34a',
    })
    setShowModal(true)
  }

  const handleDateClick = (info: DateClickArg) => openNew(info.dateStr)

  const save = async () => {
    if (!form.campIdForm) { setFormError('Veuillez sélectionner un camp.'); return }
    if (!form.titre.trim() || !form.dateHeureDebut || !form.dateHeureFin) return
    setFormError('')
    setSaving(true)
    const { campIdForm, ...rest } = form
    try {
      if (selected) {
        await api.put(`/activites/${selected.id}`, { ...rest, campId: campIdForm })
      } else {
        await api.post('/activites', { ...rest, campId: campIdForm })
      }
      setShowModal(false)
      load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteActivity = async () => {
    if (!selected || !window.confirm('Supprimer cette activité ?')) return
    await api.delete(`/activites/${selected.id}`)
    setShowModal(false)
    load()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Planning</h1>
          <p className="text-sm text-ink-3">
            {items.length} activité{items.length !== 1 ? 's' : ''} planifiée{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            className="input-field w-auto min-w-[180px]"
            value={campId}
            onChange={e => setCampId(e.target.value)}
          >
            {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <button onClick={() => openNew()} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="card p-0 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="fr"
          firstDay={1}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{ today: "Aujourd'hui", month: 'Mois', week: 'Semaine', day: 'Jour' }}
          events={fcEvents}
          dateClick={handleDateClick}
          eventClick={openEdit}
          height={700}
          dayMaxEvents={3}
          moreLinkText={n => `+${n} autres`}
          nowIndicator
          eventDisplay="block"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/25 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 space-y-4 animate-fade-up">
            {/* Header modal */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-base text-ink">
                {selected ? "Modifier l'activité" : 'Nouvelle activité'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-ink-3 hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface"
              >
                <X size={17} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-ember/20 bg-ember/8 px-3 py-2.5 text-sm text-ember">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-3 mb-1 block">Camp *</label>
                <select
                  className="input-field"
                  value={form.campIdForm}
                  onChange={e => setForm({ ...form, campIdForm: e.target.value })}
                >
                  <option value="">— Sélectionner un camp —</option>
                  {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <input
                className="input-field"
                placeholder="Titre de l'activité *"
                value={form.titre}
                onChange={e => setForm({ ...form, titre: e.target.value })}
                autoFocus
              />
              <input
                className="input-field"
                placeholder="Lieu (optionnel)"
                value={form.lieu}
                onChange={e => setForm({ ...form, lieu: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-3 mb-1 block">Début *</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={form.dateHeureDebut}
                    onChange={e => setForm({ ...form, dateHeureDebut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-3 mb-1 block">Fin *</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={form.dateHeureFin}
                    onChange={e => setForm({ ...form, dateHeureFin: e.target.value })}
                  />
                </div>
              </div>
              <textarea
                className="input-field min-h-[72px] resize-none"
                placeholder="Description (optionnel)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              {/* Couleur */}
              <div>
                <label className="text-xs font-medium text-ink-3 mb-2 block">Couleur</label>
                <div className="flex items-center gap-2">
                  {COULEURS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, couleur: c })}
                      className="w-7 h-7 rounded-full border-2 transition-all duration-100"
                      style={{
                        background: c,
                        borderColor: form.couleur === c ? '#0f172a' : 'transparent',
                        transform: form.couleur === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    className="w-7 h-7 rounded-full border border-border cursor-pointer overflow-hidden"
                    value={form.couleur}
                    onChange={e => setForm({ ...form, couleur: e.target.value })}
                    title="Couleur personnalisée"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {selected && (
                <button
                  onClick={deleteActivity}
                  className="btn-danger flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
              <button
                onClick={save}
                disabled={saving || !form.campIdForm || !form.titre.trim() || !form.dateHeureDebut || !form.dateHeureFin}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  selected ? 'Mettre à jour' : 'Créer l\'activité'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
