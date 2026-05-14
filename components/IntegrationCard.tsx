'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Provider = 'strava' | 'garmin' | 'apple_health'

interface Props {
  provider: Provider
  connected: boolean
  connectedAt?: string | null
}

const CONFIG: Record<Provider, { name: string; sub: string; bg: string }> = {
  strava:       { name: 'Strava',         sub: 'Laufen · Radfahren · mehr', bg: '#FC4C02' },
  garmin:       { name: 'Garmin Connect', sub: 'Kommt bald',                bg: '#1EB9C4' },
  apple_health: { name: 'Apple Health',   sub: 'Nur in der iOS App',        bg: '#FF375F' },
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'strava') return (
    <>
      <path d="M10.5 19l3.5-7 3.5 7" strokeWidth="2"/>
      <path d="M14 12l2.5 5" strokeWidth="2"/>
    </>
  )
  if (provider === 'garmin') return (
    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>
  )
  return <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
}

export default function IntegrationCard({ provider, connected, connectedAt }: Props) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const cfg = CONFIG[provider]
  const available = provider === 'strava'

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/strava/sync', { method: 'POST' })
    const data = await res.json()
    setSyncMsg(data.imported > 0 ? `${data.imported} neu importiert` : 'Alles aktuell')
    router.refresh()
    setSyncing(false)
  }

  async function handleDisconnect() {
    await fetch('/api/strava/disconnect', { method: 'POST' })
    router.refresh()
  }

  const sub = connected
    ? `Verbunden${connectedAt ? ` · seit ${new Date(connectedAt).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}` : ''}${syncMsg ? ` · ${syncMsg}` : ''}`
    : cfg.sub

  return (
    <div className="list-row" style={{ cursor: 'default' }}>
      <div className="list-row__icon" style={{ background: cfg.bg }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <ProviderIcon provider={provider} />
        </svg>
      </div>
      <div className="list-row__content">
        <div className="list-row__title">{cfg.name}</div>
        <div className="list-row__sub">{sub}</div>
      </div>
      {available && connected && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleSync} disabled={syncing} className="integration-btn integration-btn--orange">
            {syncing ? '…' : 'Sync'}
          </button>
          <button onClick={handleDisconnect} className="integration-btn integration-btn--ghost">
            Trennen
          </button>
        </div>
      )}
      {available && !connected && (
        <a href="/api/strava/connect" className="integration-btn integration-btn--orange">
          Verbinden
        </a>
      )}
      {!available && (
        <span style={{ fontSize: 12, color: '#8C8270', fontWeight: 600 }}>Bald</span>
      )}
    </div>
  )
}
