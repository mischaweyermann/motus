// Simple stick-figure pictograms that give a quick visual cue for how an
// exercise is performed. Movement patterns are shared across similarly-
// executed exercises (e.g. all row variants use the same "pullHoriz" pose)
// rather than drawing one bespoke icon per exercise name.
import type { ReactNode } from 'react'

type Pattern =
  | 'pressHoriz' | 'pressVert' | 'pullHoriz' | 'pullVert'
  | 'squat' | 'hinge' | 'lunge' | 'curl' | 'triceps' | 'lateral'
  | 'plank' | 'sidePlank' | 'curlUp' | 'birdDog' | 'deadBug' | 'bridge'
  | 'rotation' | 'carry' | 'getUp' | 'swing' | 'balance'
  | 'calf' | 'bandWalk' | 'abWheel' | 'legIso' | 'generic'

// Ordered most-specific first — the first matching rule wins.
const PATTERN_RULES: Array<[Pattern, RegExp]> = [
  ['bandWalk', /monster walk|band walk/i],
  ['abWheel', /ab.?wheel/i],
  ['deadBug', /dead bug/i],
  ['birdDog', /bird dog/i],
  ['bridge', /glute bridge|hip thrust/i],
  ['sidePlank', /side plank/i],
  ['curlUp', /curl-up|curl up|mcgill|klappmesser/i],
  ['plank', /plank/i],
  ['rotation', /windmill|russian twist|pallof|halo/i],
  ['carry', /carry/i],
  ['getUp', /get-up|get up/i],
  ['swing', /swing|snatch/i],
  ['balance', /einbeiniger stand|short foot|fussgewölbe|single-?leg stand/i],
  ['calf', /wadenheben|calf raise/i],
  ['legIso', /bein-curl|leg curl|leg extension/i],
  ['lunge', /ausfallschritt|lunge|split squat/i],
  ['squat', /kniebeuge|squat|beinpresse|leg press/i],
  ['hinge', /kreuzheben|deadlift/i],
  ['pullVert', /klimmzüge|latzug|pull-?up|lat pulldown/i],
  ['pullHoriz', /rudern|row|face pull|reverse fly/i],
  ['pressVert', /schulterdrücken|overhead press|arnold|frontdrücken|push press|clean.*press/i],
  ['triceps', /trizeps|skull crusher|tricep/i],
  ['curl', /curl/i],
  ['lateral', /seitheben|upright row|lateral raise/i],
  ['pressHoriz', /bankdrücken|bench|fliegende|dip|push-?up|floor press|fly/i],
]

export function classifyExercise(name: string): Pattern {
  for (const [pattern, re] of PATTERN_RULES) {
    if (re.test(name)) return pattern
  }
  return 'generic'
}

function StandingFigure({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="9" y2="20" />
      <line x1="12" y1="15" x2="15" y2="20" />
      {children}
    </>
  )
}

