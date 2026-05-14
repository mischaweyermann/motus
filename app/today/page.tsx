'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

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

function estimateKcal(sport: string, mins: number, intensity: string): number {
  const perMin: Record<string, number> = {
    gym: 6, run: 10, cycle: 8, ride: 8, tennis: 7, other: 5,
  }
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

export default function TodayPage() {
  const [dateStr, setDateStr] = useState('Dienstag · 14 Mai')
  const [firstName, setFirstName] = useState('Du')
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
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('name').eq('id', user.id).single().then(({ data }) => {
        if (data?.name) setFirstName(data.name.split(' ')[0])
      })
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
    }
    setSaving(false)
    setLogOpen(false)
    showToast('Session gespeichert')
  }

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

        <div className="hero-session-card">
          <div className="hero-session-card__mark">
            <svg width="140" height="178" viewBox="0 0 16.944 21.548" fill="currentColor">
              <path transform="translate(3.632 5.215)" fillRule="nonzero" d="M 1.553 0.876 C 5.526 -0.938 6.276 0.562 7.821 0.973 C 9.367 1.384 11.723 1.851 11.723 1.851 C 12.232 1.949 12.561 2.14 12.561 3.342 C 12.561 4.543 8.784 4.507 7.213 5.17 C 5.899 5.724 8.193 7.755 8.561 8.152 C 9.974 9.679 11.525 11.124 12.796 12.758 C 13.82 14.075 13.329 16.271 11.237 15.79 C 9.557 15.15 7.829 14.245 6.13 13.706 C 4.497 13.084 4.637 15.897 3.715 16.248 C 1.429 17.119 -0.456 11.062 0.127 9.557 C 0.804 7.806 3.022 9.759 4.274 8.995 C 4.986 8.56 3.974 7.548 3.666 7.172 C 2.33 5.676 -2.421 2.689 1.553 0.876 Z"/>
              <path fillRule="nonzero" d="M 2.24 0.079 C 3.808 -0.293 5.38 0.68 5.747 2.248 C 6.114 3.817 5.137 5.385 3.567 5.748 C 2.003 6.108 0.443 5.136 0.077 3.574 C -0.288 2.013 0.679 0.449 2.24 0.079 Z"/>
            </svg>
          </div>
          <div className="hero-session-card__content">
            <div className="hero-session-card__eyebrow">Heute · Strength A</div>
            <div className="hero-session-card__title">Push · Upper Body</div>
            <div className="hero-session-card__meta">
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>42 min</span>
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>6 lifts</span>
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3s4 4 4 8a4 4 0 11-8 0c0-2 1-3 1-3s-3 1-3 5a6 6 0 0012 0c0-6-6-10-6-10z"/></svg>Mittel</span>
            </div>
            <div className="hero-session-card__actions">
              <Link href="/workout" className="btn btn--primary btn--md">
                Session starten
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <button className="btn btn--ghost btn--md" style={{ color: 'rgba(242,237,227,0.75)' }} onClick={() => showToast('Session verschoben')}>
                Verschieben
              </button>
            </div>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-tile stat-tile--cream">
            <div className="stat-tile__head">
              <span className="stat-tile__eyebrow">Heute</span>
              <span className="stat-tile__accent">+12%</span>
            </div>
            <div className="stat-tile__value">8,420</div>
            <div className="stat-tile__sub">Steps · Ziel 7,500</div>
            <div className="stat-tile__bar"><div className="stat-tile__bar-fill" style={{ width: '90%' }}></div></div>
          </div>
          <div className="stat-tile stat-tile--ink">
            <div className="stat-tile__head">
              <span className="stat-tile__eyebrow">Diese Woche</span>
            </div>
            <div className="stat-tile__value">
              3<span className="stat-tile__unit" style={{ color: '#C24B2E' }}>/</span>
              <span style={{ fontSize: 42, fontWeight: 800 }}>5</span>
            </div>
            <div className="stat-tile__sub">Sessions on plan</div>
            <div className="stat-tile__bar"><div className="stat-tile__bar-fill" style={{ width: '60%' }}></div></div>
          </div>
        </div>

        <div className="sports-section">
          <div className="section-header">
            <div className="section-header__title">Deine Sportarten</div>
            <button className="section-header__action">Anpassen</button>
          </div>
          <div className="sport-chips">
            {[
              { variant: 'clay', name: 'Gym', meta: 'Heute', icon: 'gym' },
              { variant: 'ink', name: 'Tennis', meta: 'Mi', icon: 'tennis' },
              { variant: 'cream', name: 'Cycle', meta: 'Fr', icon: 'cycle' },
              { variant: 'outline', name: 'Run', meta: 'Sa', icon: 'run' },
            ].map(chip => (
              <div key={chip.name} className={`sport-chip sport-chip--${chip.variant}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <SportIcon id={chip.icon} />
                </svg>
                <div>
                  <div className="sport-chip__name">{chip.name}</div>
                  <div className="sport-chip__meta">{chip.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="upcoming-section">
          <div className="upcoming-section__header">Kommende Woche</div>
          <div className="upcoming-section__list">
            {[
              { icon: 'tennis', iconClass: 'ink',     title: 'Tennis · Court 4',  sub: 'Mi · 18:00 · mit Jonas' },
              { icon: 'cycle',  iconClass: 'clay',    title: 'Endurance Ride',    sub: 'Fr · 07:30 · 90 min · Z2' },
              { icon: 'run',    iconClass: 'success', title: 'Long Run',          sub: 'Sa · 09:00 · 14 km' },
            ].map(item => (
              <div key={item.title} className="list-row">
                <div className={`list-row__icon list-row__icon--${item.iconClass}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <SportIcon id={item.icon} />
                  </svg>
                </div>
                <div className="list-row__content">
                  <div className="list-row__title">{item.title}</div>
                  <div className="list-row__sub">{item.sub}</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
              </div>
            ))}
          </div>
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
