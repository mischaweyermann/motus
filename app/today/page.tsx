'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const DAY_SHORT = ['So','Mo','Di','Mi','Do','Fr','Sa']

const LOG_SPORTS = [
  { id: 'gym',    label: 'Gym' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'cycle',  label: 'Cycle' },
  { id: 'run',    label: 'Run' },
  { id: 'ride',   label: 'Ride' },
  { id: 'other',  label: 'Sonstiges' },
]

const SPORT_DEFAULT_NAMES: Record<string, string> = {
  gym: 'Gym Session', tennis: 'Tennis', cycle: 'Radfahrt',
  run: 'Lauf', ride: 'Ausfahrt', other: 'Training',
}

const SPORT_TYPE_MAP: Record<string, string> = {
  gym: 'Gym', tennis: 'Tennis', cycle: 'Cycle',
  run: 'Run', ride: 'Cycle', other: 'Sonstiges',
}

const TYPE_TO_ICON: Record<string, string> = {
  Gym: 'gym', Tennis: 'tennis', Cycle: 'cycle', Run: 'run', Sonstiges: 'other',
}

function estimateKcal(sport: string, mins: number, intensity: string): number {
  const perMin: Record<string, number> = { gym: 6, run: 10, cycle: 8, ride: 8, tennis: 7, other: 5 }
  const mult = { light: 0.8, medium: 1.0, intense: 1.3 }[intensity] ?? 1.0
  return Math.round((perMin[sport] ?? 5) * mins * mult)
}

function SportIcon({ id }: { id: string }) {
  if (id === 'gym') return <path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/>
  if (id === 'tennis') return <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z"/></>
  if (id === 'cycle' || id === 'ride') return <><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h3l3 6M10 8l-1-3h3"/></>
  if (id === 'run') return <><circle cx="14" cy="4.5" r="2"/><path d="M9 21l1.5-6L7 12.5l2-6 3 2.5 3.5-1M14 21l-2-6 3-3.5"/></>
  return <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>
}

type PlannedWorkout = {
  id: string
  name: string
  type: string
  scheduled_date: string
  scheduled_time: string | null
  duration: number | null
}

function formatPlanSub(plan: PlannedWorkout): string {
  const parts: string[] = []
  if (plan.scheduled_time) parts.push(plan.scheduled_time.slice(0, 5) + ' Uhr')
  if (plan.duration) parts.push(plan.duration + ' min')
  return parts.join(' · ')
}

