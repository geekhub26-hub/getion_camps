import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Edit2, Trash2, UserPlus, UserMinus, Palette, X } from 'lucide-react'
import api from './http'
import type { Camp } from './index'

interface ParticipantMin {
  id: string
  dateNaissance: string
  niveauScolaire: string | null
}

function matchesCategorie(p: ParticipantMin, categorie: string, refDate: Date): boolean {
  const cat = categorie.toLowerCase()
  const calcAge = (p: ParticipantMin): number | null => {
    if (!p.dateNaissance) return null
    const birth = new Date(p.dateNaissance)
    let age = refDate.getUTCFullYear() - birth.getUTCFullYear()
    const m = refDate.getUTCMonth() - birth.getUTCMonth()
    if (m < 0 || (m === 0 && refDate.getUTCDate() < birth.getUTCDate())) age--
    return age
  }
  // Âge précis : "12 ans", "(12 ans)"
  const singleAge = categorie.match(/^\(?(\d+)\s*ans\)?$/i)
  if (singleAge) {
    const age = calcAge(p)
    return age !== null && age === Number(singleAge[1])
  }
  // Tranche d'âge : "(10-12 ans)", "Juniors (10-12 ans)", etc.
  const ageMatch = categorie.match(/\((\d+)-(\d+)\s*ans\)/i)
  if (ageMatch) {
    const age = calcAge(p)
    return age !== null && age >= Number(ageMatch[1]) && age <= Number(ageMatch[2])
  }
  // Niveau scolaire
  if (!p.niveauScolaire) return false
  const n = p.niveauScolaire.toLowerCase()
  if (/6.*5|5.*6/.test(cat)) return /6[eè]/.test(n) || /5[eè]/.test(n) || n.includes('sixième') || n.includes('cinquième')
  if (/4.*3|3.*4/.test(cat)) return /4[eè]/.test(n) || /3[eè]/.test(n) || n.includes('quatrième') || n.includes('troisième')
  if (cat.includes('2nde') || cat.includes('tle') || cat.includes('2nd')) return n.includes('2nd') || n.includes('seconde') || n.includes('1er') || n.includes('premi') || n.includes('tle') || n.includes('termin')
  return false
}

interface Groupe {
  id: string
  nom: string
  couleur: string
  categorie: string | null
  animateurId: string | null
  description: string | null
  campId: string
  _count?: { participants: number }
  animateur?: { id: string; nom: string; prenom: string; telephone: string | null }
}

interface AnimateurSimple {
  id: string
  nom: string
  prenom: string
  telephone: string | null
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

function GroupeCard({ groupe, onDelete, onEdit }: { 
  groupe: Groupe 
  onDelete: (id: string) => void
  onEdit: (groupe: Groupe) => void 
}) {
  return (
    <div className="card group hover:border-muted transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${groupe.couleur}20`, border: `1px solid ${groupe.couleur}40` }}
          >
            <Users size={18} style={{ color: groupe.couleur }} />
          </div>
          <div>
            <h3 className="font-display font-700 text-base text-ink">{groupe.nom}</h3>
            <p className="text-xs text-ink-3">
              {groupe.animateur ? `${groupe.animateur.prenom} ${groupe.animateur.nom}` : 'Animateur non assigné'}
            </p>
            {groupe.categorie && (
              <span className="mt-0.5 inline-block text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-ink-3">{groupe.categorie}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(groupe)} className="p-1.5 rounded-lg text-ink-3 hover:text-sage hover:bg-sage/10 transition-colors">
            <Edit2 size={15} />
          </button>
          <button onClick={() => onDelete(groupe.id)} className="p-1.5 rounded-lg text-ink-3 hover:text-ember hover:bg-ember/10 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {groupe.description && (
        <p className="text-xs text-ink-2 line-clamp-2">{groupe.description}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: groupe.couleur }}
          />
          <span className="text-xs text-ink-3">
            {groupe._count?.participants || 0} participants
          </span>
        </div>
        <Link 
          to={`/groupes/${groupe.id}`}
          className="text-xs text-sage hover:text-sage-light transition-colors flex items-center gap-1"
        >
          Voir détails <Users size={12} />
        </Link>
      </div>
    </div>
  )
}

