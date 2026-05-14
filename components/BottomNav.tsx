'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  onFabClick?: () => void
}

export default function BottomNav({ onFabClick }: Props) {
  const pathname = usePathname()
  const active = (href: string) =>
    pathname === href ? ' active' : ''

  return (
    <div className="bottom-nav-wrap">
      <nav className="bottom-nav">
        <Link href="/today" className={`bottom-nav__item${active('/today')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l9-9 9 9M5 10v10h6v-6h2v6h6V10"/>
          </svg>
          Today
        </Link>
        <Link href="/plan" className={`bottom-nav__item${active('/plan')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3"/>
            <path d="M3 9h18M8 3v4M16 3v4"/>
          </svg>
          Plan
        </Link>
        <button className="bottom-nav__fab" onClick={onFabClick} aria-label="Log">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <Link href="/activity" className={`bottom-nav__item${active('/activity')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-7 4 14 3-7h4"/>
          </svg>
          Activity
        </Link>
        <Link href="/profile" className={`bottom-nav__item${active('/profile')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>
          </svg>
          You
        </Link>
      </nav>
    </div>
  )
}
