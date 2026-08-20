import type { ReactNode } from 'react'

export function ProgressRing({
  pct, size = 104, stroke = 9, track, fill, children,
}: {
  pct: number
  size?: number
  stroke?: number
  track: string
  fill: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100)

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} />
        <circle
          className="ring__fill"
          cx={size / 2} cy={size / 2} r={r}
          stroke={fill} strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring__center">{children}</div>
    </div>
  )
}
