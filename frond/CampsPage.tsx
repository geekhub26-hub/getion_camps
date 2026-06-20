import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tent, Plus, Search, Users, Calendar, MapPin, ArrowRight } from 'lucide-react'
import api from './http'
import type { Camp, StatutCamp } from './index'
import { formatDate, formatCFA, statutCampBadge, statutCampLabel } from './helpers'

const STATUTS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'OUVERT', label: 'Ouverts' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'COMPLET', label: 'Complets' },
  { value: 'BROUILLON', label: 'Brouillons' },
  { value: 'TERMINE', label: 'Terminés' },
]

function CampCard({ camp }: { camp: Camp }) {
  const tauxOccupation = Math.round(((camp._count?.participants ?? 0) / camp.capaciteMax) * 100)
  return (
    <Link
      to={`/camps/${camp.id}`}
      className="card group hover:border-muted transition-all duration-200 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-sage/10 border border-sage/20 flex items-center justify-center shrink-0">
          <Tent size={18} className="text-sage" />
        </div>
        <span className={statutCampBadge[camp.statut as StatutCamp]}>{statutCampLabel[camp.statut as StatutCamp]}</span>
      </div>

      {/* Nom */}
      <div>
        <h3 className="font-display font-700 text-base text-ink group-hover:text-sage transition-colors">{camp.nom}</h3>
        {camp.description && <p className="text-xs text-ink-3 mt-1 line-clamp-2">{camp.description}</p>}
      </div>

      {/* Infos */}
      <div className="space-y-1.5 text-xs text-ink-2">
        <div className="flex items-center gap-2"><MapPin size={12} className="text-ink-3" />{camp.lieu}</div>
        <div className="flex items-center gap-2"><Calendar size={12} className="text-ink-3" />{formatDate(camp.dateDebut)} → {formatDate(camp.dateFin)}</div>
        <div className="flex items-center gap-2"><Users size={12} className="text-ink-3" />{camp._count?.participants ?? 0} / {camp.capaciteMax} participants</div>
      </div>

      {/* Barre occupation */}
      <div>
        <div className="flex justify-between text-xs text-ink-3 mb-1.5">
          <span>Taux d'occupation</span>
          <span className={tauxOccupation >= 90 ? 'text-ember' : tauxOccupation >= 60 ? 'text-gold' : 'text-sage'}>{tauxOccupation}%</span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${tauxOccupation}%`,
              background: tauxOccupation >= 90 ? '#d4614a' : tauxOccupation >= 60 ? '#c9963a' : '#7eb87a',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs font-medium text-gold">{formatCFA(Number(camp.prixBase))}</span>
        <ArrowRight size={14} className="text-ink-3 group-hover:text-sage transition-colors" />
      </div>
    </Link>
  )
}

export default function CampsPage() {
  const [camps, setCamps]     = useState<Camp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statut, setStatut]   = useState('')
  const [total, setTotal]     = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ perPage: '20' })
        if (search) params.set('search', search)
        if (statut) params.set('statut', statut)
        const { data } = await api.get(`/camps?${params}`)
        setCamps(data.data || [])
        setTotal(data.meta?.total ?? 0)
      } catch { setCamps([]) }
      setLoading(false)
    }
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, statut])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display font-700 text-2xl text-ink">Camps</h1>
          <p className="text-ink-3 text-sm mt-0.5">{total} camp{total > 1 ? 's' : ''} au total</p>
        </div>
        <Link to="/camps/nouveau" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouveau camp
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-up">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un camp..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatut(s.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-150
                ${statut === s.value
                  ? 'bg-sage/12 text-sage border-sage/20'
                  : 'text-ink-2 border-border hover:border-muted hover:text-ink'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : camps.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <Tent size={40} className="mx-auto mb-4 text-ink-3 opacity-40" />
          <p className="text-ink-2 font-medium">Aucun camp trouvé</p>
          <p className="text-ink-3 text-sm mt-1">Essayez un autre filtre ou créez un nouveau camp.</p>
          <Link to="/camps/nouveau" className="btn-primary inline-flex items-center gap-2 mt-5">
            <Plus size={15} />Créer un camp
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {camps.map((camp, i) => (
            <div key={camp.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-up">
              <CampCard camp={camp} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
