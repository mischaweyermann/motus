'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const TOTAL = 60
const CIRC = 263.9

type SetState = 'done' | 'active' | 'next'
const SETS: { num: number; reps: number; kg: number; state: SetState }[] = [
  { num: 1, reps: 8, kg: 72.5, state: 'done' },
  { num: 2, reps: 8, kg: 72.5, state: 'done' },
  { num: 3, reps: 8, kg: 72.5, state: 'active' },
  { num: 4, reps: 8, kg: 72.5, state: 'next' },
]

export default function WorkoutPage() {
  const router = useRouter()
  const [remaining, setRemaining] = useState(37)
  const [running, setRunning] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 0) { setRunning(false); return 0 }
          return r - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  function showToast(msg: string) {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }

  async function handleComplete() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('workout_sessions').insert({
        user_id: user.id,
        name: 'Push · Upper Body',
        type: 'Gym',
        duration: 42,
        kcal: 320,
        completed_at: new Date().toISOString(),
      })
    }
    router.push('/complete')
  }

  const dashOffset = CIRC * (1 - remaining / TOTAL)
  const mins = Math.floor(remaining / 60)
  const secs = (remaining % 60).toString().padStart(2, '0')
  const doneSets = SETS.filter(s => s.state === 'done').length

  return (
    <div className="page" style={{ paddingBottom: 32 }}>

      <div className="workout-header">
        <Link href="/today" className="workout-header__btn" aria-label="Zurück" style={{ transform: 'scaleX(-1)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </Link>
        <span className="workout-header__label">Session</span>
        <button className="workout-header__btn" aria-label="Einstellungen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>
          </svg>
        </button>
      </div>

      <div className="workout-title-area">
        <div className="workout-title-area__eyebrow">Push · Upper Body</div>
        <div className="workout-title-area__title">Bench Press</div>
        <div className="workout-title-area__sub">Übung 2 von 6 · 60s Pause</div>
      </div>

      <div className="timer-card">
        <div className="ring">
          <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="52" cy="52" r="42" stroke="rgba(242,237,227,0.14)" strokeWidth="10" fill="none"/>
            <circle cx="52" cy="52" r="42" stroke="#C24B2E" strokeWidth="10" fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="ring__center">
            <div className="timer-card__ring-label">
              <div className="timer-card__time">{mins}:{secs}</div>
              <div className="timer-card__time-sub">von 60s</div>
            </div>
          </div>
        </div>

        <div className="timer-card__info">
          <div className="timer-card__cur-label">Aktueller Satz</div>
          <div className="timer-card__cur-value">8 × 72.5 kg</div>
          <div className="timer-card__actions">
            <button className="timer-card__play-btn" onClick={() => setRunning(r => !r)}>
              {running
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="2"><rect x="7" y="5" width="3" height="14" rx="1"/><rect x="14" y="5" width="3" height="14" rx="1"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="#FAF7F1" stroke="none"><path d="M7 5l12 7-12 7z"/></svg>
              }
              {running ? 'Pause' : 'Weiter'}
            </button>
            <button className="timer-card__extra-btn" onClick={() => { setRemaining(r => Math.min(r + 10, 999)); showToast('+10s hinzugefügt') }}>
              +10s
            </button>
          </div>
        </div>
      </div>

      <div className="sets-section">
        <div className="sets-section__head">
          <div className="sets-section__title">Sätze</div>
          <span className="sets-section__sub">{doneSets} von {SETS.length} erledigt</span>
        </div>
        {SETS.map(set => (
          <div key={set.num} className={`set-row set-row--${set.state}`}>
            <span className="set-row__num">{set.num}</span>
            <span className="set-row__reps">{set.reps} × {set.kg} kg</span>
            {set.state === 'done' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {set.state === 'active' && <span className="set-row__badge">Jetzt</span>}
          </div>
        ))}
      </div>

      <div className="next-exercise">
        <div className="next-exercise__label">Nächste Übung</div>
        <div className="list-row">
          <div className="list-row__icon list-row__icon--cream300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/>
            </svg>
          </div>
          <div className="list-row__content">
            <div className="list-row__title">Incline DB Press</div>
            <div className="list-row__sub">3 × 10 · 22.5 kg</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <button className="btn btn--ink btn--lg" onClick={handleComplete} disabled={saving}>
          {saving ? 'Speichern…' : 'Session abschließen'}
        </button>
      </div>

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
