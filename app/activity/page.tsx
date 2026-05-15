'use client'
import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

const TYPE_COLOR: Record<string, string> = {
  Gym: 'ink', Tennis: 'ink', Cycle: 'clay', Run: 'success', Sonstiges: 'ink',
}
const DAY_LABELS = ['So','Mo','Di','Mi','Do','Fr','Sa']
const MONTH_LABELS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

type Filter = '7d' | '1m' | '6m' | '1y'
const FILTERS: { value: Filter; label: string }[] = [
  { value: '7d',  label: '7 Tage' },
  { value: '1m',  label: '1 Mon.' },
  { value: '6m',  label: '6 Mon.' },
  { value: '1y',  label: '1 Jahr' },
]

type Session = {
  id: string; name: string; type: string
  duration: number | null; kcal: number | null
  completed_at: string; source: string | null; notes: string | null
}

function SessionIcon({ type }: { type: string }) {
  if (type === 'Cycle') return <><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h3l3 6M10 8l-1-3h3"/></>
  if (type === 'Tennis') return <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z"/></>
  if (type === 'Run') return <><circle cx="14" cy="4.5" r="2"/><path d="M9 21l1.5-6L7 12.5l2-6 3 2.5 3.5-1M14 21l-2-6 3-3.5"/></>
  return <path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/>
}

function SourceBadge({ source }: { source: string | null }) {
  if (source === 'strava') return <span className="source-badge source-badge--strava">Strava</span>
  return null
}

function getFromDate(filter: Filter): Date {
  const now = new Date()
  if (filter === '7d') { const d = new Date(now); d.setDate(now.getDate() - 6);   d.setHours(0,0,0,0); return d }
  if (filter === '1m') { const d = new Date(now); d.setMonth(now.getMonth() - 1); d.setHours(0,0,0,0); return d }
  if (filter === '6m') { const d = new Date(now); d.setMonth(now.getMonth() - 6); d.setHours(0,0,0,0); return d }
  const d = new Date(now); d.setFullYear(now.getFullYear() - 1); d.setHours(0,0,0,0); return d
}

function getBars(sessions: Session[], filter: Filter): { label: string; mins: number; isCurrent: boolean }[] {
  const now = new Date()

  if (filter === '7d') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i))
      const ds = d.toISOString().slice(0, 10)
      const mins = sessions.filter(s => s.completed_at.slice(0, 10) === ds)
        .reduce((sum, s) => sum + (s.duration ?? 0), 0)
      return { label: DAY_LABELS[d.getDay()], mins, isCurrent: i === 6 }
    })
  }

  if (filter === '1m') {
    return Array.from({ length: 4 }, (_, i) => {
      const end = new Date(now); end.setDate(now.getDate() - i * 7)
      const start = new Date(end); start.setDate(end.getDate() - 6)
      const eStr = end.toISOString().slice(0, 10)
      const sStr = start.toISOString().slice(0, 10)
      const mins = sessions.filter(s => { const d = s.completed_at.slice(0, 10); return d >= sStr && d <= eStr })
        .reduce((sum, s) => sum + (s.duration ?? 0), 0)
      return { label: `${start.getDate()}.`, mins, isCurrent: i === 0 }
    }).reverse()
  }

  const months = filter === '6m' ? 6 : 12
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mins = sessions.filter(s => s.completed_at.slice(0, 7) === mStr)
      .reduce((sum, s) => sum + (s.duration ?? 0), 0)
    return { label: MONTH_LABELS[d.getMonth()], mins, isCurrent: i === months - 1 }
  })
}

const BAR_MAX_H = 58 // px, leaves room for label

