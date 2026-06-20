// fond/GroupeDetailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, Users, UserPlus, UserMinus, Calendar, Edit2, Trash2, 
  Palette, Search, X, Check, UserRound
} from 'lucide-react'
import api from './http'
import type { Participant } from './index'

interface GroupeDetail {
  id: string
  nom: string
  couleur: string
  animateurId: string | null
  description: string | null
  camp: { id: string; nom: string }
  animateur: {
    id: string
    user: { nom: string; prenom: string; email: string; avatarUrl: string | null }
  } | null
  participants: {
    participant: Participant
  }[]
  activites: {
    activite: {
      id: string
      titre: string
      dateHeureDebut: string
    }
  }[]
  _count?: { participants: number }
}

interface ParticipantDisponible {
  id: string
  nom: string
  prenom: string
  statutInscription: string
  alreadyInGroup: boolean
}

function BackButton({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink">
      <ArrowLeft size={15} /> Retour aux groupes
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

export default function GroupeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [groupe, setGroupe] = useState<GroupeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [search, setSearch] = useState('')
  const [participantsDisponibles, setParticipantsDisponibles] = useState<ParticipantDisponible[]>([])
  const [adding, setAdding] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [animateurs, setAnimateurs] = useState<any[]>([])
  const [editForm, setEditForm] = useState({
    nom: '',
    couleur: '',
    animateurId: '',
    description: ''
  })

  // Charger les détails du groupe
  const loadGroupe = () => {
    if (!id) return
    setLoading(true)
    api.get(`/groupes/${id}`)
      .then(res => {
        setGroupe(res.data.data)
        setEditForm({
          nom: res.data.data.nom,
          couleur: res.data.data.couleur,
          animateurId: res.data.data.animateurId || '',
          description: res.data.data.description || ''
        })
      })
      .catch(() => navigate('/groupes'))
      .finally(() => setLoading(false))
  }

  // Charger les animateurs pour le formulaire d'édition
  const loadAnimateurs = () => {
    api.get('/animateurs/disponibles/liste')
      .then(res => setAnimateurs(res.data.data || []))
      .catch(() => setAnimateurs([]))
  }

  // Charger les participants disponibles (non assignés au groupe)
  const loadParticipantsDisponibles = () => {
    if (!groupe?.camp?.id) return
    api.get(`/camps/${groupe.camp.id}/participants?perPage=100&search=${search}`)
      .then(res => {
        const tousParticipants = res.data.data || []
        const participantsIdsInGroup = new Set(groupe.participants.map(p => p.participant.id))
        const disponibles = tousParticipants.map((p: Participant) => ({
          ...p,
          alreadyInGroup: participantsIdsInGroup.has(p.id)
        }))
        setParticipantsDisponibles(disponibles)
      })
      .catch(() => setParticipantsDisponibles([]))
  }

  useEffect(() => {
    loadGroupe()
    loadAnimateurs()
  }, [id])

  useEffect(() => {
    if (showAddParticipant && groupe) {
      loadParticipantsDisponibles()
    }
  }, [showAddParticipant, search, groupe])

  // Ajouter un participant au groupe
  const addParticipant = async (participantId: string) => {
    setAdding(true)
    try {
      await api.post(`/groupes/${id}/participants/${participantId}`)
      loadGroupe()
      loadParticipantsDisponibles()
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setAdding(false)
    }
  }

  // Retirer un participant du groupe
  const removeParticipant = async (participantId: string) => {
    if (!window.confirm('Retirer ce participant du groupe ?')) return
    try {
      await api.delete(`/groupes/${id}/participants/${participantId}`)
      loadGroupe()
      if (showAddParticipant) loadParticipantsDisponibles()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  // Supprimer le groupe
  const deleteGroupe = async () => {
    if (!window.confirm('Supprimer définitivement ce groupe ?')) return
    await api.delete(`/groupes/${id}`)
    navigate('/groupes')
  }

  // Modifier le groupe
  const updateGroupe = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put(`/groupes/${id}`, editForm)
      setShowEditForm(false)
      loadGroupe()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const couleurs = [
    '#7eb87a', '#c9963a', '#d4614a', '#5b9bd4',
    '#f59e0b', '#8b5cf6', '#ec489a', '#ef4444', '#06b6d4', '#6366f1'
  ]

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton to="/groupes" />
        <div className="card animate-pulse h-96" />
      </div>
    )
  }

  if (!groupe) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton to="/groupes" />
        <div className="card text-center py-16">
          <Users size={48} className="mx-auto mb-4 text-ink-3 opacity-40" />
          <p className="text-ink-2">Groupe introuvable</p>
          <Link to="/groupes" className="btn-primary inline-flex mt-4">Retour aux groupes</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton to="/groupes" />

      {/* En-tête du groupe */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${groupe.couleur}20`, border: `2px solid ${groupe.couleur}` }}
            >
              <Users size={32} style={{ color: groupe.couleur }} />
            </div>
            <div>
              <h1 className="font-display font-700 text-2xl text-ink">{groupe.nom}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-ink-3">
                  <Palette size={14} />
                  <span style={{ color: groupe.couleur }}>{groupe.couleur}</span>
                </div>
                {groupe.animateur && (
                  <div className="flex items-center gap-1.5 text-sm text-ink-3">
                    <UserRound size={14} />
                    <span>Animateur: {groupe.animateur.user.prenom} {groupe.animateur.user.nom}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-ink-3">
                  <Users size={14} />
                  <span>{groupe.participants.length} participants</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowEditForm(true)} 
              className="btn-ghost inline-flex items-center gap-2"
            >
              <Edit2 size={16} /> Modifier
            </button>
            <button 
              onClick={deleteGroupe} 
              className="btn-danger inline-flex items-center gap-2"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          </div>
        </div>

        {groupe.description && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-ink-2">{groupe.description}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-ink-3">
            Camp: <span className="text-ink-2">{groupe.camp.nom}</span>
          </p>
        </div>
      </div>

      {/* Liste des participants */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display font-700 text-lg text-ink flex items-center gap-2">
            <Users size={18} className="text-sage" />
            Participants du groupe ({groupe.participants.length})
          </h2>
          <button 
            onClick={() => setShowAddParticipant(!showAddParticipant)} 
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <UserPlus size={15} /> Ajouter un participant
          </button>
        </div>

        {/* Formulaire d'ajout de participant */}
        {showAddParticipant && (
          <div className="mb-4 p-4 bg-surface rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Ajouter un participant</h3>
              <button onClick={() => setShowAddParticipant(false)} className="text-ink-3 hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un participant..."
                className="input-field pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {participantsDisponibles.length === 0 ? (
                <p className="text-center text-ink-3 py-4 text-sm">Aucun participant trouvé</p>
              ) : (
                participantsDisponibles.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                    <div>
                      <p className="font-medium text-sm">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-ink-3">{p.statutInscription}</p>
                    </div>
                    {p.alreadyInGroup ? (
                      <button 
                        onClick={() => removeParticipant(p.id)}
                        className="btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1"
                      >
                        <UserMinus size={13} /> Retirer
                      </button>
                    ) : (
                      <button 
                        onClick={() => addParticipant(p.id)}
                        disabled={adding}
                        className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1"
                      >
                        <UserPlus size={13} /> Ajouter
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tableau des participants du groupe */}
        {groupe.participants.length === 0 ? (
          <div className="text-center py-12 text-ink-3">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun participant dans ce groupe</p>
            <button 
              onClick={() => setShowAddParticipant(true)} 
              className="btn-primary inline-flex items-center gap-2 mt-3 text-sm"
            >
              <UserPlus size={14} /> Ajouter des participants
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {groupe.participants.map(({ participant }) => (
              <div key={participant.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border hover:border-muted transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-medium text-sm">{participant.prenom} {participant.nom}</p>
                    <span className="text-xs text-ink-3">{participant.statutInscription}</span>
                  </div>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {participant.parents?.[0]?.email || 'Parent non renseigné'}
                  </p>
                </div>
                <button 
                  onClick={() => removeParticipant(participant.id)}
                  className="p-2 rounded-lg text-ink-3 hover:text-ember hover:bg-ember/10 transition-colors"
                  title="Retirer du groupe"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activités du groupe */}
      {groupe.activites.length > 0 && (
        <div className="card">
          <h2 className="font-display font-700 text-lg text-ink flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-sage" />
            Activités planifiées
          </h2>
          <div className="space-y-2">
            {groupe.activites.map(({ activite }) => (
              <div key={activite.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                <div className="w-1.5 h-8 rounded-full bg-sage" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{activite.titre}</p>
                  <p className="text-xs text-ink-3">
                    {new Date(activite.dateHeureDebut).toLocaleDateString('fr-FR', { 
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
                <Link to={`/planning`} className="text-xs text-sage hover:text-sage-light">
                  Voir
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm" onClick={() => setShowEditForm(false)}>
          <div className="card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-700 text-lg">Modifier le groupe</h2>
              <button onClick={() => setShowEditForm(false)} className="text-ink-3 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={updateGroupe} className="space-y-4">
              <Field label="Nom du groupe">
                <input className="input-field" required value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} />
              </Field>

              <Field label="Couleur">
                <div className="flex flex-wrap gap-2">
                  {couleurs.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, couleur: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${editForm.couleur === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color" value={editForm.couleur} onChange={e => setEditForm({ ...editForm, couleur: e.target.value })} className="w-8 h-8 rounded border border-border" />
                </div>
              </Field>

              <Field label="Animateur responsable">
                <select className="input-field" value={editForm.animateurId} onChange={e => setEditForm({ ...editForm, animateurId: e.target.value })}>
                  <option value="">Non assigné</option>
                  {animateurs.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.user?.prenom} {a.user?.nom} - {a.camp?.nom}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <textarea className="input-field min-h-24" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </Field>

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