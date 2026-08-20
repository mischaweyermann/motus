'use client'
import { useState, useEffect, type ReactNode } from 'react'

// Renders a photo if one exists at `src`; falls back to a solid brand-color
// panel (no broken-image icon) until a real file is dropped in place.
//
// The `<img>` only enters the DOM after mount (not during SSR) so that
// React's onError handler is guaranteed to be attached before the browser
// starts the request — otherwise a fast local 404 can resolve before
// hydration finishes and the native broken-image icon flashes instead.
export function PhotoSlot({
  src, alt, fallbackColor, fallback, className,
}: {
  src: string
  alt: string
  fallbackColor: string
  fallback?: ReactNode
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || errored) {
    return (
      <div className={className} style={{ background: fallbackColor, display: 'grid', placeItems: 'center' }}>
        {fallback}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}