export default function ActivityPage() {
  const [filter, setFilter]           = useState<Filter>('7d')
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [loaded, setLoaded]           = useState(false)

  const [selected, setSelected]   = useState<Session | null>(null)
  const [editing, setEditing]     = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editName, setEditName]   = useState('')
  const [editDur, setEditDur]     = useState(30)
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving]       = useState(false)

  const [toast, setToast]               = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('workout_sessions')
        .select('id, name, type, duration, kcal, completed_at, source, notes')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(365)
      setAllSessions(data ?? [])
      setLoaded(true)
    })
  }, [])

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }

  function openSession(s: Session) {
    setSelected(s); setEditing(false); setConfirming(false)
  }

  function startEdit() {
    if (!selected) return
    setEditName(selected.name)
    setEditDur(selected.duration ?? 30)
    setEditNotes(selected.notes ?? '')
    setEditing(true)
  }

  async function handleSaveEdit() {
    if (!selected) return
    setSaving(true)
    const supabase = createClient()
    const patch = { name: editName.trim() || selected.name, duration: editDur, notes: editNotes.trim() || null }
    const { error } = await supabase.from('workout_sessions').update(patch).eq('id', selected.id)
    if (!error) {
      const updated = { ...selected, ...patch }
      setAllSessions(s => s.map(x => x.id === selected.id ? updated : x))
      setSelected(updated); setEditing(false)
      showToast('Session aktualisiert')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!selected) return
    const supabase = createClient()
    await supabase.from('workout_sessions').delete().eq('id', selected.id)
    setAllSessions(s => s.filter(x => x.id !== selected.id))
    setSelected(null)
    showToast('Session gelöscht')
  }

  // Derived data
  const fromDate   = getFromDate(filter)
  const fromStr    = fromDate.toISOString()
  const filtered   = allSessions.filter(s => s.completed_at >= fromStr)
  const totalMins  = filtered.reduce((s, r) => s + (r.duration ?? 0), 0)
  const hours      = Math.floor(totalMins / 60)
  const mins       = totalMins % 60
  const bars       = getBars(filtered, filter)
  const maxMins    = Math.max(...bars.map(b => b.mins), 1)

  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">Deine Trainings</div>
          <div className="app-header__title">Aktivität</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="activity-filter-row">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`activity-filter-chip${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chart card */}
      <div style={{ padding: '0 20px', marginBottom: 12 }}>
        <div className="training-card">
          <div className="training-card__top">
            <div>
              <div className="training-card__label">Gesamtzeit · {FILTERS.find(f2 => f2.value === filter)?.label}</div>
              <div className="training-card__value">
                {hours}h <span className="training-card__unit">{String(mins).padStart(2,'0')}&#39;</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="training-card__label">Sessions</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{filtered.length}</div>
            </div>
          </div>
          <div className="training-card__bars">
            {bars.map((b, i) => (
              <div key={i} className="activity-bar">
                <div
                  className={`activity-bar__fill${b.mins > 0 && b.mins === Math.max(...bars.map(x => x.mins)) ? ' peak' : ''}${b.isCurrent ? ' current' : ''}`}
                  style={{ height: `${b.mins > 0 ? Math.max(6, Math.round((b.mins / maxMins) * BAR_MAX_H)) : 3}px` }}
                />
                <span className="activity-bar__label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session list */}
      <div className="history-section">
        <div className="history-section__header">
          {filtered.length} Session{filtered.length !== 1 ? 's' : ''}
        </div>
        <div className="history-section__list">
          {!loaded ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8C8270', fontSize: 14 }}>Laden…</div>
          ) : filtered.length > 0 ? filtered.map(s => (
            <div key={s.id} className="list-row" onClick={() => openSession(s)}>
              <div className={`list-row__icon list-row__icon--${TYPE_COLOR[s.type] ?? 'ink'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <SessionIcon type={s.type} />
                </svg>
              </div>
              <div className="list-row__content">
                <div className="list-row__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.name}
                  <SourceBadge source={s.source} />
                </div>
                <div className="list-row__sub">
                  {new Intl.DateTimeFormat('de', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(s.completed_at))}
                  {s.duration ? ` · ${s.duration} min` : ''}
                  {s.kcal ? ` · ~${s.kcal} kcal` : ''}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </div>
          )) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8C8270', fontSize: 14, fontWeight: 600 }}>
              Keine Sessions in diesem Zeitraum.
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Session detail / edit sheet */}
      {selected && (
        <div className="log-sheet-scrim" onClick={() => { setSelected(null); setEditing(false); setConfirming(false) }}>
          <div className="log-sheet" onClick={e => e.stopPropagation()}>
            <div className="log-sheet__handle"></div>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className={`list-row__icon list-row__icon--${TYPE_COLOR[selected.type] ?? 'ink'}`} style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <SessionIcon type={selected.type} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{selected.name}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8C8270', marginTop: 2 }}>
                  {selected.type} · {new Intl.DateTimeFormat('de', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(selected.completed_at))}
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => { setSelected(null); setConfirming(false) }}
                  style={{ background: 'rgba(31,31,31,0.07)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Stats */}
            {!editing && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Dauer', value: selected.duration ? `${selected.duration} min` : '—' },
                    { label: 'Kalorien', value: selected.kcal ? `~${selected.kcal} kcal` : '—' },
                    { label: 'Quelle', value: selected.source === 'strava' ? 'Strava' : 'Manuell' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: '#FAF7F1', borderRadius: 14, padding: '12px 10px', border: '1px solid rgba(31,31,31,0.06)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5F5849', marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
                {selected.notes && (
                  <div style={{ background: '#FAF7F1', borderRadius: 14, padding: '12px 14px', marginBottom: 16, border: '1px solid rgba(31,31,31,0.06)', fontSize: 14, fontWeight: 500, color: '#3A3328' }}>
                    {selected.notes}
                  </div>
                )}

                {confirming ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#8C8270', textAlign: 'center', marginBottom: 4 }}>Session wirklich löschen?</div>
                    <button className="btn btn--lg" style={{ background: '#C24B2E', color: '#F2EDE3', width: '100%' }} onClick={handleDelete}>
                      Ja, löschen
                    </button>
                    <button className="btn btn--secondary btn--md" style={{ width: '100%' }} onClick={() => setConfirming(false)}>
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <div className="log-sheet__actions">
                    <button className="btn btn--primary btn--md" onClick={startEdit} style={{ flex: 1 }}>
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => setConfirming(true)}
                      style={{ background: 'rgba(194,75,46,0.1)', border: 'none', borderRadius: 999, padding: '13px 16px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      aria-label="Löschen"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C24B2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Edit form */}
            {editing && (
              <>
                <input
                  className="log-sheet__input"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Name"
                />
                <div className="log-sheet__field">
                  <span className="log-sheet__field-label">Dauer</span>
                  <div className="log-sheet__duration-ctrl">
                    <button onClick={() => setEditDur(d => Math.max(5, d - 5))}>−</button>
                    <span>{editDur} min</span>
                    <button onClick={() => setEditDur(d => d + 5)}>+</button>
                  </div>
                </div>
                <textarea
                  className="log-sheet__input"
                  placeholder="Notiz (optional)"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                />
                <div className="log-sheet__actions">
                  <button className="btn btn--primary btn--md" onClick={handleSaveEdit} disabled={saving} style={{ flex: 1 }}>
                    {saving ? 'Speichern…' : 'Speichern'}
                  </button>
                  <button className="btn btn--secondary btn--md" onClick={() => setEditing(false)}>
                    Abbrechen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
