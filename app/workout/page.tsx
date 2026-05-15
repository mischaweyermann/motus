'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CIRC = 263.9

function WorkoutPageInner() {
  const router = useRouter()
  const params = useSearchParams()

  const planId = params.get('planId')
  const workoutName = params.get('name') ?? 'Session'
  const workoutType = params.get('type') ?? 'Gym'
  const workoutDuration = Math.max(1, parseInt(params.get('duration') ?? '60') || 60)

  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
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
      const actualMins = elapsed > 0 ? Math.max(1, Math.round(elapsed / 60)) : workoutDuration
      await supabase.from('workout_sessions').insert({
        user_id: user.id,
        name: workoutName,
        type: workoutType,
        duration: actualMins,
        kcal: Math.round(actualMins * 7),
        source: 'manual',
        completed_at: new Date().toISOString(),
      })
      if (planId) {
        await supabase.from('planned_workouts').update({ completed: true }).eq('id', planId)
      }
    }
    router.push('/complete')
  }

  const totalSecs = workoutDuration * 60
  const progress = Math.min(1, elapsed / totalSecs)
  const dashOffset = CIRC * (1 - progress)
  const mins = Math.floor(elapsed / 60)
  const secs = (elapsed % 60).toString().padStart(2, '0')
  const goalMins = Math.floor((totalSecs - elapsed) / 60)
  const goalSecs = ((totalSecs - elapsed) % 60).toString().padStart(2, '0')
  const finished = elapsed >= totalSecs

  return (
    <div className="page" style={{ paddingBottom: 32 }}>

      <div className="workout-header">
        <Link href="/today" className="workout-header__btn" aria-label="Zurück" style={{ transform: 'scaleX(-1)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </Link>
        <span className="workout-header__label">Session</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="workout-title-area">
        <div className="workout-title-area__eyebrow">{workoutType}</div>
        <div className="workout-title-area__title">{workoutName}</div>
        <div className="workout-title-area__sub">{workoutDuration} min geplant</div>
      </div>

      <div className="timer-card">
        <div className="ring">
          <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="52" cy="52" r="42" stroke="rgba(242,237,227,0.14)" strokeWidth="10" fill="none"/>
            <circle
              cx="52" cy="52" r="42"
              stroke={finished ? '#5E8A4C' : '#C24B2E'}
              strokeWidth="10" fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="ring__center">
            <div className="timer-card__ring-label">
              <div className="timer-card__time">{mins}:{secs}</div>
              <div className="timer-card__time-sub">
                {finished ? 'Fertig!' : `−${goalMins}:${goalSecs}`}
              </div>
            </div>
          </div>
        </div>

        <div className="timer-card__info">
          <div className="timer-card__cur-label">Verstrichene Zeit</div>
          <div className="timer-card__cur-value">{mins} min {secs} s</div>
          <div className="timer-card__actions">
            <button
              className="timer-card__play-btn"
              onClick={() => setRunning(r => !r)}
              disabled={finished}
            >
              {running
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="2"><rect x="7" y="5" width="3" height="14" rx="1"/><rect x="14" y="5" width="3" height="14" rx="1"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="#FAF7F1" stroke="none"><path d="M7 5l12 7-12 7z"/></svg>
              }
              {running ? 'Pause' : elapsed > 0 ? 'Weiter' : 'Start'}
            </button>
            <button
              className="timer-card__extra-btn"
              onClick={() => { setRunning(false); setElapsed(0); showToast('Timer zurückgesetzt') }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <button className="btn btn--ink btn--lg" onClick={handleComplete} disabled={saving}>
          {saving ? 'Speichern…' : 'Session abschließen'}
        </button>
      </div>

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <Suspense>
      <WorkoutPageInner />
    </Suspense>
  )
}
