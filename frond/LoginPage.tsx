import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tent, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { useAuthStore } from './auth.store'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Email ou mot de passe incorrect')
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Left panel — branding vert */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-sage p-12 relative overflow-hidden">
        {/* Décors géométriques */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-sage-dark/40" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Tent size={20} className="text-white" />
          </div>
          <span className="font-display font-700 text-lg text-white">Camp Manager</span>
        </div>

        {/* Message central */}
        <div className="relative space-y-6">
          <h1 className="font-display font-700 text-4xl text-white leading-tight">
            Gérez vos camps<br />
            <span className="text-white/70">sans effort.</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Inscriptions, planning, paiements et communication avec les parents — tout en un seul endroit.
          </p>

          {/* Features list */}
          <div className="space-y-2.5 pt-2">
            {[
              'Gestion complète des participants',
              'Suivi des paiements en temps réel',
              'Planning des activités',
              'Communication avec les familles',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <span className="text-white/75 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Camp Manager · Tous droits réservés
        </p>
      </div>

      {/* Right panel — formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-sage flex items-center justify-center">
              <Tent size={16} className="text-white" />
            </div>
            <span className="font-display font-700 text-lg text-ink">Camp Manager</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-700 text-2xl text-ink mb-1.5">Connexion</h2>
            <p className="text-ink-3 text-sm">Bienvenue, entrez vos identifiants pour continuer.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2 text-ember text-sm bg-ember/8 border border-ember/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-3 mt-6">
            Problème de connexion ? Contactez votre administrateur.
          </p>
        </div>
      </div>
    </div>
  )
}