export default function GroupesPage() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [campId, setCampId] = useState('')
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Groupe | null>(null)
  const [animateurs, setAnimateurs] = useState<AnimateurSimple[]>([])
  const [form, setForm] = useState({
    nom: '',
    couleur: '#7eb87a',
    categorie: '',
    animateurId: '',
    description: ''
  })
  const [autoMsg, setAutoMsg] = useState('')

  // Charger les camps
  useEffect(() => {
    api.get('/camps?perPage=100')
      .then(res => setCamps(res.data.data || []))
      .catch(() => setCamps([]))
  }, [])

  // Sélectionner le premier camp par défaut
  useEffect(() => {
    if (camps.length > 0 && !campId) {
      setCampId(camps[0].id)
    }
  }, [camps, campId])

  // Charger les groupes du camp sélectionné
  const loadGroupes = () => {
    if (!campId) return
    setLoading(true)
    api.get(`/camps/${campId}/groupes?perPage=100`)
      .then(res => setGroupes(res.data.data || []))
      .catch(() => setGroupes([]))
      .finally(() => setLoading(false))
  }

  const loadAnimateurs = () => {
    if (!campId) return
    api.get(`/animateurs?campId=${campId}&perPage=100`)
      .then(res => setAnimateurs(res.data.data || []))
      .catch(() => setAnimateurs([]))
  }

  useEffect(() => {
    loadGroupes()
    loadAnimateurs()
  }, [campId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/groupes/${editing.id}`, form)
      } else {
        const res = await api.post(`/camps/${campId}/groupes`, form)
        const groupeId: string = res.data.data?.id

        // Auto-assigner les participants correspondant à la catégorie
        if (form.categorie && groupeId) {
          const camp = camps.find(c => c.id === campId)
          const refDate = camp?.dateDebut ? new Date(camp.dateDebut) : new Date()
          const partRes = await api.get<{ data: ParticipantMin[] }>(`/camps/${campId}/participants?perPage=500&fields=id,dateNaissance,niveauScolaire`)
          const allP: ParticipantMin[] = partRes.data.data || []
          const matching = allP.filter(p => matchesCategorie(p, form.categorie, refDate))
          if (matching.length > 0) {
            await Promise.allSettled(matching.map(p => api.post(`/groupes/${groupeId}/participants/${p.id}`)))
            setAutoMsg(`✓ ${matching.length} participant${matching.length > 1 ? 's' : ''} ajouté${matching.length > 1 ? 's' : ''} automatiquement dans "${form.nom}".`)
            setTimeout(() => setAutoMsg(''), 6000)
          }
        }
      }
      setShowForm(false)
      setEditing(null)
      setForm({ nom: '', couleur: '#7eb87a', categorie: '', animateurId: '', description: '' })
      loadGroupes()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce groupe ?')) return
    await api.delete(`/groupes/${id}`)
    loadGroupes()
  }

  const handleEdit = (groupe: Groupe) => {
    setEditing(groupe)
    setForm({
      nom: groupe.nom,
      couleur: groupe.couleur,
      categorie: groupe.categorie || '',
      animateurId: groupe.animateurId || '',
      description: groupe.description || ''
    })
    setShowForm(true)
  }

  const couleurs = [
    '#7eb87a', '#c9963a', '#d4614a', '#5b9bd4',
    '#f59e0b', '#8b5cf6', '#ec489a', '#ef4444', '#06b6d4', '#6366f1'
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader 
        title="Groupes" 
        subtitle="Organisez les participants par équipes" 
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
              onClick={() => { setShowForm(true); setEditing(null); setForm({ nom: '', couleur: '#7eb87a', categorie: '', animateurId: '', description: '' }) }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Nouveau groupe
            </button>
          </div>
        }
      />

      {autoMsg && (
        <div className="rounded-xl border border-sage/30 bg-sage/8 px-4 py-3 text-sm text-sage flex items-center gap-2">
          {autoMsg}
          <button className="ml-auto text-sage/60 hover:text-sage" onClick={() => setAutoMsg('')}><X size={14} /></button>
        </div>
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-700 text-lg">{editing ? 'Modifier' : 'Nouveau'} groupe</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-3 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nom du groupe">
                <input className="input-field" required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </Field>

              <Field label="Couleur">
                <div className="flex flex-wrap gap-2">
                  {couleurs.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, couleur: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.couleur === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color" value={form.couleur} onChange={e => setForm({ ...form, couleur: e.target.value })} className="w-8 h-8 rounded border border-border" />
                </div>
              </Field>

              <Field label="Catégorie (tranche d'âge, classe…)">
                <div className="space-y-2.5">
                  <input className="input-field" placeholder="Ex : 12 ans, Juniors (10-12 ans), 6ème-5ème…" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} />
                  <div className="space-y-1.5">
                    <p className="text-xs text-ink-3">Âge précis</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[10,11,12,13,14,15,16,17,18].map(a => (
                        <button key={a} type="button" onClick={() => setForm({ ...form, categorie: `${a} ans` })}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.categorie === `${a} ans` ? 'bg-sage text-white border-sage' : 'border-border text-ink-3 hover:border-sage hover:text-sage'}`}>
                          {a} ans
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-ink-3">Tranche d'âge</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Juniors (10-12 ans)','Ados (13-15 ans)','Seniors (16-18 ans)'].map(c => (
                        <button key={c} type="button" onClick={() => setForm({ ...form, categorie: c })}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.categorie === c ? 'bg-sage text-white border-sage' : 'border-border text-ink-3 hover:border-sage hover:text-sage'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-ink-3">Niveau scolaire</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['6ème-5ème','4ème-3ème','2nde-Tle'].map(c => (
                        <button key={c} type="button" onClick={() => setForm({ ...form, categorie: c })}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.categorie === c ? 'bg-sage text-white border-sage' : 'border-border text-ink-3 hover:border-sage hover:text-sage'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Field>

              <Field label="Animateur responsable">
                <select className="input-field" value={form.animateurId} onChange={e => setForm({ ...form, animateurId: e.target.value })}>
                  <option value="">Non assigné</option>
                  {animateurs.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.prenom} {a.nom}{a.telephone ? ` · ${a.telephone}` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <textarea className="input-field min-h-24" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </Field>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
                <button type="submit" className="btn-primary">{editing ? 'Mettre à jour' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des groupes */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : groupes.length === 0 ? (
        <EmptyState icon={Users} title="Aucun groupe" text="Créez votre premier groupe pour organiser les participants." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupes.map(groupe => (
            <GroupeCard key={groupe.id} groupe={groupe} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  )
}