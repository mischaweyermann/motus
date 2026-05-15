'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import LogoutButton from '@/components/LogoutButton'
import IntegrationCard from '@/components/IntegrationCard'
import { createClient } from '@/lib/supabase/client'

function emailPrefix(email: string | undefined): string {
  return email?.split('@')[0] ?? 'Motus User'
}

const AVATAR_COLORS = [
  { value: '#1F1F1F', label: 'Ink' },
  { value: '#C24B2E', label: 'Clay' },
  { value: '#5E8A4C', label: 'Grün' },
  { value: '#3B6FCC', label: 'Blau' },
  { value: '#7B4CC2', label: 'Lila' },
  { value: '#B7AB91', label: 'Sand' },
]

export default function ProfilePage() {
  const router = useRouter()

  // Saved profile state (from DB)
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [since, setSince]             = useState('')
  const [avatarColor, setAvatarColor] = useState('#1F1F1F')
  const [weeklyGoal, setWeeklyGoal]   = useState(4)
  const [sessionCount, setSessionCount] = useState(0)
  const [totalHours, setTotalHours]   = useState(0)
  const [intMap, setIntMap]           = useState<Record<string, string>>({})
  const [userId, setUserId]           = useState('')
  const [loaded, setLoaded]           = useState(false)

  // Settings sheet state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editName, setEditName]           = useState('')
  const [editColor, setEditColor]         = useState('#1F1F1F')
  const [editGoal, setEditGoal]           = useState(4)
  const [saving, setSaving]               = useState(false)

  // Toast
  const [toast, setToast]           = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }

      setEmail(user.email ?? '')
      setUserId(user.id)

      const [{ data: profile }, extResult, { count }, { data: durationRows }, { data: integrationRows }] =
        await Promise.all([
          supabase.from('profiles').select('name, created_at').eq('id', user.id).single(),
          supabase.from('profiles').select('avatar_color, weekly_goal').eq('id', user.id).single(),
          supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('workout_sessions').select('duration').eq('user_id', user.id),
          supabase.from('integrations').select('provider, connected_at').eq('user_id', user.id),
        ])

      const resolvedName = profile?.name?.trim() ? profile.name : emailPrefix(user.email)
      setName(resolvedName)

      // extResult only available after schema_v4.sql has been run
      if (!extResult.error && extResult.data) {
        setAvatarColor(extResult.data.avatar_color ?? '#1F1F1F')
        setWeeklyGoal(extResult.data.weekly_goal ?? 4)
      }

      if (profile?.created_at) {
        setSince(new Intl.DateTimeFormat('de', { month: 'long', year: 'numeric' })
          .format(new Date(profile.created_at)))
      }
      setSessionCount(count ?? 0)
      setTotalHours(Math.round(
        (durationRows ?? []).reduce((s, r) => s + (r.duration ?? 0), 0) / 60
      ))
      setIntMap(Object.fromEntries(
        (integrationRows ?? []).map(r => [r.provider, r.connected_at as string])
      ))
      setLoaded(true)
    })
  }, [router])

  function showToast(msg: string) {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }

  function openSettings() {
    setEditName(name)
    setEditColor(avatarColor)
    setEditGoal(weeklyGoal)
    setSettingsOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const newName = editName.trim() || emailPrefix(email)

    // Name update always works (column exists from schema.sql)
    const { error } = await supabase.from('profiles')
      .update({ name: newName })
      .eq('id', userId)

    // Avatar + goal only work after schema_v4.sql — fail silently if not yet run
    await supabase.from('profiles')
      .update({ avatar_color: editColor, weekly_goal: editGoal })
      .eq('id', userId)

    if (!error) {
      setName(newName)
      setAvatarColor(editColor)
      setWeeklyGoal(editGoal)
      setSettingsOpen(false)
      showToast('Gespeichert')
    } else {
      showToast('Fehler beim Speichern')
    }
    setSaving(false)
  }

  const initials = name
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">Profil</div>
          <div className="app-header__title">{loaded ? name.split(' ')[0] : '…'}</div>
        </div>
        <button className="app-header__action" aria-label="Einstellungen" onClick={openSettings}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>
          </svg>
        </button>
      </div>

      {/* Profile card – no edit button */}
      <div className="profile-card">
        <div className="profile-card__avatar" style={{ background: avatarColor }}>
          {initials}
        </div>
        <div className="profile-card__info">
          <div className="profile-card__name">{name}</div>
          <div className="profile-card__sub">
            {email && <span>{email}</span>}
            {since && <span> · seit {since}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-tile stat-tile--cream">
          <div className="stat-tile__eyebrow">Sessions</div>
          <div className="stat-tile__value" style={{ fontSize: 32 }}>{sessionCount}</div>
        </div>
        <div className="stat-tile stat-tile--cream">
          <div className="stat-tile__eyebrow">Stunden</div>
          <div className="stat-tile__value" style={{ fontSize: 32 }}>{totalHours}</div>
        </div>
        <div className="stat-tile stat-tile--cream">
          <div className="stat-tile__eyebrow">Ziel/Wo</div>
          <div className="stat-tile__value" style={{ fontSize: 32 }}>{weeklyGoal}</div>
        </div>
      </div>

      {/* Integrations */}
      <div className="settings-section">
        <div className="settings-section__label">Integrationen</div>
        <IntegrationCard provider="strava" connected={'strava' in intMap} connectedAt={intMap.strava ?? null} />
        <IntegrationCard provider="garmin" connected={false} />
        <IntegrationCard provider="apple_health" connected={false} />
        <LogoutButton />
      </div>

      <BottomNav />

      {/* Settings sheet */}
      {settingsOpen && (
        <div className="log-sheet-scrim" onClick={() => setSettingsOpen(false)}>
          <div className="log-sheet" style={{ maxHeight: '88%' }} onClick={e => e.stopPropagation()}>
            <div className="log-sheet__handle"></div>
            <div className="log-sheet__eyebrow">Einstellungen</div>
            <div className="log-sheet__title">Profil anpassen</div>

            {/* Avatar preview + color picker */}
            <div className="profile-settings__avatar-row">
              <div
                className="profile-settings__avatar-preview"
                style={{ background: editColor }}
              >
                {(editName.trim() || emailPrefix(email))
                  .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="profile-settings__color-grid">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c.value}
                    className="profile-settings__color-btn"
                    style={{
                      background: c.value,
                      outline: editColor === c.value ? '3px solid #C24B2E' : '3px solid transparent',
                      outlineOffset: 2,
                    }}
                    onClick={() => setEditColor(c.value)}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="profile-settings__label">Name</div>
            <input
              className="log-sheet__input"
              type="text"
              placeholder={emailPrefix(email)}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              autoComplete="name"
            />

            {/* Weekly goal */}
            <div className="log-sheet__field">
              <span className="log-sheet__field-label">Sessions pro Woche</span>
              <div className="log-sheet__duration-ctrl">
                <button onClick={() => setEditGoal(g => Math.max(1, g - 1))}>−</button>
                <span>{editGoal}×</span>
                <button onClick={() => setEditGoal(g => Math.min(14, g + 1))}>+</button>
              </div>
            </div>

            <div className="log-sheet__actions">
              <button
                className="btn btn--primary btn--md"
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
              <button className="btn btn--secondary btn--md" onClick={() => setSettingsOpen(false)}>
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
