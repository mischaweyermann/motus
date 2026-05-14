'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SessionData {
  name?: string
  duration?: number
  kcal?: number
}

export default function CompletePage() {
  const [session, setSession] = useState<SessionData>({
    name: 'Push · Upper Body',
    duration: 42,
    kcal: 320,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('workout_sessions')
        .select('name, duration, kcal')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setSession(data)
        })
    })
  }, [])

  return (
    <div className="complete-page">

      <div className="success-ring">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <div className="complete-label">Session Abgeschlossen</div>
      <h1 className="complete-title">
        Stark. Das war<br />
        <span style={{ color: '#C24B2E' }}>{session.name}.</span>
      </h1>

      <div className="complete-stats">
        <div className="complete-stat">
          <div className="complete-stat__label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Zeit
          </div>
          <div className="complete-stat__value">{session.duration}&#39;</div>
        </div>
        <div className="complete-stat">
          <div className="complete-stat__label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Kcal
          </div>
          <div className="complete-stat__value">~{session.kcal}</div>
        </div>
        <div className="complete-stat">
          <div className="complete-stat__label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/></svg>
            Übungen
          </div>
          <div className="complete-stat__value">6</div>
        </div>
      </div>

      <div className="complete-actions">
        <Link href="/today" className="btn btn--ink btn--lg">Fertig</Link>
        <a href="#" className="note-link">Notiz hinzufügen</a>
      </div>
    </div>
  )
}