export default function TodayPage() {
  const [dateStr, setDateStr] = useState('')
  const [firstName, setFirstName] = useState('Du')
  const [weekSessions, setWeekSessions] = useState<number | null>(null)
  const [todayPlan, setTodayPlan] = useState<PlannedWorkout | null | undefined>(undefined)
  const [upcomingPlans, setUpcomingPlans] = useState<PlannedWorkout[]>([])
  const [recentSports, setRecentSports] = useState<string[]>([])

  const [logOpen, setLogOpen] = useState(false)
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [duration, setDuration] = useState(30)
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'intense'>('medium')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    const now = new Date()
    setDateStr(`${DAYS[now.getDay()]} · ${now.getDate()} ${MONTHS[now.getMonth()]}`)

    const todayStr = now.toISOString().slice(0, 10)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const startStr = startOfWeek.toISOString().slice(0, 10)

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const [
        { data: profile },
        { count: weekCount },
        { data: plans },
        { data: sessions },
      ] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', user.id).single(),
        supabase.from('workout_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('completed_at', startStr + 'T00:00:00'),
        supabase.from('planned_workouts')
          .select('id, name, type, scheduled_date, scheduled_time, duration')
          .eq('user_id', user.id)
          .eq('completed', false)
          .gte('scheduled_date', todayStr)
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true, nullsFirst: false })
          .limit(5),
        supabase.from('workout_sessions')
          .select('type')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(20),
      ])

      if (profile?.name) {
        setFirstName(profile.name.split(' ')[0])
      } else if (user.email) {
        setFirstName(user.email.split('@')[0])
      }
      setWeekSessions(weekCount ?? 0)

      if (plans !== null) {
        setTodayPlan(plans.find(p => p.scheduled_date === todayStr) ?? null)
        setUpcomingPlans(plans.filter(p => p.scheduled_date !== todayStr).slice(0, 3))
      } else {
        setTodayPlan(null)
        setUpcomingPlans([])
      }

      if (sessions) {
        const types = [...new Set(sessions.map(s => s.type))] as string[]
        setRecentSports(types.slice(0, 4))
      }
    })
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }

  function openLog() {
    setSelectedSport(null)
    setSessionName('')
    setDuration(30)
    setIntensity('medium')
    setNotes('')
    setLogOpen(true)
  }

  function selectSport(id: string) {
    setSelectedSport(id)
    if (!sessionName) setSessionName(SPORT_DEFAULT_NAMES[id] ?? '')
  }

  async function handleSave() {
    if (!selectedSport) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const name = sessionName.trim() || SPORT_DEFAULT_NAMES[selectedSport] || 'Training'
      await supabase.from('workout_sessions').insert({
        user_id: user.id,
        name,
        type: SPORT_TYPE_MAP[selectedSport],
        duration,
        kcal: estimateKcal(selectedSport, duration, intensity),
        notes: notes.trim() || null,
        source: 'manual',
        completed_at: new Date().toISOString(),
      })
      setWeekSessions(w => (w ?? 0) + 1)
      const newType = SPORT_TYPE_MAP[selectedSport]
      if (!recentSports.includes(newType)) {
        setRecentSports(s => [...s, newType].slice(0, 4))
      }
    }
    setSaving(false)
    setLogOpen(false)
    showToast('Session gespeichert')
  }

  const dataLoaded = todayPlan !== undefined

  return (
    <>
      <div className="page">

        <div className="app-header">
          <div className="app-header__text">
            <div className="app-header__eyebrow">{dateStr}</div>
            <div className="app-header__title">
              Guten Morgen,<br />
              <span style={{ color: '#C24B2E' }}>{firstName}.</span>
            </div>
          </div>
          <button className="app-header__action" aria-label="Benachrichtigungen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 16v-5a6 6 0 10-12 0v5l-2 3h16zM10 20a2 2 0 004 0"/>
            </svg>
          </button>
        </div>

        {/* Today's planned workout or empty state */}
        {dataLoaded && (
          todayPlan ? (
            <div className="hero-session-card">
              <div className="hero-session-card__mark">
                <svg width="140" height="178" viewBox="0 0 16.944 21.548" fill="currentColor">
                  <path transform="translate(3.632 5.215)" fillRule="nonzero" d="M 1.553 0.876 C 5.526 -0.938 6.276 0.562 7.821 0.973 C 9.367 1.384 11.723 1.851 11.723 1.851 C 12.232 1.949 12.561 2.14 12.561 3.342 C 12.561 4.543 8.784 4.507 7.213 5.17 C 5.899 5.724 8.193 7.755 8.561 8.152 C 9.974 9.679 11.525 11.124 12.796 12.758 C 13.82 14.075 13.329 16.271 11.237 15.79 C 9.557 15.15 7.829 14.245 6.13 13.706 C 4.497 13.084 4.637 15.897 3.715 16.248 C 1.429 17.119 -0.456 11.062 0.127 9.557 C 0.804 7.806 3.022 9.759 4.274 8.995 C 4.986 8.56 3.974 7.548 3.666 7.172 C 2.33 5.676 -2.421 2.689 1.553 0.876 Z"/>
                  <path fillRule="nonzero" d="M 2.24 0.079 C 3.808 -0.293 5.38 0.68 5.747 2.248 C 6.114 3.817 5.137 5.385 3.567 5.748 C 2.003 6.108 0.443 5.136 0.077 3.574 C -0.288 2.013 0.679 0.449 2.24 0.079 Z"/>
                </svg>
              </div>
              <div className="hero-session-card__content">
                <div className="hero-session-card__eyebrow">Heute · {todayPlan.type}</div>
                <div className="hero-session-card__title">{todayPlan.name}</div>
                <div className="hero-session-card__meta">
                  {todayPlan.duration && (
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      {todayPlan.duration} min
                    </span>
                  )}
                  {todayPlan.scheduled_time && (
                    <span>{todayPlan.scheduled_time.slice(0, 5)} Uhr</span>
                  )}
                </div>
                <div className="hero-session-card__actions">
                  <Link
                    href={`/workout?planId=${todayPlan.id}&name=${encodeURIComponent(todayPlan.name)}&type=${encodeURIComponent(todayPlan.type)}&duration=${todayPlan.duration ?? 60}`}
                    className="btn btn--primary btn--md"
                  >
                    Session starten
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </Link>
                  <button className="btn btn--ghost btn--md" style={{ color: 'rgba(242,237,227,0.75)' }} onClick={() => showToast('Session verschoben')}>
                    Verschieben
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-hero-card">
              <div className="empty-hero-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(242,237,227,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="3"/>
                  <path d="M3 9h18M8 3v4M16 3v4M12 13v4M10 15h4"/>
                </svg>
              </div>
              <div className="empty-hero-card__text">Kein Workout für heute geplant</div>
              <Link href="/plan" className="btn btn--primary btn--md">
                Workout planen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
            </div>
          )
        )}

        <div className="stat-row">
          {/* Steps – not yet connected */}
          <div className="stat-tile stat-tile--cream">
            <div className="stat-tile__head">
              <span className="stat-tile__eyebrow">Schritte</span>
            </div>
            <div className="stat-tile__value" style={{ fontSize: 28 }}>—</div>
            <div className="stat-tile__sub" style={{ marginTop: 4 }}>
              <Link href="/profile" style={{ color: '#C24B2E', textDecoration: 'none', fontWeight: 700 }}>
                Health verbinden →
              </Link>
            </div>
          </div>

          {/* Real session count this week */}
          <div className="stat-tile stat-tile--ink">
            <div className="stat-tile__head">
              <span className="stat-tile__eyebrow">Diese Woche</span>
            </div>
            <div className="stat-tile__value">
              {weekSessions ?? '—'}
            </div>
            <div className="stat-tile__sub">Sessions</div>
            {weekSessions !== null && weekSessions > 0 && (
              <div className="stat-tile__bar">
                <div className="stat-tile__bar-fill" style={{ width: `${Math.min(100, weekSessions * 20)}%` }}></div>
              </div>
            )}
          </div>
        </div>

        {/* Sports derived from recent sessions */}
        <div className="sports-section">
          <div className="section-header">
            <div className="section-header__title">Deine Sportarten</div>
            <button className="section-header__action" onClick={openLog}>+ Loggen</button>
          </div>
          {recentSports.length > 0 ? (
            <div className="sport-chips">
              {recentSports.map(type => (
                <div key={type} className="sport-chip sport-chip--cream">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <SportIcon id={TYPE_TO_ICON[type] ?? 'other'} />
                  </svg>
                  <div>
                    <div className="sport-chip__name">{type}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-inline">
              Noch keine Sportarten — logg dein erstes Workout!
            </div>
          )}
        </div>

        {/* Upcoming planned workouts */}
        <div className="upcoming-section">
          <div className="upcoming-section__header">Bevorstehend</div>
          {upcomingPlans.length > 0 ? (
            <div className="upcoming-section__list">
              {upcomingPlans.map(plan => {
                const d = new Date(plan.scheduled_date + 'T12:00:00')
                return (
                  <div key={plan.id} className="list-row">
                    <div className="list-row__icon list-row__icon--ink">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <SportIcon id={TYPE_TO_ICON[plan.type] ?? 'other'} />
                      </svg>
                    </div>
                    <div className="list-row__content">
                      <div className="list-row__title">{plan.name}</div>
                      <div className="list-row__sub">
                        {DAY_SHORT[d.getDay()]}
                        {formatPlanSub(plan) ? ' · ' + formatPlanSub(plan) : ''}
                      </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state-inline">
              Keine geplanten Workouts.{' '}
              <Link href="/plan" style={{ color: '#C24B2E', textDecoration: 'none', fontWeight: 700 }}>
                Jetzt planen →
              </Link>
            </div>
          )}
        </div>

      </div>

      <BottomNav onFabClick={openLog} />

      {logOpen && (
        <div className="log-sheet-scrim" onClick={() => setLogOpen(false)}>
          <div className="log-sheet" onClick={e => e.stopPropagation()}>
            <div className="log-sheet__handle"></div>
            <div className="log-sheet__eyebrow">Manuell loggen</div>
            <div className="log-sheet__title">Was hast du gemacht?</div>

            <div className="log-sheet__grid">
              {LOG_SPORTS.map(s => (
                <button
                  key={s.id}
                  className={`log-sheet__sport-btn${selectedSport === s.id ? ' selected' : ''}`}
                  onClick={() => selectSport(s.id)}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <SportIcon id={s.id} />
                  </svg>
                  {s.label}
                </button>
              ))}
            </div>

            <input
              className="log-sheet__input"
              type="text"
              placeholder="Name (z.B. Morgenrunde)"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
            />

            <div className="log-sheet__field">
              <span className="log-sheet__field-label">Dauer</span>
              <div className="log-sheet__duration-ctrl">
                <button onClick={() => setDuration(d => Math.max(5, d - 5))}>−</button>
                <span>{duration} min</span>
                <button onClick={() => setDuration(d => d + 5)}>+</button>
              </div>
            </div>

            <div className="log-sheet__field">
              <span className="log-sheet__field-label">Intensität</span>
              <div className="log-sheet__intensity">
                {(['light', 'medium', 'intense'] as const).map((v, i) => (
                  <button key={v} className={intensity === v ? 'active' : ''} onClick={() => setIntensity(v)}>
                    {['Leicht', 'Mittel', 'Intensiv'][i]}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="log-sheet__input"
              placeholder="Notiz (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />

            <div className="log-sheet__actions">
              <button
                className="btn btn--primary btn--md"
                onClick={handleSave}
                disabled={saving || !selectedSport}
                style={{ flex: 1 }}
              >
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
              <button className="btn btn--secondary btn--md" onClick={() => setLogOpen(false)}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </>
  )
}
