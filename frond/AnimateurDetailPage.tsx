// fond/AnimateurDetailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, UserRound, Phone, Mail, Calendar, Edit2, Trash2, 
  Users, Activity, Briefcase, X, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import api from './http'

interface AnimateurDetail {
  id: string
  userId: string
  campId: string
  specialite: string | null
  telephone: string | null
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU'
  dateArrivee: string | null
  dateDepart: string | null
  user: {
    id: string
    nom: string
    prenom: string
    email: string
    avatarUrl: string | null
    actif: boolean
    role: string
  }
  camp: { id: string; nom: string }
  groupes: {
    id: string
    nom: string
    couleur: string
    _count: { participants: number }
  }[]
  activites: {
    id: string
    titre: string
    dateHeureDebut: string
    statut: string
  }[]
}

function BackButton({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink">
      <ArrowLeft size={15} /> Retour aux animateurs
    </Link>
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
  const config: Record<string, { label: string; icon: any; className: string }> = {
    ACTIF: { label: 'Actif', icon: CheckCircle, className: 'text-sage bg-sage/10' },
    INACTIF: { label: 'Inactif', icon: XCircle, className: 'text-ink-3 bg-muted/20' },
    SUSPENDU: { label: 'Suspendu', icon: AlertCircle, className: 'text-ember bg-ember/10' }
  }
  const { label, icon: Icon, className } = config[statut] || config.INACTIF
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

export default function AnimateurDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [animateur, setAnimateur] = useState<AnimateurDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({
    specialite: '',
    telephone: '',
    statut: 'ACTIF',
    dateArrivee: '',
    dateDepart: ''
  })

  const loadAnimateur = () => {
    if (!id) return
    setLoading(true)
    api.get(`/animateurs/${id}`)
      .then(res => {
        setAnimateur(res.data.data)
        setEditForm({
          specialite: res.data.data.specialite || '',
          telephone: res.data.data.telephone || '',
          statut: res.data.data.statut,
          dateArrivee: res.data.data.dateArrivee?.split('T')[0] || '',
          dateDepart: res.data.data.dateDepart?.split('T')[0] || ''
        })
      })
      .catch(() => navigate('/animateurs'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnimateur()
  }, [id])

  const updateAnimateur = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put(`/animateurs/${id}`, editForm)
      setShowEditForm(false)
      loadAnimateur()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const deleteAnimateur = async () => {
    if (!window.confirm('Retirer définitivement cet animateur du camp ?')) return
    await api.delete(`/animateurs/${id}`)
    navigate('/animateurs')
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton to="/animateurs" />
        <div className="card animate-pulse h-96" />
      </div>
    )
  }

  if (!animateur) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton to="/animateurs" />
        <div className="card text-center py-16">
          <UserRound size={48} className="mx-auto mb-4 text-ink-3 opacity-40" />
          <p className="text-ink-2">Animateur introuvable</p>
          <Link to="/animateurs" className="btn-primary inline-flex mt-4">Retour aux animateurs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton to="/animateurs" />

      {/* En-tête */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sage/15 border border-sage/30 flex items-center justify-center">
              {animateur.user.avatarUrl ? (
                <img src={animateur.user.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <UserRound size={32} className="text-sage" />
              )}
            </div>
            <div>
              <h1 className="font-display font-700 text-2xl text-ink">
                {animateur.user.prenom} {animateur.user.nom}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <StatutBadge statut={animateur.statut} />
                {animateur.specialite && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                    <Briefcase size={12} /> {animateur.specialite}
                  </span>
                )}
                <span className="text-xs text-ink-3">Camp: {animateur.camp.nom}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEditForm(true)} className="btn-ghost inline-flex items-center gap-2">
              <Edit2 size={16} /> Modifier
            </button>
            <button onClick={deleteAnimateur} className="btn-danger inline-flex items-center gap-2">
              <Trash2 size={16} /> Retirer
            </button>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-2 gap-3">
          {animateur.telephone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={15} className="text-ink-3" />
              <span className="text-ink-2">{animateur.telephone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Mail size={15} className="text-ink-3" />
            <span className="text-ink-2">{animateur.user.email}</span>
          </div>
          {animateur.dateArrivee && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={15} className="text-ink-3" />
              <span className="text-ink-2">Arrivée: {new Date(animateur.dateArrivee).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          {animateur.dateDepart && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={15} className="text-ink-3" />
              <span className="text-ink-2">Départ: {new Date(animateur.dateDepart).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Groupes encadrés */}
      <div className="card">
        <h2 className="font-display font-700 text-lg text-ink flex items-center gap-2 mb-4">
          <Users size={18} className="text-sage" />
          Groupes encadrés ({animateur.groupes.length})
        </h2>
        {animateur.groupes.length === 0 ? (
          <p className="text-center text-ink-3 py-6 text-sm">Aucun groupe assigné pour le moment</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {animateur.groupes.map(groupe => (
              <Link 
                key={groupe.id} 
                to={`/groupes/${groupe.id}`}
                className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border hover:border-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: groupe.couleur }}
                  />
                  <div>
                    <p className="font-medium text-sm">{groupe.nom}</p>
                    <p className="text-xs text-ink-3">{groupe._count.participants} participants</p>
                  </div>
                </div>
                <ArrowLeft size={14} className="text-ink-3 rotate-180" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activités à animer */}
      <div className="card">
        <h2 className="font-display font-700 text-lg text-ink flex items-center gap-2 mb-4">
          <Activity size={18} className="text-sage" />
          Activités à animer ({animateur.activites.length})
        </h2>
        {animateur.activites.length === 0 ? (
          <p className="text-center text-ink-3 py-6 text-sm">Aucune activité planifiée pour le moment</p>
        ) : (
          <div className="space-y-2">
            {animateur.activites.map(activite => (
              <div key={activite.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                <div>
                  <p className="font-medium text-sm">{activite.titre}</p>
                  <p className="text-xs text-ink-3">
                    {new Date(activite.dateHeureDebut).toLocaleDateString('fr-FR', { 
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
                <span className="text-xs text-ink-3">{activite.statut}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm" onClick={() => setShowEditForm(false)}>
          <div className="card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-700 text-lg">Modifier l'animateur</h2>
              <button onClick={() => setShowEditForm(false)} className="text-ink-3 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={updateAnimateur} className="space-y-4">
              <Field label="Spécialité">
                <input 
                  className="input-field" 
                  placeholder="Ex: Sports, Arts, Pédagogie..." 
                  value={editForm.specialite} 
                  onChange={e => setEditForm({ ...editForm, specialite: e.target.value })} 
                />
              </Field>

              <Field label="Téléphone">
                <input 
                  className="input-field" 
                  placeholder="+237 XXXXXXXX" 
                  value={editForm.telephone} 
                  onChange={e => setEditForm({ ...editForm, telephone: e.target.value })} 
                />
              </Field>

              <Field label="Statut">
                <select 
                  className="input-field" 
                  value={editForm.statut} 
                  onChange={e => setEditForm({ ...editForm, statut: e.target.value })}
                >
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="SUSPENDU">Suspendu</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date d'arrivée">
                  <input 
                    type="date" 
                    className="input-field" 
                    value={editForm.dateArrivee} 
                    onChange={e => setEditForm({ ...editForm, dateArrivee: e.target.value })} 
                  />
                </Field>
                <Field label="Date de départ">
                  <input 
                    type="date" 
                    className="input-field" 
                    value={editForm.dateDepart} 
                    onChange={e => setEditForm({ ...editForm, dateDepart: e.target.value })} 
                  />
                </Field>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEditForm(false)} className="btn-ghost">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}