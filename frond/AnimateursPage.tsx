import { useEffect, useState } from 'react'
import { Users, Plus, Edit2, Trash2, Phone, Mail, Calendar, X } from 'lucide-react'
import api from './http'
import type { Camp, User } from './index'

interface Animateur {
  id: string
  userId: string
  campId: string
  specialite: string | null
  telephone: string | null
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU'
  dateArrivee: string | null
  dateDepart: string | null
  user: User
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-2">{label}</span>
      {children}
    </label>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ACTIF: { label: 'Actif', className: 'badge-green' },
    INACTIF: { label: 'Inactif', className: 'badge-muted' },
    SUSPENDU: { label: 'Suspendu', className: 'badge-ember' }
  }
  const { label, className } = config[statut] || config.INACTIF
  return <span className={className}>{label}</span>
}

function AnimateurCard({ animateur, onDelete, onEdit }: { 
  animateur: Animateur 
  onDelete: (id: string) => void
  onEdit: (animateur: Animateur) => void 
}) {
  return (
    <div className="card group hover:border-muted transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage/10 border border-sage/20 flex items-center justify-center">
            <Users size={18} className="text-sage" />
          </div>
          <div>
            <h3 className="font-display font-700 text-base text-ink">
              {animateur.user.prenom} {animateur.user.nom}
            </h3>
            <p className="text-xs text-ink-3">{animateur.specialite || 'Polyvalent'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(animateur)} className="p-1.5 rounded-lg text-ink-3 hover:text-sage hover:bg-sage/10 transition-colors">
            <Edit2 size={15} />
          </button>
          <button onClick={() => onDelete(animateur.id)} className="p-1.5 rounded-lg text-ink-3 hover:text-ember hover:bg-ember/10 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-ink-2">
        {animateur.telephone && (
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-ink-3" />
            {animateur.telephone}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Mail size={12} className="text-ink-3" />
          {animateur.user.email}
        </div>
        {animateur.dateArrivee && (
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-ink-3" />
            Arrivée: {new Date(animateur.dateArrivee).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <StatutBadge statut={animateur.statut} />
        <div className="flex gap-3 text-xs text-ink-3">
          <span>{animateur._count?.groupes || 0} groupes</span>
          <span>{animateur._count?.activites || 0} activités</span>
        </div>
      </div>
    </div>
  )
}

export default function AnimateursPage() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [campId, setCampId] = useState('')
  const [animateurs, setAnimateurs] = useState<Animateur[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Animateur | null>(null)
  const [form, setForm] = useState({
    userId: '',
    specialite: '',
    telephone: '',
    statut: 'ACTIF',
    dateArrivee: '',
    dateDepart: ''
  })

  // Charger les camps
  useEffect(() => {
    api.get('/camps?perPage=100')
      .then(res => setCamps(res.data.data || []))
      .catch(() => setCamps([]))
  }, [])

  // Charger les utilisateurs ayant le rôle ANIMATEUR
  useEffect(() => {
    api.get('/users?role=ANIMATEUR')
      .catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (camps.length > 0 && !campId) {
      setCampId(camps[0].id)
    }
  }, [camps, campId])

  const loadAnimateurs = () => {
    if (!campId) return
    setLoading(true)
    api.get(`/camps/${campId}/animateurs?perPage=100`)
      .then(res => setAnimateurs(res.data.data || []))
      .catch(() => setAnimateurs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnimateurs()
  }, [campId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/animateurs/${editing.id}`, form)
      } else {
        await api.post(`/camps/${campId}/animateurs`, form)
      }
      setShowForm(false)
      setEditing(null)
      setForm({ userId: '', specialite: '', telephone: '', statut: 'ACTIF', dateArrivee: '', dateDepart: '' })
      loadAnimateurs()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Retirer cet animateur du camp ?')) return
    await api.delete(`/animateurs/${id}`)
    loadAnimateurs()
  }

  const handleEdit = (animateur: Animateur) => {
    setEditing(animateur)
    setForm({
      userId: animateur.userId,
      specialite: animateur.specialite || '',
      telephone: animateur.telephone || '',
      statut: animateur.statut,
      dateArrivee: animateur.dateArrivee?.split('T')[0] || '',
      dateDepart: animateur.dateDepart?.split('T')[0] || ''
    })
    setShowForm(true)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader 
        title="Animateurs" 
        subtitle="Gestion du personnel d'encadrement" 
        action={
          <div className="flex gap-3">
            <select 
              className="input-field w-48"
              value={campId}
              onChange={e => setCampId(e.target.value)}
            >
              {camps.map(camp => (
                <option key={camp.id} value={camp.id}>{camp.nom}</option>
              ))}
            </select>
            <button 
              onClick={() => { setShowForm(true); setEditing(null); setForm({ userId: '', specialite: '', telephone: '', statut: 'ACTIF', dateArrivee: '', dateDepart: '' }) }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Ajouter animateur
            </button>
          </div>
        }
      />

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-700 text-lg">{editing ? 'Modifier' : 'Ajouter'} animateur</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-3 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <Field label="Utilisateur">
                  <select className="input-field" required value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Spécialité">
                <input className="input-field" placeholder="Ex: Sports, Arts, Pédagogie..." value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} />
              </Field>

              <Field label="Téléphone">
                <input className="input-field" placeholder="+237 XXXXXXXX" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              </Field>

              <Field label="Statut">
                <select className="input-field" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="SUSPENDU">Suspendu</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date d'arrivée">
                  <input type="date" className="input-field" value={form.dateArrivee} onChange={e => setForm({ ...form, dateArrivee: e.target.value })} />
                </Field>
                <Field label="Date de départ">
                  <input type="date" className="input-field" value={form.dateDepart} onChange={e => setForm({ ...form, dateDepart: e.target.value })} />
                </Field>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
                <button type="submit" className="btn-primary">{editing ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des animateurs */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : animateurs.length === 0 ? (
        <EmptyState icon={Users} title="Aucun animateur" text="Ajoutez des animateurs pour encadrer les groupes et activités." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {animateurs.map(animateur => (
            <AnimateurCard key={animateur.id} animateur={animateur} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  )
}