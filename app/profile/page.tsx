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

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [since, setSince] = useState('')
  const [sessionCount, setSessionCount] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
  const [intMap, setIntMap] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }

      setEmail(user.email ?? '')

      const [{ data: profile }, { count }, { data: durationRows }, { data: integrationRows }] = await Promise.all([
        supabase.from('profiles').select('name, created_at').eq('id', user.id).single(),
        supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('workout_sessions').select('duration').eq('user_id', user.id),
        supabase.from('integrations').select('provider, connected_at').eq('user_id', user.id),
      ])

      const resolvedName = profile?.name?.trim()
        ? profile.name
        : emailPrefix(user.email)
      setName(resolvedName)

      if (profile?.created_at) {
        setSince(new Intl.DateTimeFormat('de', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at)))
      }
      setSessionCount(count ?? 0)
      setTotalHours(Math.round((durationRows ?? []).reduce((s, r) => s + (r.duration ?? 0), 0) / 60))
      setIntMap(Object.fromEntries((integrationRows ?? []).map(r => [r.provider, r.connected_at as string])))
      setLoaded(true)
    })
  }, [router])

  function showToast(msg: string) {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }

  function openEdit() {
    setEditName(name)
    setEditOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const newName = editName.trim() || emailPrefix(user.email)
      await supabase.from('profiles').update({ name: newName }).eq('id', user.id)
      setName(newName)
    }
    setSaving(false)
    setEditOpen(false)
    showToast('Profil gespeichert')
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">Profil</div>
          <div className="app-header__title">{loaded ? name.split(' ')[0] : '…'}</div>
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
          <div className="profile-card__sub">
            {email && <span style={{ opacity: 0.6 }}>{email}</span>}
            {since && <span> · seit {since}</span>}
            {' · '}{sessionCount} Sessions
          </div>
        </div>
        <button className="profile-card__edit" onClick={openEdit}>Bearbeiten</button>
      </div>

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
          <div className="stat-tile__eyebrow">PRs</div>
          <div className="stat-tile__value" style={{ fontSize: 32 }}>—</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__label">Integrationen</div>
        <IntegrationCard provider="strava" connected={'strava' in intMap} connectedAt={intMap.strava ?? null} />
        <IntegrationCard provider="garmin" connected={false} />
        <IntegrationCard provider="apple_health" connected={false} />

        <LogoutButton />
      </div>

      <BottomNav />

      {/* Edit sheet */}
      {editOpen && (
        <div className="log-sheet-scrim" onClick={() => setEditOpen(false)}>
          <div className="log-sheet" onClick={e => e.stopPropagation()}>
            <div className="log-sheet__handle"></div>
            <div className="log-sheet__eyebrow">Profil bearbeiten</div>
            <div className="log-sheet__title">Dein Name</div>

            <input
              className="log-sheet__input"
              type="text"
              placeholder={emailPrefix(email)}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              autoFocus
            />

            <div style={{ fontSize: 13, color: '#8C8270', fontWeight: 500, marginBottom: 16, paddingLeft: 2 }}>
              Leer lassen um den Benutzernamen ({emailPrefix(email)}) zu verwenden.
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
              <button className="btn btn--secondary btn--md" onClick={() => setEditOpen(false)}>
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