const PATTERN_SHAPES: Record<Pattern, ReactNode> = {
  pressHoriz: (
    <>
      <circle cx="4" cy="16" r="2" />
      <line x1="6" y1="16" x2="14" y2="16" />
      <line x1="14" y1="16" x2="17" y2="13" />
      <line x1="17" y1="13" x2="20" y2="16" />
      <line x1="9" y1="16" x2="9" y2="9" />
      <line x1="12" y1="16" x2="12" y2="9" />
      <line x1="7" y1="9" x2="14" y2="9" />
    </>
  ),
  pressVert: (
    <StandingFigure>
      <line x1="12" y1="8" x2="8" y2="3" />
      <line x1="12" y1="8" x2="16" y2="3" />
      <line x1="7" y1="3" x2="17" y2="3" />
    </StandingFigure>
  ),
  pullHoriz: (
    <>
      <circle cx="6" cy="7" r="2" />
      <line x1="7" y1="9" x2="15" y2="15" />
      <line x1="15" y1="15" x2="13" y2="20" />
      <line x1="15" y1="15" x2="17" y2="20" />
      <line x1="10" y1="11" x2="6" y2="10" />
      <line x1="6" y1="10" x2="3" y2="12" />
    </>
  ),
  pullVert: (
    <>
      <line x1="4" y1="3" x2="20" y2="3" />
      <line x1="8" y1="3" x2="10" y2="8" />
      <line x1="16" y1="3" x2="14" y2="8" />
      <circle cx="12" cy="6" r="2" />
      <line x1="12" y1="8" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="20" />
      <line x1="12" y1="15" x2="14" y2="19" />
    </>
  ),
  squat: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="12" />
      <line x1="12" y1="12" x2="9" y2="14" />
      <line x1="9" y1="14" x2="9" y2="20" />
      <line x1="12" y1="12" x2="15" y2="14" />
      <line x1="15" y1="14" x2="15" y2="20" />
      <line x1="12" y1="9" x2="8" y2="10" />
      <line x1="12" y1="9" x2="16" y2="10" />
    </>
  ),
  hinge: (
    <>
      <circle cx="6" cy="7" r="2" />
      <line x1="7" y1="9" x2="15" y2="14" />
      <line x1="15" y1="14" x2="14" y2="20" />
      <line x1="15" y1="14" x2="17" y2="20" />
      <line x1="9" y1="11" x2="8" y2="17" />
      <line x1="5" y1="17" x2="11" y2="17" />
    </>
  ),
  lunge: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="13" />
      <line x1="12" y1="13" x2="9" y2="16" />
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="12" y1="13" x2="16" y2="17" />
      <line x1="16" y1="17" x2="19" y2="20" />
      <line x1="12" y1="8" x2="9" y2="9" />
      <line x1="12" y1="8" x2="15" y2="9" />
    </>
  ),
  curl: (
    <StandingFigure>
      <line x1="12" y1="8" x2="9" y2="12" />
      <line x1="9" y1="12" x2="10" y2="7" />
      <circle cx="10" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <line x1="12" y1="8" x2="15" y2="14" />
    </StandingFigure>
  ),
  triceps: (
    <StandingFigure>
      <line x1="12" y1="7" x2="15" y2="4" />
      <line x1="15" y1="4" x2="13" y2="8" />
      <line x1="12" y1="8" x2="9" y2="14" />
    </StandingFigure>
  ),
  lateral: (
    <StandingFigure>
      <line x1="4" y1="9" x2="20" y2="9" />
    </StandingFigure>
  ),
  plank: (
    <>
      <circle cx="4" cy="14" r="2" />
      <line x1="6" y1="14" x2="18" y2="16" />
      <line x1="7" y1="14" x2="7" y2="19" />
      <line x1="18" y1="16" x2="20" y2="19" />
    </>
  ),
  sidePlank: (
    <>
      <circle cx="5" cy="10" r="2" />
      <line x1="7" y1="11" x2="18" y2="16" />
      <line x1="9" y1="12" x2="9" y2="19" />
      <line x1="18" y1="16" x2="18" y2="20" />
      <line x1="9" y1="13" x2="6" y2="6" />
    </>
  ),
  curlUp: (
    <>
      <circle cx="5" cy="15" r="2" />
      <line x1="7" y1="14" x2="12" y2="15" />
      <line x1="12" y1="15" x2="13" y2="11" />
      <line x1="13" y1="11" x2="16" y2="15" />
      <line x1="16" y1="15" x2="19" y2="19" />
      <line x1="9" y1="14" x2="9" y2="17" />
    </>
  ),
  birdDog: (
    <>
      <circle cx="17" cy="12" r="1.6" />
      <line x1="7" y1="14" x2="16" y2="13" />
      <line x1="9" y1="14" x2="9" y2="19" />
      <line x1="14" y1="14" x2="14" y2="19" />
      <line x1="7" y1="14" x2="3" y2="10" />
      <line x1="16" y1="13" x2="20" y2="17" />
    </>
  ),
  deadBug: (
    <>
      <circle cx="4" cy="15" r="2" />
      <line x1="6" y1="15" x2="13" y2="15" />
      <line x1="13" y1="15" x2="15" y2="10" />
      <line x1="15" y1="10" x2="13" y2="6" />
      <line x1="13" y1="15" x2="17" y2="17" />
      <line x1="10" y1="15" x2="7" y2="9" />
      <line x1="10" y1="15" x2="12" y2="19" />
    </>
  ),
  bridge: (
    <>
      <line x1="2" y1="19" x2="22" y2="19" />
      <circle cx="5" cy="16" r="2" />
      <line x1="7" y1="17" x2="13" y2="13" />
      <line x1="13" y1="13" x2="16" y2="17" />
      <line x1="16" y1="17" x2="16" y2="19" />
      <line x1="10" y1="15" x2="10" y2="19" />
    </>
  ),
  rotation: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="9" y2="20" />
      <line x1="12" y1="15" x2="15" y2="20" />
      <line x1="6" y1="10" x2="18" y2="8" />
      <path d="M17 4.5a5 5 0 0 1 2 4" />
    </>
  ),
  carry: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="20" />
      <line x1="12" y1="15" x2="14" y2="19" />
      <line x1="12" y1="9" x2="18" y2="10" />
      <line x1="18" y1="7" x2="18" y2="13" />
    </>
  ),
  getUp: (
    <>
      <circle cx="5" cy="15" r="2" />
      <line x1="7" y1="15" x2="13" y2="16" />
      <line x1="13" y1="16" x2="14" y2="12" />
      <line x1="14" y1="12" x2="17" y2="15" />
      <line x1="17" y1="15" x2="20" y2="19" />
      <line x1="9" y1="14" x2="9" y2="6" />
    </>
  ),
  swing: (
    <>
      <circle cx="9" cy="6" r="2" />
      <line x1="10" y1="8" x2="14" y2="14" />
      <line x1="14" y1="14" x2="12" y2="20" />
      <line x1="14" y1="14" x2="17" y2="19" />
      <line x1="11" y1="10" x2="9" y2="15" />
      <line x1="13" y1="10" x2="9" y2="15" />
      <circle cx="9" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  balance: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="11" y2="20" />
      <line x1="12" y1="15" x2="16" y2="16" />
      <line x1="16" y1="16" x2="16" y2="13" />
      <line x1="12" y1="9" x2="8" y2="10" />
      <line x1="12" y1="9" x2="16" y2="8" />
    </>
  ),
  calf: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="15" />
      <line x1="12" y1="15" x2="10" y2="20" />
      <line x1="12" y1="15" x2="14" y2="20" />
      <line x1="9" y1="21" x2="11" y2="19" />
      <line x1="13" y1="19" x2="15" y2="21" />
    </>
  ),
  bandWalk: (
    <>
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="14" />
      <line x1="12" y1="14" x2="8" y2="20" />
      <line x1="12" y1="14" x2="16" y2="20" />
      <ellipse cx="12" cy="18" rx="5" ry="2" />
      <line x1="12" y1="9" x2="9" y2="11" />
      <line x1="12" y1="9" x2="15" y2="11" />
    </>
  ),
  abWheel: (
    <>
      <circle cx="19" cy="15" r="2" />
      <line x1="17" y1="16" x2="10" y2="16" />
      <line x1="10" y1="16" x2="10" y2="20" />
      <line x1="17" y1="16" x2="17" y2="20" />
      <line x1="14" y1="15" x2="5" y2="15" />
      <circle cx="4" cy="17" r="2" />
    </>
  ),
  legIso: (
    <>
      <circle cx="6" cy="6" r="2" />
      <line x1="6" y1="8" x2="6" y2="15" />
      <line x1="4" y1="15" x2="10" y2="15" />
      <line x1="6" y1="15" x2="6" y2="19" />
      <line x1="6" y1="19" x2="14" y2="16" />
    </>
  ),
  generic: (
    <>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="12" r="3" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </>
  ),
}

export function ExercisePictogram({ name, className }: { name: string; className?: string }) {
  const pattern = classifyExercise(name)
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATTERN_SHAPES[pattern]}
    </svg>
  )
}
