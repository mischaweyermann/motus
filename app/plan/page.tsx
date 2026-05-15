'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

const DAY_SHORT = ['So','Mo','Di','Mi','Do','Fr','Sa']
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

const PLAN_SPORTS = [
  { id: 'gym',    label: 'Gym',       type: 'Gym' },
  { id: 'tennis', label: 'Tennis',    type: 'Tennis' },
  { id: 'cycle',  label: 'Cycle',     type: 'Cycle' },
  { id: 'run',    label: 'Run',       type: 'Run' },
  { id: 'ride',   label: 'Ride',      type: 'Cycle' },
  { id: 'other',  label: 'Sonstiges', type: 'Sonstiges' },
]

const SPORT_DEFAULT_NAMES: Record<string, string> = {
  gym: 'Gym Session', tennis: 'Tennis', cycle: 'Radfahrt',
  run: 'Lauf', ride: 'Ausfahrt', other: 'Training',
}

const TYPE_TO_ICON: Record<string, string> = {
  Gym: 'gym', Tennis: 'tennis', Cycle: 'cycle', Run: 'run', Sonstiges: 'other',
}

const TYPE_COLOR: Record<string, string> = {
  Gym: 'ink', Tennis: 'ink', Cycle: 'clay', Run: 'success', Sonstiges: 'ink',
}

function SportIcon({ id }: { id: string }) {
  if (id === 'gym') return <path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/>
  if (id === 'tennis') return <><circle cx="9" cy="5" r="2"/><path d="M9 7v6M9 13l-2 7M9 13l3 6M9.5 9l5.5-3.5"/><circle cx="17" cy="4" r="2.5"/></>
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
  notes: string | null
  completed: boolean
}

type WeekDay = { date: Date; dateStr: string }

function getWeekDays(): WeekDay[] {
  const today = new Date()
  const dow = (today.getDay() + 6) % 7
  const mon = new Date(today)
  mon.setDate(today.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return { date: d, dateStr: d.toISOString().slice(0, 10) }
  })
}

