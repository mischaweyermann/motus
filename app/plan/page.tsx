import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

const DAYS = [
  { short: 'Mo', date: 13, dotColor: '#C24B2E', dotOpacity: 1, state: 'done' },
  { short: 'Di', date: 14, dotColor: '#C24B2E', dotOpacity: 1, state: 'today' },
  { short: 'Mi', date: 15, dotColor: '#1F1F1F', dotOpacity: 1, state: 'default' },
  { short: 'Do', date: 16, dotColor: '#B7AB91', dotOpacity: 0.4, state: 'default' },
  { short: 'Fr', date: 17, dotColor: '#C24B2E', dotOpacity: 1, state: 'default' },
  { short: 'Sa', date: 18, dotColor: '#5E8A4C', dotOpacity: 1, state: 'default' },
  { short: 'So', date: 19, dotColor: '#B7AB91', dotOpacity: 0.4, state: 'default' },
]

export default function PlanPage() {
  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">Mai · Woche 20</div>
          <div className="app-header__title">Dein Plan</div>
        </div>
        <button className="app-header__action" aria-label="Einstellungen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>
          </svg>
        </button>
      </div>

      <div className="day-strip">
        {DAYS.map(d => (
          <div key={d.short} className={`day-pill day-pill--${d.state}`}>
            <span className="day-pill__day">{d.short}</span>
            <span className="day-pill__date">{d.date}</span>
            <span className="day-pill__dot" style={{ background: d.dotColor, opacity: d.dotOpacity }}></span>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 12 }}>Heute · Dienstag</div>
        <div className="plan-session-card">
          <div className="plan-session-card__top">
            <div className="plan-session-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/>
              </svg>
            </div>
            <div className="plan-session-card__info">
              <div className="plan-session-card__title">Push · Upper Body</div>
              <div className="plan-session-card__sub">42 min · 6 Übungen · Mittel</div>
            </div>
            <Link href="/workout" className="btn btn--primary btn--sm">Start</Link>
          </div>
          <div className="plan-session-card__mini-stats">
            <div className="mini-stat-inline">
              <div className="mini-stat-inline__label">Sätze</div>
              <div className="mini-stat-inline__val">18</div>
            </div>
            <div className="mini-stat-inline">
              <div className="mini-stat-inline__label">Volumen</div>
              <div className="mini-stat-inline__val">4.2t</div>
            </div>
            <div className="mini-stat-inline">
              <div className="mini-stat-inline__label">Pause</div>
              <div className="mini-stat-inline__val">60s</div>
            </div>
          </div>
        </div>
      </div>

      <div className="week-section">
        <div className="week-section__header">Diese Woche</div>
        <div className="week-section__list">
          <div className="list-row">
            <div className="list-row__icon list-row__icon--ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z"/></svg>
            </div>
            <div className="list-row__content">
              <div className="list-row__title">Tennis · Hit</div>
              <div className="list-row__sub">Mi · 18:00 · Court 4 · 90 min</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </div>
          <div className="list-row">
            <div className="list-row__icon list-row__icon--clay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h3l3 6M10 8l-1-3h3"/></svg>
            </div>
            <div className="list-row__content">
              <div className="list-row__title">Endurance · Z2</div>
              <div className="list-row__sub">Fr · 07:30 · 90 min · 45 km</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </div>
          <div className="list-row">
            <div className="list-row__icon list-row__icon--success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="4.5" r="2"/><path d="M9 21l1.5-6L7 12.5l2-6 3 2.5 3.5-1M14 21l-2-6 3-3.5"/></svg>
            </div>
            <div className="list-row__content">
              <div className="list-row__title">Long Run</div>
              <div className="list-row__sub">Sa · 09:00 · 14 km · easy</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
