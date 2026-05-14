import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'

const TYPE_ICON: Record<string, string> = {
  Gym: 'ink', Tennis: 'ink', Cycle: 'clay', Run: 'success', Sonstiges: 'ink',
}

function SessionIcon({ type }: { type: string }) {
  if (type === 'Cycle') return <><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h3l3 6M10 8l-1-3h3"/></>
  if (type === 'Tennis') return <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z"/></>
  if (type === 'Run') return <><circle cx="14" cy="4.5" r="2"/><path d="M9 21l1.5-6L7 12.5l2-6 3 2.5 3.5-1M14 21l-2-6 3-3.5"/></>
  return <path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/>
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'strava') return (
    <span className="source-badge source-badge--strava">Strava</span>
  )
  return null
}

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, name, type, duration, kcal, completed_at, source')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(30)

  const { data: durationRows } = await supabase
    .from('workout_sessions')
    .select('duration')
    .eq('user_id', user.id)

  const totalMins = (durationRows ?? []).reduce((s, r) => s + (r.duration ?? 0), 0)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  const now = new Date()
  const DAY_LABELS = ['So','Mo','Di','Mi','Do','Fr','Sa']
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (6 - i))
    const label = DAY_LABELS[d.getDay()]
    const dayStr = d.toISOString().slice(0, 10)
    const dayMins = (sessions ?? [])
      .filter(s => s.completed_at?.slice(0, 10) === dayStr)
      .reduce((sum, s) => sum + (s.duration ?? 0), 0)
    return { label, mins: dayMins }
  })
  const maxMins = Math.max(...bars.map(b => b.mins), 1)

  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">Letzte Sessions</div>
          <div className="app-header__title">Aktivität</div>
        </div>
        <button className="app-header__action" aria-label="Einstellungen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 12 }}>
        <div className="training-card">
          <div className="training-card__top">
            <div>
              <div className="training-card__label">Gesamtzeit</div>
              <div className="training-card__value">
                {hours}h <span className="training-card__unit">{mins}&#39;</span>
              </div>
            </div>
          </div>
          <div className="training-card__bars">
            {bars.map((b, i) => (
              <div key={i} className="activity-bar">
                <div
                  className={`activity-bar__fill${b.mins === maxMins && b.mins > 0 ? ' peak' : ''}`}
                  style={{ height: `${b.mins > 0 ? Math.max(8, Math.round((b.mins / maxMins) * 100)) : 4}%` }}
                />
                <span className="activity-bar__label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="history-section">
        <div className="history-section__header">Alle Sessions</div>
        <div className="history-section__list">
          {sessions && sessions.length > 0 ? sessions.map(s => (
            <div key={s.id} className="list-row">
              <div className={`list-row__icon list-row__icon--${TYPE_ICON[s.type] ?? 'ink'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <SessionIcon type={s.type} />
                </svg>
              </div>
              <div className="list-row__content">
                <div className="list-row__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.name}
                  <SourceBadge source={s.source ?? 'manual'} />
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
              Noch keine Sessions — starte dein erstes Workout!
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