function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default function PlanPage() {
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [todayStr, setTodayStr] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [plans, setPlans] = useState<PlannedWorkout[]>([])
  const [loaded, setLoaded] = useState(false)

  const [planOpen, setPlanOpen] = useState(false)
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [planName, setPlanName] = useState('')
  const [planDay, setPlanDay] = useState('')
  const [planTime, setPlanTime] = useState('')
  const [planDuration, setPlanDuration] = useState(60)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const loadPlans = useCallback(async (from: string, to: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoaded(true); return }
    const { data } = await supabase.from('planned_workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true, nullsFirst: false })
    setPlans(data ?? [])
    setLoaded(true)
  }, [])

  useEffect(() => {
    const days = getWeekDays()
    setWeekDays(days)
    const today = new Date().toISOString().slice(0, 10)
    setTodayStr(today)
    setSelectedDay(today)
    setPlanDay(today)
    loadPlans(days[0].dateStr, days[6].dateStr)
  }, [loadPlans])

  function showToast(msg: string) {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }

  function openPlanDialog(dayStr?: string) {
    setSelectedSport(null)
    setPlanName('')
    setPlanDay(dayStr ?? todayStr)
    setPlanTime('')
    setPlanDuration(60)
    setPlanOpen(true)
  }

  function selectSport(id: string) {
    setSelectedSport(id)
    if (!planName) setPlanName(SPORT_DEFAULT_NAMES[id] ?? '')
  }

  async function handleSavePlan() {
    if (!selectedSport) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const sport = PLAN_SPORTS.find(s => s.id === selectedSport)!
      const name = planName.trim() || SPORT_DEFAULT_NAMES[selectedSport] || 'Training'
      const { data, error } = await supabase.from('planned_workouts').insert({
        user_id: user.id,
        name,
        type: sport.type,
        scheduled_date: planDay,
        scheduled_time: planTime || null,
        duration: planDuration,
        completed: false,
      }).select().single()
      if (!error && data) {
        setPlans(p =>
          [...p, data as PlannedWorkout].sort((a, b) => {
            if (a.scheduled_date !== b.scheduled_date) return a.scheduled_date.localeCompare(b.scheduled_date)
            return (a.scheduled_time ?? '').localeCompare(b.scheduled_time ?? '')
          })
        )
      }
    }
    setSaving(false)
    setPlanOpen(false)
    showToast('Workout geplant ✓')
  }

  async function deletePlan(id: string) {
    const supabase = createClient()
    await supabase.from('planned_workouts').delete().eq('id', id)
    setPlans(p => p.filter(x => x.id !== id))
    showToast('Workout entfernt')
  }

  const selectedDayPlans = plans.filter(p => p.scheduled_date === selectedDay)
  const otherPlans = plans.filter(p => p.scheduled_date !== selectedDay)

  const now = new Date()
  const weekNum = isoWeekNumber(now)
  const monthName = MONTHS_DE[now.getMonth()]

  const selectedWeekDay = weekDays.find(d => d.dateStr === selectedDay)
  const selectedDayLabel = selectedDay === todayStr
    ? 'Heute'
    : selectedWeekDay
      ? `${DAY_SHORT[selectedWeekDay.date.getDay()]}, ${selectedWeekDay.date.getDate()}. ${MONTHS_DE[selectedWeekDay.date.getMonth()]}`
      : ''

  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">{monthName} · Woche {weekNum}</div>
          <div className="app-header__title">Dein Plan</div>
        </div>
        <button className="app-header__action" onClick={() => openPlanDialog()} aria-label="Workout hinzufügen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Dynamic day strip */}
      <div className="day-strip">
        {weekDays.map(({ date, dateStr }) => {
          const hasPlans = plans.some(p => p.scheduled_date === dateStr)
          const isToday = dateStr === todayStr
          const isPast = dateStr < todayStr
          const isSelected = dateStr === selectedDay
          let state = 'default'
          if (isSelected) state = isToday ? 'today' : 'done'
          else if (isToday) state = 'today'
          return (
            <div
              key={dateStr}
              className={`day-pill day-pill--${state}`}
              onClick={() => setSelectedDay(dateStr)}
              style={{ cursor: 'pointer' }}
            >
              <span className="day-pill__day">{DAY_SHORT[date.getDay()]}</span>
              <span className="day-pill__date">{date.getDate()}</span>
              <span
                className="day-pill__dot"
                style={{
                  background: hasPlans ? '#C24B2E' : '#B7AB91',
                  opacity: hasPlans ? 1 : isPast ? 0.2 : 0.35,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Selected day */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 12 }}>
          {selectedDayLabel}
        </div>

        {!loaded ? (
          <div style={{ color: '#8C8270', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Laden…</div>
        ) : selectedDayPlans.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedDayPlans.map(plan => (
              <div key={plan.id} className="plan-session-card">
                <div className="plan-session-card__top">
                  <div className="plan-session-card__icon" style={{ background: plan.type === 'Cycle' ? '#C24B2E' : plan.type === 'Run' ? '#5E8A4C' : '#1F1F1F' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <SportIcon id={TYPE_TO_ICON[plan.type] ?? 'other'} />
                    </svg>
                  </div>
                  <div className="plan-session-card__info">
                    <div className="plan-session-card__title">{plan.name}</div>
                    <div className="plan-session-card__sub">
                      {[
                        plan.scheduled_time ? plan.scheduled_time.slice(0, 5) + ' Uhr' : null,
                        plan.duration ? plan.duration + ' min' : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Link
                      href={`/workout?planId=${plan.id}&name=${encodeURIComponent(plan.name)}&type=${encodeURIComponent(plan.type)}&duration=${plan.duration ?? 60}`}
                      className="btn btn--primary btn--sm"
                    >
                      Start
                    </Link>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C8270', padding: 4 }}
                      aria-label="Löschen"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="plan-empty-day">
            <div className="plan-empty-day__text">
              {selectedDay < todayStr ? 'Kein Workout war geplant' : 'Kein Workout geplant'}
            </div>
            {selectedDay >= todayStr && (
              <button className="btn btn--secondary btn--sm" onClick={() => openPlanDialog(selectedDay)}>
                + Workout hinzufügen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rest of week */}
      {otherPlans.length > 0 && (
        <div className="week-section">
          <div className="week-section__header">Diese Woche</div>
          <div className="week-section__list">
            {otherPlans.map(plan => {
              const d = new Date(plan.scheduled_date + 'T12:00:00')
              return (
                <div key={plan.id} className="list-row">
                  <div className={`list-row__icon list-row__icon--${TYPE_COLOR[plan.type] ?? 'ink'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <SportIcon id={TYPE_TO_ICON[plan.type] ?? 'other'} />
                    </svg>
                  </div>
                  <div className="list-row__content">
                    <div className="list-row__title">{plan.name}</div>
                    <div className="list-row__sub">
                      {DAY_SHORT[d.getDay()]}
                      {plan.scheduled_time ? ` · ${plan.scheduled_time.slice(0, 5)}` : ''}
                      {plan.duration ? ` · ${plan.duration} min` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDay(plan.scheduled_date)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <BottomNav />

      {/* Plan dialog */}
      {planOpen && (
        <div className="log-sheet-scrim" onClick={() => setPlanOpen(false)}>
          <div className="log-sheet" onClick={e => e.stopPropagation()}>
            <div className="log-sheet__handle"></div>
            <div className="log-sheet__eyebrow">Workout planen</div>
            <div className="log-sheet__title">Was möchtest du tun?</div>

            <div className="log-sheet__grid">
              {PLAN_SPORTS.map(s => (
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
              value={planName}
              onChange={e => setPlanName(e.target.value)}
            />

            <div className="log-sheet__field">
              <span className="log-sheet__field-label">Tag</span>
              <select
                className="log-sheet__select"
                value={planDay}
                onChange={e => setPlanDay(e.target.value)}
              >
                {weekDays.map(({ date, dateStr }) => (
                  <option key={dateStr} value={dateStr}>
                    {DAY_SHORT[date.getDay()]} {date.getDate()}. {MONTHS_DE[date.getMonth()]}
                  </option>
                ))}
              </select>
            </div>

            <div className="log-sheet__field">
              <span className="log-sheet__field-label">Uhrzeit</span>
              <input
                className="log-sheet__time-input"
                type="time"
                value={planTime}
                onChange={e => setPlanTime(e.target.value)}
              />
            </div>

            <div className="log-sheet__field">
              <span className="log-sheet__field-label">Dauer</span>
              <div className="log-sheet__duration-ctrl">
                <button onClick={() => setPlanDuration(d => Math.max(5, d - 5))}>−</button>
                <span>{planDuration} min</span>
                <button onClick={() => setPlanDuration(d => d + 5)}>+</button>
              </div>
            </div>

            <div className="log-sheet__actions">
              <button
                className="btn btn--primary btn--md"
                onClick={handleSavePlan}
                disabled={saving || !selectedSport}
                style={{ flex: 1 }}
              >
                {saving ? 'Speichern…' : 'Planen'}
              </button>
              <button className="btn btn--secondary btn--md" onClick={() => setPlanOpen(false)}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
