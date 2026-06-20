import { useEffect, useState } from 'react'
import { Users, Plus, Edit2, Trash2, Phone, Calendar, X, Save, BookOpen } from 'lucide-react'
import api from './http'
import type { Camp } from './index'
import { useAuthStore } from './auth.store'

interface Animateur {
  id: string
  nom: string
  prenom: string
  campId: string
  specialite: string | null
  telephone: string | null
  missions: string | null
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU'
  dateArrivee: string | null
  dateDepart: string | null
  camp: { id: string; nom: string }
  _count: { activites: number; groupes: number }
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display font-700 text-2xl text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-3 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function EmptyState({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="text-center py-16 text-ink-3">
      <Icon size={38} className="mx-auto mb-4 opacity-40" />
      <p className="font-medium text-ink-2">{title}</p>
      <p className="text-sm mt-1">{text}</p>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-2">
        {label}{required && <span className="text-ember ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ACTIF:    { label: 'Actif',    className: 'badge-green' },
    INACTIF:  { label: 'Inactif',  className: 'badge-muted' },
    SUSPENDU: { label: 'Suspendu', className: 'badge-ember' },
  }
  const { label, className } = config[statut] || config.INACTIF
  return <span className={className}>{label}</span>
}

function AnimateurCard({ a, onDelete, onEdit, isAdmin }: {
  a: Animateur; onDelete: (id: string) => void; onEdit: (a: Animateur) => void; isAdmin: boolean
}) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage/10 border border-sage/20 flex items-center justify-center shrink-0">
            <Users size={18} className="text-sage" />
          </div>
          <div>
            <h3 className="font-display font-700 text-base text-ink">{a.prenom} {a.nom}</h3>
            <p className="text-xs text-ink-3">{a.specialite || 'Polyvalent'}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(a)} className="p-1.5 rounded-lg text-ink-3 hover:text-sage hover:bg-sage/10 transition-colors"><Edit2 size={15} /></button>
            <button onClick={() => onDelete(a.id)} className="p-1.5 rounded-lg text-ink-3 hover:text-ember hover:bg-ember/10 transition-colors"><Trash2 size={15} /></button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-ink-2">
        {a.telephone && <div className="flex items-center gap-2"><Phone size={12} className="text-ink-3" />{a.telephone}</div>}
        {a.dateArrivee && (
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-ink-3" />
            {new Date(a.dateArrivee).toLocaleDateString('fr-FR')}
            {a.dateDepart && ` → ${new Date(a.dateDepart).toLocaleDateString('fr-FR')}`}
          </div>
        )}
      </div>

      {a.missions && (
        <div className="rounded-xl bg-surface border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen size={12} className="text-ink-3" />
            <span className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Missions</span>
          </div>
          <p className="text-xs text-ink-2 leading-relaxed whitespace-pre-line">{a.missions}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <StatutBadge statut={a.statut} />
        <div className="flex gap-3 text-xs text-ink-3">
          <span>{a._count?.groupes || 0} groupe{a._count?.groupes !== 1 ? 's' : ''}</span>
          <span>{a._count?.activites || 0} activité{a._count?.activites !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}

const emptyForm = {
  prenom: '', nom: '', specialite: '', telephone: '',
  missions: '', statut: 'ACTIF', dateArrivee: '', dateDepart: '', campId: '',
}

export default function AnimateursPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const [camps, setCamps]           = useState<Camp[]>([])
  const [campId, setCampId]         = useState('')
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Animateur | null>(null)
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    api.get('/camps?perPage=100')
      .then(res => {
        const list: Camp[] = res.data.data || []
        setCamps(list)
        if (list.length > 0) setCampId(list[0].id)
      })
      .catch(() => setCamps([]))
  }, [])

  const load = () => {
    if (!campId) return
    setLoading(true)
    api.get(`/animateurs?campId=${campId}&perPage=100`)
      .then(res => setAnimateurs(res.data.data || []))
      .catch(() => setAnimateurs([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [campId])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, campId })
    setError('')
    setShowForm(true)
  }

  const openEdit = (a: Animateur) => {
    setEditing(a)
    setForm({
      prenom: a.prenom, nom: a.nom,
      specialite: a.specialite || '', telephone: a.telephone || '',
      missions: a.missions || '', statut: a.statut,
      dateArrivee: a.dateArrivee?.slice(0, 10) || '',
      dateDepart:  a.dateDepart?.slice(0, 10) || '',
      campId: a.campId,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.put(`/animateurs/${editing.id}`, {
          nom: form.nom, prenom: form.prenom,
          specialite: form.specialite, telephone: form.telephone,
          missions: form.missions, statut: form.statut,
          dateArrivee: form.dateArrivee || undefined,
          dateDepart:  form.dateDepart  || undefined,
        })
      } else {
        await api.post('/animateurs', form)
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet animateur ?')) return
    await api.delete(`/animateurs/${id}`)
    load()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Animateurs"
        subtitle="Personnel d'encadrement"
        action={
          <div className="flex gap-3 flex-wrap">
            <select className="input-field w-48" value={campId} onChange={e => setCampId(e.target.value)}>
              {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            {isAdmin && (
              <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Nouvel animateur
              </button>
            )}
          </div>
        }
      />

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-700 text-lg">{editing ? 'Modifier' : 'Nouvel animateur'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface text-ink-3 hover:text-ink"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="rounded-xl border border-ember/20 bg-ember/10 px-3 py-2 text-sm text-ember">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" required>
                  <input className="input-field" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} required />
                </Field>
                <Field label="Nom" required>
                  <input className="input-field" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
                </Field>
              </div>

              <Field label="Spécialité">
                <input className="input-field" placeholder="Ex: Sports, Arts, Musique, Pédagogie..." value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))} />
              </Field>

              <Field label="Téléphone">
                <input className="input-field" placeholder="+237 XXXXXXXXX" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </Field>

              <Field label="Missions & responsabilités">
                <textarea
                  className="input-field min-h-28"
                  placeholder="Décrivez les missions et ce que l'animateur doit faire durant le camp..."
                  value={form.missions}
                  onChange={e => setForm(f => ({ ...f, missions: e.target.value }))}
                />
              </Field>

              {!editing && (
                <Field label="Camp" required>
                  <select className="input-field" value={form.campId} onChange={e => setForm(f => ({ ...f, campId: e.target.value }))} required>
                    <option value="">Sélectionner un camp</option>
                    {camps.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </Field>
              )}

              <Field label="Statut">
                <select className="input-field" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="SUSPENDU">Suspendu</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date d'arrivée">
                  <input type="date" className="input-field" value={form.dateArrivee} onChange={e => setForm(f => ({ ...f, dateArrivee: e.target.value }))} />
                </Field>
                <Field label="Date de départ">
                  <input type="date" className="input-field" value={form.dateDepart} onChange={e => setForm(f => ({ ...f, dateDepart: e.target.value }))} />
                </Field>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
                  <Save size={15} />{saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : animateurs.length === 0 ? (
        <EmptyState icon={Users} title="Aucun animateur" text="Créez des animateurs pour encadrer les groupes et activités." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {animateurs.map(a => (
            <AnimateurCard key={a.id} a={a} onDelete={handleDelete} onEdit={openEdit} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}
