import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import LogoutButton from '@/components/LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { count: sessionCount }, { count: hoursRaw }] = await Promise.all([
    supabase.from('profiles').select('name, created_at').eq('id', user.id).single(),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('workout_sessions').select('duration', { count: 'exact', head: false }).eq('user_id', user.id),
  ])

  const { data: durationRows } = await supabase
    .from('workout_sessions')
    .select('duration')
    .eq('user_id', user.id)

  const totalHours = Math.round((durationRows ?? []).reduce((s, r) => s + (r.duration ?? 0), 0) / 60)

  const name = profile?.name ?? user.email ?? 'Motus User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const since = profile?.created_at
    ? new Intl.DateTimeFormat('de', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at))
    : ''

  const SETTINGS = [
    {
      iconClass: 'ink',
      icon: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
      title: 'Benachrichtigungen',
      sub: 'Streak · Sessions · Erholung',
    },
    {
      iconClass: 'clay',
      icon: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
      title: 'Gesundheit',
      sub: 'Apple Health · verbunden',
    },
    {
      iconClass: 'ink',
      icon: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
      title: 'Plan-Ziele',
      sub: '4 Sessions / Woche',
    },
  ]

  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">Profil</div>
          <div className="app-header__title">Du</div>
        </div>
        <button className="app-header__action" aria-label="Einstellungen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>
          </svg>
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-card__avatar">{initials}</div>
        <div className="profile-card__info">
          <div className="profile-card__name">{name}</div>
          <div className="profile-card__sub">seit {since} · {sessionCount ?? 0} Sessions</div>
        </div>
        <button className="profile-card__edit">Bearbeiten</button>
      </div>

      <div className="profile-stats">
        <div className="stat-tile stat-tile--cream">
          <div className="stat-tile__eyebrow">Sessions</div>
          <div className="stat-tile__value" style={{ fontSize: 32 }}>{sessionCount ?? 0}</div>
        </div>
        <div className="stat-tile stat-tile--cream">
          <div className="stat-tile__eyebrow">Stunden</div>
          <div className="stat-tile__value" style={{ fontSize: 32 }}>{totalHours}</div>
        </div>
        <div className="stat-tile stat-tile--cream">
          <div className="stat-tile__eyebrow">PRs</div>
          <div className="stat-tile__value" style={{ fontSize: 32 }}>—</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__label">Einstellungen</div>
        {SETTINGS.map(row => (
          <div key={row.title} className="list-row">
            <div className={`list-row__icon list-row__icon--${row.iconClass}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {row.icon}
              </svg>
            </div>
            <div className="list-row__content">
              <div className="list-row__title">{row.title}</div>
              <div className="list-row__sub">{row.sub}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </div>
        ))}
        <LogoutButton />
      </div>

      <BottomNav />
    </div>
  )
}
