'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register'

export default function OnboardingPage() {
  const [mode, setMode] = useState<Mode>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/today')
    router.refresh()
  }

  return (
    <div className="onboarding">
      <div className="onboarding__hero">
        <div className="onboarding__blob onboarding__blob--1"></div>
        <div className="onboarding__blob onboarding__blob--2"></div>
        <div className="onboarding__logo">
          <svg className="onboarding__logo-mark" width="28" height="35.6" viewBox="0 0 16.944 21.548" fill="currentColor">
            <path transform="translate(3.632 5.215)" fillRule="nonzero" d="M 1.553 0.876 C 5.526 -0.938 6.276 0.562 7.821 0.973 C 9.367 1.384 11.723 1.851 11.723 1.851 C 12.232 1.949 12.561 2.14 12.561 3.342 C 12.561 4.543 8.784 4.507 7.213 5.17 C 5.899 5.724 8.193 7.755 8.561 8.152 C 9.974 9.679 11.525 11.124 12.796 12.758 C 13.82 14.075 13.329 16.271 11.237 15.79 C 9.557 15.15 7.829 14.245 6.13 13.706 C 4.497 13.084 4.637 15.897 3.715 16.248 C 1.429 17.119 -0.456 11.062 0.127 9.557 C 0.804 7.806 3.022 9.759 4.274 8.995 C 4.986 8.56 3.974 7.548 3.666 7.172 C 2.33 5.676 -2.421 2.689 1.553 0.876 Z"/>
            <path fillRule="nonzero" d="M 2.24 0.079 C 3.808 -0.293 5.38 0.68 5.747 2.248 C 6.114 3.817 5.137 5.385 3.567 5.748 C 2.003 6.108 0.443 5.136 0.077 3.574 C -0.288 2.013 0.679 0.449 2.24 0.079 Z"/>
          </svg>
          <span className="onboarding__logo-text">motus</span>
        </div>
        <h1 className="onboarding__headline">
          Move every<br />day.<br />
          <span className="clay">One plan,<br />every sport.</span>
        </h1>
      </div>

      <div className="onboarding__sheet">
        <p className="onboarding__body">
          {mode === 'register'
            ? 'Tennis, Gym, Ausfahrt — alles in einem Plan. Leg los.'
            : 'Willkommen zurück. Weiter geht\'s.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          {mode === 'register' && (
            <input
              className="auth-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />

          <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
            {loading ? 'Laden…' : mode === 'register' ? 'Konto erstellen' : 'Anmelden'}
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            )}
          </button>
        </form>

        <button className="auth-toggle" onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}>
          {mode === 'register'
            ? <>Schon dabei? <strong>Anmelden</strong></>
            : <>Neu hier? <strong>Konto erstellen</strong></>}
        </button>
      </div>
    </div>
  )
}
