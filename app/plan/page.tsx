'use client'
import { useState, useEffect, useCallback } from 'react'

// ── Data ─────────────────────────────────────────────────────────────

const DAY_KEYS = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'] as const
type DayKey = typeof DAY_KEYS[number]

const DAY_LABELS: Record<DayKey, string> = {
  mo: 'Montag', di: 'Dienstag', mi: 'Mittwoch', do: 'Donnerstag',
  fr: 'Freitag', sa: 'Samstag', so: 'Sonntag',
}
const DAY_SHORT: Record<DayKey, string> = {
  mo: 'MO', di: 'DI', mi: 'MI', do: 'DO', fr: 'FR', sa: 'SA', so: 'SO',
}

type Zone = 'gym' | 'home' | 'run' | 'flex' | 'rest'

const ZONE_COLORS: Record<Zone, string> = {
  gym:  '#1F1F1F',
  home: '#5E8A4C',
  run:  '#C24B2E',
  flex: '#8C8270',
  rest: '#D4CEC2',
}

type Activity = { key: string; label: string; zone: Zone }

const ACTIVITY_TYPES: Activity[] = [
  { key: 'gym_legs',   label: 'Gym: Unterkörper', zone: 'gym' },
  { key: 'gym_push',   label: 'Gym: Push',         zone: 'gym' },
  { key: 'gym_pull',   label: 'Gym: Pull',         zone: 'gym' },
  { key: 'kettlebell', label: 'Kettlebell',         zone: 'home' },
  { key: 'run',        label: 'Lauf',               zone: 'run' },
  { key: 'tennis',     label: 'Tennis',             zone: 'flex' },
  { key: 'rad',        label: 'Rennrad',            zone: 'flex' },
  { key: 'flex',       label: 'Flex / offen',       zone: 'flex' },
  { key: 'rest',       label: 'Ruhetag',            zone: 'rest' },
]

const ACTIVITY_MAP: Record<string, Activity> = Object.fromEntries(
  ACTIVITY_TYPES.map(a => [a.key, a])
)

const DEFAULT_TEMPLATE: Record<DayKey, string[]> = {
  mo: ['gym_legs'],
  di: ['gym_push'],
  mi: ['flex'],
  do: ['gym_pull'],
  fr: ['kettlebell'],
  sa: ['run'],
  so: ['rest'],
}

type Exercise = { id: string; name: string; sets: number; reps: string }

// Default exercises shown before any customization
const EXERCISES: Record<string, Exercise[]> = {
  gym_legs: [
    { id: 'legs1', name: 'Kniebeuge',              sets: 4, reps: '6-8' },
    { id: 'legs2', name: 'Rumänisches Kreuzheben', sets: 3, reps: '8-10' },
    { id: 'legs3', name: 'Ausfallschritte',        sets: 3, reps: '10/Bein' },
    { id: 'legs4', name: 'Wadenheben',             sets: 3, reps: '12-15' },
    { id: 'legs5', name: 'Plank',                  sets: 3, reps: '45s' },
  ],
  gym_push: [
    { id: 'push1', name: 'Bankdrücken',           sets: 4, reps: '6-8' },
    { id: 'push2', name: 'Schulterdrücken',       sets: 3, reps: '8-10' },
    { id: 'push3', name: 'Dips',                  sets: 3, reps: '8-12' },
    { id: 'push4', name: 'Trizepsdrücken Kabel',  sets: 3, reps: '10-12' },
    { id: 'push5', name: 'Seitheben',             sets: 3, reps: '12-15' },
  ],
  gym_pull: [
    { id: 'pull1', name: 'Klimmzüge',        sets: 4, reps: '6-8' },
    { id: 'pull2', name: 'Rudern vorgebeugt', sets: 3, reps: '8-10' },
    { id: 'pull3', name: 'Latzug eng',        sets: 3, reps: '10-12' },
    { id: 'pull4', name: 'Bizepscurls',       sets: 3, reps: '10-12' },
    { id: 'pull5', name: 'Face Pulls',        sets: 3, reps: '15' },
  ],
  kettlebell: [
    { id: 'kb1', name: 'KB Swings',        sets: 4, reps: '20' },
    { id: 'kb2', name: 'Goblet Squats',    sets: 3, reps: '12' },
    { id: 'kb3', name: 'KB Clean & Press', sets: 3, reps: '8/Seite' },
    { id: 'kb4', name: 'KB Rows',          sets: 3, reps: '10/Seite' },
    { id: 'kb5', name: 'Halos',            sets: 2, reps: '10/Seite' },
  ],
}

// Full exercise library for suggestions
const EXERCISE_LIBRARY: Record<string, Array<{ name: string; sets: number; reps: string }>> = {
  gym_push: [
    { name: 'Bankdrücken',          sets: 4, reps: '6-8' },
    { name: 'Schrägbankdrücken',    sets: 3, reps: '8-10' },
    { name: 'Schulterdrücken',      sets: 3, reps: '8-10' },
    { name: 'Dips',                 sets: 3, reps: '8-12' },
    { name: 'Trizepsdrücken Kabel', sets: 3, reps: '10-12' },
    { name: 'Seitheben',            sets: 3, reps: '12-15' },
    { name: 'Frontdrücken',         sets: 3, reps: '10-12' },
    { name: 'Fliegende Kurzhantel', sets: 3, reps: '12' },
    { name: 'Arnold Press',         sets: 3, reps: '10-12' },
    { name: 'Push-ups',             sets: 3, reps: '15-20' },
    { name: 'Trizeps Overhead',     sets: 3, reps: '10-12' },
  ],
  gym_pull: [
    { name: 'Klimmzüge',               sets: 4, reps: '6-8' },
    { name: 'Rudern vorgebeugt',        sets: 3, reps: '8-10' },
    { name: 'Latzug eng',              sets: 3, reps: '10-12' },
    { name: 'Bizepscurls',             sets: 3, reps: '10-12' },
    { name: 'Face Pulls',              sets: 3, reps: '15' },
    { name: 'Latzug weit',             sets: 3, reps: '10-12' },
    { name: 'Rudern Kabel',            sets: 3, reps: '10-12' },
    { name: 'Hammercurls',             sets: 3, reps: '10-12' },
    { name: 'Reverse Flyes',           sets: 3, reps: '15' },
    { name: 'T-Bar Rudern',            sets: 4, reps: '8-10' },
    { name: 'Einarm Kurzhantelrudern', sets: 3, reps: '10/Seite' },
  ],
  gym_legs: [
    { name: 'Kniebeuge',              sets: 4, reps: '6-8' },
    { name: 'Rumänisches Kreuzheben', sets: 3, reps: '8-10' },
    { name: 'Ausfallschritte',        sets: 3, reps: '10/Bein' },
    { name: 'Wadenheben',             sets: 3, reps: '12-15' },
    { name: 'Plank',                  sets: 3, reps: '45s' },
    { name: 'Beinpresse',             sets: 4, reps: '10-12' },
    { name: 'Bein-Curl',              sets: 3, reps: '10-12' },
    { name: 'Hip Thrust',             sets: 3, reps: '10-12' },
    { name: 'Sumo Kniebeuge',         sets: 4, reps: '8-10' },
    { name: 'Bulgarian Split Squat',  sets: 3, reps: '8/Bein' },
    { name: 'Kreuzheben',             sets: 4, reps: '5-6' },
    { name: 'Leg Extension',          sets: 3, reps: '12-15' },
  ],
  kettlebell: [
    { name: 'KB Swings',          sets: 4, reps: '20' },
    { name: 'Goblet Squats',      sets: 3, reps: '12' },
    { name: 'KB Clean & Press',   sets: 3, reps: '8/Seite' },
    { name: 'KB Rows',            sets: 3, reps: '10/Seite' },
    { name: 'Halos',              sets: 2, reps: '10/Seite' },
    { name: 'Turkish Get-Up',     sets: 3, reps: '3/Seite' },
    { name: 'KB Deadlift',        sets: 3, reps: '10' },
    { name: 'KB Snatch',          sets: 3, reps: '8/Seite' },
    { name: 'KB Front Rack Squat',sets: 3, reps: '10' },
    { name: 'KB Windmill',        sets: 2, reps: '8/Seite' },
    { name: 'KB Push Press',      sets: 3, reps: '8/Seite' },
  ],
}

const GYM_KB_ACTS = ['gym_push', 'gym_pull', 'gym_legs', 'kettlebell']

const NOTES: Record<string, string> = {
  run:    'Lauf — Distanz im Tab «Lauf-Aufbau» eintragen. Bei Kombi mit Gym am selben Tag: Lauf nach dem Krafttraining einplanen.',
  tennis: 'Tennis — zählt als Konditionsreiz. An einem Gym-Tag eher als lockere Ergänzung, nicht direkt davor.',
  rad:    'Rennrad — lockere bis mittlere Ausfahrt.',
  flex:   'Flex-Tag — Tennis, Rad, ein kurzer Lauf oder Ruhe. Was gerade passt.',
  rest:   'Ruhetag oder leichte Mobility. Erholung ist aktiver Teil des Muskelaufbaus.',
}

const HALF_MARATHON_KM = 21.1
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

// ── Warning system ────────────────────────────────────────────────────
// Based on: Frontiers (2025), Barbell Medicine, PMC 5752732, PMC 7224562,
//           PMC 11359207, PMC 5093324, PLOS ONE 0233134, TrainingPeaks

type Warning = { severity: 'warning' | 'info'; text: string }

const LOWER_STR = ['gym_legs', 'kettlebell']
const UPPER_STR = ['gym_push', 'gym_pull']
const ALL_STR   = [...LOWER_STR, ...UPPER_STR]

function prevDayKey(k: DayKey): DayKey {
  return DAY_KEYS[(DAY_KEYS.indexOf(k) + 6) % 7]
}
function nextDayKey(k: DayKey): DayKey {
  return DAY_KEYS[(DAY_KEYS.indexOf(k) + 1) % 7]
}
function hasAny(acts: string[], keys: string[]): boolean {
  return keys.some(k => acts.includes(k))
}

function analyzeDay(k: DayKey, t: Record<DayKey, string[]>): Warning[] {
  const w: Warning[] = []
  const acts = t[k] ?? []
  const prev = t[prevDayKey(k)] ?? []
  const next = t[nextDayKey(k)] ?? []

  const hasLower   = hasAny(acts, LOWER_STR)
  const hasUpper   = hasAny(acts, UPPER_STR) && !hasLower
  const hasRun     = acts.includes('run')
  const hasRad     = acts.includes('rad')
  const hasTennis  = acts.includes('tennis')
  const activeCount = acts.filter(a => a !== 'rest').length

  // Same-day: lower body strength + run
  if (hasLower && hasRun) {
    w.push({ severity: 'warning', text: 'Beintraining + Lauf am selben Tag: Kraft zuerst einplanen. AMPK-Signaling vom Lauf hemmt mTOR bis zu 3h — das bremst Muskelproteinsynthese direkt nach dem Training.' })
  }
  // Same-day: upper body + run
  if (hasUpper && hasRun) {
    w.push({ severity: 'info', text: 'Oberkörper-Kraft + Lauf: Kein Interferenzeffekt. Arm- und Schultermuskulatur werden vom Laufen nicht beeinträchtigt — freie Reihenfolge möglich.' })
  }
  // Same-day: lower body + cycling
  if (hasLower && hasRad && !hasRun) {
    w.push({ severity: 'info', text: 'Rennrad nach Beintraining: Deutlich weniger Interferenz als Laufen — Radfahren hat kaum exzentrischen Belastungsanteil und schont die Muskelstruktur.' })
  }
  // Same-day: lower body + tennis
  if (hasLower && hasTennis && !hasRun) {
    w.push({ severity: 'info', text: 'Tennis + Beintraining: Tennis beansprucht ähnliche neuromuskuläre Kapazitäten. Gym vor Tennis einplanen, nicht umgekehrt.' })
  }
  // Same-day overload
  if (activeCount >= 3) {
    w.push({ severity: 'warning', text: `${activeCount} Trainingseinheiten an einem Tag: Sehr hohe Tageslast. Erholung ist kaum möglich — besser eine Einheit auf morgen verschieben.` })
  }

  // Cross-day: this day → next day
  if (hasLower && next.includes('run')) {
    w.push({ severity: 'warning', text: 'Beintraining heute → Lauf morgen: Exzentrisches Training reduziert Muskelkraft und Laufökonomie bis zu 48h. Der Lauf morgen wird schwerer als erwartet.' })
  }
  if (hasRun && hasAny(next, LOWER_STR)) {
    w.push({ severity: 'info', text: 'Lauf heute → Beintraining morgen: Glykogen nach dem Lauf ggf. noch nicht voll aufgefüllt. Nach dem Lauf bewusst Kohlenhydrate tanken.' })
  }
  if (acts.includes('gym_legs') && next.includes('gym_legs')) {
    w.push({ severity: 'warning', text: 'Bein-Tag morgen ebenfalls: Weniger als 48h Pause zwischen zwei Beineinheiten ist für Hypertrophie suboptimal und erhöht das Verletzungsrisiko.' })
  }
  if (acts.includes('gym_push') && next.includes('gym_push')) {
    w.push({ severity: 'warning', text: 'Push-Tag morgen ebenfalls: Drückende Muskulatur (Brust, Schultern, Trizeps) braucht 48h Pause für optimale Hypertrophie und Verletzungsprävention.' })
  }
  if (acts.includes('gym_pull') && next.includes('gym_pull')) {
    w.push({ severity: 'warning', text: 'Pull-Tag morgen ebenfalls: Ziehende Muskulatur (Rücken, Bizeps) braucht 48h Pause für optimale Entwicklung und Verletzungsprävention.' })
  }
  if (acts.includes('kettlebell') && next.includes('gym_legs')) {
    w.push({ severity: 'info', text: 'Kettlebell heute → Bein-Gym morgen: KB-Übungen wie Swings und Goblet Squats belasten Posterior Chain und Quads ähnlich wie das Beintraining. 48h Pause für Unterkörper optimal.' })
  }
  if (acts.includes('gym_legs') && next.includes('kettlebell')) {
    w.push({ severity: 'info', text: 'Bein-Gym heute → Kettlebell morgen: Unterkörpermuskulatur ist noch in der Erholung. KB-Training morgen mit reduzierter Intensität einplanen.' })
  }

  // Cross-day: previous day → this day
  if (hasRun && hasAny(prev, LOWER_STR)) {
    w.push({ severity: 'warning', text: 'Beintraining gestern → Lauf heute: Muskelkraft und Laufökonomie sind noch eingeschränkt (bis 48h nach exzentrischem Training). Tempo anpassen.' })
  }
  if (hasAny(acts, LOWER_STR) && prev.includes('run')) {
    w.push({ severity: 'info', text: 'Lauf gestern → Beintraining heute: Glykogenspeicher ggf. noch nicht voll aufgefüllt. Vor dem Training gut essen.' })
  }
  if (acts.includes('gym_legs') && prev.includes('gym_legs')) {
    w.push({ severity: 'warning', text: 'Bein-Tag gestern → Beintraining heute: Zu wenig Erholung für optimale Hypertrophie. 48h Pause zwischen Beineinheiten sind ideal.' })
  }
  if (acts.includes('gym_push') && prev.includes('gym_push')) {
    w.push({ severity: 'warning', text: 'Push-Tag gestern → Push heute: Drückende Muskulatur ist noch in der Erholung. 48h Pause zwischen Push-Einheiten für optimale Adaptation.' })
  }
  if (acts.includes('gym_pull') && prev.includes('gym_pull')) {
    w.push({ severity: 'warning', text: 'Pull-Tag gestern → Pull heute: Rücken und Bizeps sind noch in der Erholung. 48h Pause zwischen Pull-Einheiten empfohlen.' })
  }
  if (acts.includes('kettlebell') && prev.includes('gym_legs')) {
    w.push({ severity: 'info', text: 'Bein-Gym gestern → Kettlebell heute: Unterkörpermuskulatur noch in der Erholung. KB-Gewicht und Intensität anpassen.' })
  }
  if (acts.includes('gym_legs') && prev.includes('kettlebell')) {
    w.push({ severity: 'info', text: 'Kettlebell gestern → Bein-Gym heute: KB-Swings und Squats haben posterior chain und Quads bereits belastet. Intensität des Beintrainings bewusst anpassen.' })
  }

  return w
}

function analyzeWeek(t: Record<DayKey, string[]>): Warning[] {
  const w: Warning[] = []
  const restDays = DAY_KEYS.filter(k => t[k]?.every(a => a === 'rest')).length
  const gymDays  = DAY_KEYS.filter(k => hasAny(t[k] ?? [], ALL_STR)).length
  const runDays  = DAY_KEYS.filter(k => (t[k] ?? []).includes('run')).length

  if (restDays === 0)
    w.push({ severity: 'warning', text: 'Kein Ruhetag diese Woche: Mindestens 1–2 echte Erholungstage sind entscheidend für Muskelaufbau, Hormonhaushalt und Verletzungsprävention.' })
  if (gymDays < 2)
    w.push({ severity: 'info', text: 'Weniger als 2 Krafteinheiten: Für Muskelerhalt beim Concurrent Training werden 2–3 Gym-Tage pro Woche empfohlen.' })
  if (runDays >= 3 && gymDays >= 3)
    w.push({ severity: 'info', text: '3+ Lauf- und 3+ Krafttage: Hohes Gesamtvolumen. Auf ausreichend Schlaf und Kohlenhydrate achten — Concurrent Training erhöht den Erholungsbedarf deutlich.' })

  return w
}

function analyzeExercises(actKey: string, exs: Exercise[]): Warning[] {
  const w: Warning[] = []
  const names = exs.map(e => e.name)

  if (actKey === 'gym_push') {
    const chestExs    = ['Bankdrücken', 'Schrägbankdrücken', 'Fliegende Kurzhantel', 'Dips', 'Push-ups']
    const shoulderExs = ['Schulterdrücken', 'Seitheben', 'Frontdrücken', 'Arnold Press']
    if (!names.some(n => chestExs.includes(n)))
      w.push({ severity: 'info', text: 'Keine Brust-Übung erkannt. Bankdrücken, Fliegende oder Dips für Pectoralis-Aufbau empfohlen.' })
    if (!names.some(n => shoulderExs.includes(n)))
      w.push({ severity: 'info', text: 'Keine Schulter-Übung erkannt. Schulterdrücken oder Seitheben für ausgewogenen Push-Tag sinnvoll.' })
  }

  if (actKey === 'gym_pull') {
    const backExs   = ['Klimmzüge', 'Rudern vorgebeugt', 'Latzug eng', 'Latzug weit', 'Rudern Kabel', 'T-Bar Rudern', 'Einarm Kurzhantelrudern']
    const bicepsExs = ['Bizepscurls', 'Hammercurls']
    if (!names.some(n => backExs.includes(n)))
      w.push({ severity: 'warning', text: 'Kein Rücken-Compound erkannt. Klimmzüge oder Rudern sind das Fundament jedes Pull-Tags.' })
    if (!names.some(n => bicepsExs.includes(n)))
      w.push({ severity: 'info', text: 'Keine Bizeps-Isolation erkannt. Curls als letztes Element des Pull-Tags sinnvoll.' })
  }

  if (actKey === 'gym_legs') {
    const quadExs = ['Kniebeuge', 'Beinpresse', 'Ausfallschritte', 'Sumo Kniebeuge', 'Bulgarian Split Squat', 'Leg Extension']
    const hamExs  = ['Rumänisches Kreuzheben', 'Bein-Curl', 'Kreuzheben']
    if (!names.some(n => quadExs.includes(n)))
      w.push({ severity: 'warning', text: 'Kein Quad-Compound erkannt. Kniebeuge oder Beinpresse sind zentral für Oberschenkel-Aufbau.' })
    if (!names.some(n => hamExs.includes(n)))
      w.push({ severity: 'info', text: 'Keine Hamstring-Übung erkannt. Rumänisches Kreuzheben oder Bein-Curl für ausgewogene Beinentwicklung.' })
  }

  if (exs.length > 7)
    w.push({ severity: 'info', text: `${exs.length} Übungen geplant: Mehr als 6–7 Übungen senken die Intensität pro Satz. Qualität vor Quantität.` })
  else if (exs.length < 3 && ['gym_push', 'gym_pull', 'gym_legs'].includes(actKey))
    w.push({ severity: 'info', text: `Nur ${exs.length} Übung(en): Für einen effektiven Gym-Tag sind 4–5 Übungen empfohlen.` })

  return w
}

// ── Storage ──────────────────────────────────────────────────────────

function lsGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}
function lsSet(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────

function isoDate(d: Date) { return d.toISOString().slice(0, 10) }

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  date.setHours(0, 0, 0, 0)
  return date
}

function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function normalizeTemplate(raw: Record<string, string[]> | null): Record<DayKey, string[]> {
  const out = {} as Record<DayKey, string[]>
  for (const k of DAY_KEYS) {
    const v = raw?.[k]
    out[k] = Array.isArray(v) && v.length ? v : [...DEFAULT_TEMPLATE[k]]
  }
  return out
}

function getExercises(actKey: string, custom: Record<string, Exercise[]>): Exercise[] {
  return custom[actKey] ?? EXERCISES[actKey] ?? []
}

// ── Types ─────────────────────────────────────────────────────────────

type RunEntry = { date: string; distance: number; type: 'long' | 'tempo' | 'easy' }

// ── Sub-components ───────────────────────────────────────────────────

function WarningBlock({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) return null
  return (
    <div className="warning-block">
      {warnings.map((w, i) => (
        <div key={i} className={`warning-item warning-item--${w.severity}`}>
          <span className="warning-item__icon">
            {w.severity === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span className="warning-item__text">{w.text}</span>
        </div>
      ))}
    </div>
  )
}

function WeekOverview({
  template, weekStart, onSelect,
}: {
  template: Record<DayKey, string[]>
  weekStart: Date
  onSelect: (k: DayKey) => void
}) {
  return (
    <div className="week-overview">
      {DAY_KEYS.map((k, idx) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + idx)
        const acts = (template[k] ?? []).filter(a => a !== 'rest')
        const isRest = acts.length === 0
        const warnings = analyzeDay(k, template)
        const warnCount = warnings.filter(w => w.severity === 'warning').length
        const infoCount = warnings.filter(w => w.severity === 'info').length

        return (
          <div key={k} className="week-day-row" onClick={() => onSelect(k)}>
            <div className="week-day-row__meta">
              <span className="week-day-row__name">{DAY_LABELS[k]}</span>
              <span className="week-day-row__date">
                {d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>

            <div className="week-day-row__content">
              {isRest ? (
                <span className="week-day-row__rest">Ruhetag</span>
              ) : (
                <div className="week-day-row__chips">
                  {acts.map(a => {
                    const act = ACTIVITY_MAP[a]
                    if (!act) return null
                    return (
                      <span
                        key={a}
                        className="week-day-row__chip"
                        style={{
                          color: ZONE_COLORS[act.zone as Zone],
                          background: ZONE_COLORS[act.zone as Zone] + '14',
                          borderColor: ZONE_COLORS[act.zone as Zone] + '35',
                        }}
                      >
                        {act.label}
                      </span>
                    )
                  })}
                </div>
              )}

              {(warnCount > 0 || infoCount > 0) && (
                <div className="week-day-row__badges">
                  {warnCount > 0 && (
                    <span className="week-day-row__badge week-day-row__badge--warn">
                      ⚠ {warnCount}
                    </span>
                  )}
                  {infoCount > 0 && (
                    <span className="week-day-row__badge week-day-row__badge--info">
                      ℹ {infoCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            <svg className="week-day-row__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B7AB91" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </div>
        )
      })}
    </div>
  )
}

function ExerciseEditor({
  actKey, exercises, onClose, onSave,
}: {
  actKey: string
  exercises: Exercise[]
  onClose: () => void
  onSave: (actKey: string, exs: Exercise[]) => void
}) {
  const [list, setList] = useState<Exercise[]>(() => exercises.map(e => ({ ...e })))
  const [newName, setNewName] = useState('')

  const act = ACTIVITY_MAP[actKey]
  const color = ZONE_COLORS[(act?.zone ?? 'gym') as Zone]
  const lib = EXERCISE_LIBRARY[actKey] ?? []
  const warnings = analyzeExercises(actKey, list)
  const suggestions = lib.filter(l => !list.some(e => e.name === l.name))

  const addFromLib = (ex: { name: string; sets: number; reps: string }) => {
    setList(prev => [...prev, {
      id: 'lib-' + ex.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
    }])
  }

  const addCustom = () => {
    const name = newName.trim()
    if (!name) return
    setList(prev => [...prev, { id: 'custom-' + Date.now(), name, sets: 3, reps: '8-12' }])
    setNewName('')
  }

  const remove = (id: string) => setList(prev => prev.filter(e => e.id !== id))

  const updateSets = (id: string, val: string) => {
    const n = parseInt(val)
    if (!isNaN(n) && n >= 1 && n <= 10)
      setList(prev => prev.map(e => e.id === id ? { ...e, sets: n } : e))
  }

  const updateReps = (id: string, val: string) => {
    setList(prev => prev.map(e => e.id === id ? { ...e, reps: val } : e))
  }

  return (
    <div className="log-sheet-scrim" onClick={onClose}>
      <div className="log-sheet" onClick={e => e.stopPropagation()}>
        <div className="log-sheet__handle" />

        <div className="ex-editor-header">
          <div>
            <div className="log-sheet__eyebrow">Übungen anpassen</div>
            <div className="log-sheet__title" style={{ color }}>{act?.label}</div>
          </div>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => { onSave(actKey, list); onClose() }}
          >
            Speichern
          </button>
        </div>

        {warnings.length > 0 && <WarningBlock warnings={warnings} />}

        {list.length > 0 && (
          <div className="ex-editor-list">
            {list.map(ex => (
              <div key={ex.id} className="ex-editor-row">
                <span className="ex-editor-row__name">{ex.name}</span>
                <div className="ex-editor-row__controls">
                  <input
                    type="number" min="1" max="10" value={ex.sets}
                    onChange={e => updateSets(ex.id, e.target.value)}
                    className="ex-editor-input ex-editor-input--sets"
                  />
                  <span className="ex-editor-row__x">×</span>
                  <input
                    type="text" value={ex.reps}
                    onChange={e => updateReps(ex.id, e.target.value)}
                    className="ex-editor-input ex-editor-input--reps"
                  />
                  <button
                    onClick={() => remove(ex.id)}
                    className="ex-editor-row__del"
                    aria-label="Entfernen"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <>
            <div className="ex-editor-section-label">Vorschläge</div>
            <div className="ex-editor-chips">
              {suggestions.map(l => (
                <button key={l.name} className="ex-editor-chip" onClick={() => addFromLib(l)}>
                  + {l.name}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="ex-editor-custom">
          <input
            type="text"
            placeholder="Eigene Übung eingeben…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom() }}
            className="ex-editor-custom__input"
          />
          <button className="btn btn--secondary btn--sm" onClick={addCustom}>
            Hinzufügen
          </button>
        </div>

        {EXERCISES[actKey] && (
          <button
            className="ex-editor-reset"
            onClick={() => setList(EXERCISES[actKey].map(e => ({ ...e })))}
          >
            ↺ Standard wiederherstellen
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [tab, setTab] = useState<'week' | 'run'>('week')
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [template, setTemplate] = useState<Record<DayKey, string[]>>(DEFAULT_TEMPLATE)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [weights, setWeights] = useState<Record<string, string>>({})
  const [runs, setRuns] = useState<RunEntry[]>([])
  const [runForm, setRunForm] = useState({
    date: isoDate(new Date()),
    distance: '',
    type: 'long' as RunEntry['type'],
  })
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [customExercises, setCustomExercises] = useState<Record<string, Exercise[]>>({})
  const [exerciseEditor, setExerciseEditor] = useState<string | null>(null)

  const weekId = isoDate(weekStart)

  useEffect(() => {
    setChecks(lsGet<Record<string, boolean>>('motus-checks-' + weekId) ?? {})
    setWeights(lsGet<Record<string, string>>('motus-weights') ?? {})
    setRuns(lsGet<RunEntry[]>('motus-runs') ?? [])

    // Week-specific template: try this week, fallback to prev week, fallback to defaults
    const thisWeek = lsGet<Record<string, string[]>>('motus-template-' + weekId)
    if (thisWeek) {
      setTemplate(normalizeTemplate(thisWeek))
    } else {
      const prevDate = new Date(weekId + 'T00:00:00')
      prevDate.setDate(prevDate.getDate() - 7)
      const prevId = isoDate(prevDate)
      const prevWeek = lsGet<Record<string, string[]>>('motus-template-' + prevId)
      // Also check old global key for one-time migration
      const globalFallback = lsGet<Record<string, string[]>>('motus-template')
      setTemplate(normalizeTemplate(prevWeek ?? globalFallback))
    }

    // Custom exercises (global, not per week)
    const custom: Record<string, Exercise[]> = {}
    for (const actKey of GYM_KB_ACTS) {
      const saved = lsGet<Exercise[]>('motus-exercises-' + actKey)
      if (saved) custom[actKey] = saved
    }
    setCustomExercises(custom)
  }, [weekId])

  const toggleCheck = useCallback((exId: string, setIdx: number) => {
    const key = `${exId}-${setIdx}`
    const next = { ...checks, [key]: !checks[key] }
    setChecks(next)
    lsSet('motus-checks-' + weekId, next)
  }, [checks, weekId])

  const updateWeight = useCallback((exId: string, value: string) => {
    const next = { ...weights, [exId]: value }
    setWeights(next)
    lsSet('motus-weights', next)
  }, [weights])

  const toggleActivity = useCallback((dayKey: DayKey, actKey: string) => {
    const current = template[dayKey] ?? []
    let next: string[]
    if (current.includes(actKey)) {
      next = current.filter(a => a !== actKey)
      if (!next.length) next = ['rest']
    } else {
      next = [...current.filter(a => a !== 'rest'), actKey]
    }
    const nextTemplate = { ...template, [dayKey]: next }
    setTemplate(nextTemplate)
    lsSet('motus-template-' + weekId, nextTemplate)
  }, [template, weekId])

  const saveExercises = useCallback((actKey: string, exs: Exercise[]) => {
    lsSet('motus-exercises-' + actKey, exs)
    setCustomExercises(prev => ({ ...prev, [actKey]: exs }))
  }, [])

  const addRun = useCallback(() => {
    if (!runForm.distance) return
    const next = [...runs, { ...runForm, distance: parseFloat(runForm.distance) }]
      .sort((a, b) => a.date.localeCompare(b.date))
    setRuns(next)
    lsSet('motus-runs', next)
    setRunForm({ date: isoDate(new Date()), distance: '', type: 'long' })
  }, [runs, runForm])

  const deleteRun = useCallback((idx: number) => {
    const next = runs.filter((_, i) => i !== idx)
    setRuns(next)
    lsSet('motus-runs', next)
  }, [runs])

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
    setSelectedDay(null)
  }

  const dayDate = (idx: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + idx)
    return d
  }

  const longestRun = runs.length ? Math.max(...runs.map(r => r.distance)) : 0
  const progressPct = Math.min(100, (longestRun / HALF_MARATHON_KM) * 100)
  const weekNum = isoWeekNumber(weekStart)
  const monthName = MONTHS_DE[weekStart.getMonth()]

  const weekWarnings = analyzeWeek(template)

  return (
    <div className="page">

      {/* Header */}
      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">{monthName} · KW {weekNum}</div>
          <div className="app-header__title">Trainingsplan</div>
        </div>
        <button
          className={`btn btn--sm ${editMode ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => { setEditMode(e => !e); setSelectedDay(null) }}
        >
          {editMode ? 'Fertig' : 'Anpassen'}
        </button>
      </div>

      {/* Day strip */}
      <div className="trainer-day-strip">
        {DAY_KEYS.map((k, idx) => {
          const acts = template[k] ?? []
          const date = dayDate(idx)
          const isSelected = selectedDay === k
          const dayWarns = analyzeDay(k, template)
          const hasWarn = dayWarns.some(w => w.severity === 'warning')
          const hasInfo = !hasWarn && dayWarns.some(w => w.severity === 'info')
          const pillClass = [
            'trainer-day-pill',
            isSelected        ? 'trainer-day-pill--active'      : '',
            hasWarn           ? 'trainer-day-pill--has-warning'  : '',
            hasInfo           ? 'trainer-day-pill--has-info'     : '',
          ].filter(Boolean).join(' ')
          return (
            <div
              key={k}
              className={pillClass}
              onClick={() => { setTab('week'); setSelectedDay(prev => prev === k ? null : k) }}
            >
              {hasWarn && <span className="trainer-day-pill__alert trainer-day-pill__alert--warning">!</span>}
              {hasInfo && <span className="trainer-day-pill__alert trainer-day-pill__alert--info">i</span>}

              <div className="trainer-day-pill__dots">
                {acts.map((a, i) => {
                  const zone = (ACTIVITY_MAP[a]?.zone ?? 'rest') as Zone
                  const dotBg = isSelected && zone === 'gym'
                    ? 'rgba(242,237,227,0.7)'
                    : ZONE_COLORS[zone]
                  return <span key={i} className="trainer-day-pill__dot" style={{ background: dotBg }} />
                })}
              </div>
              <span className="trainer-day-pill__label">{DAY_SHORT[k]}</span>
              <span className="trainer-day-pill__date">{date.getDate()}</span>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="trainer-tabs">
        {([['week', 'Diese Woche'], ['run', 'Lauf-Aufbau']] as const).map(([key, label]) => (
          <button
            key={key}
            className={`trainer-tab${tab === key ? ' trainer-tab--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Week tab ── */}
      {tab === 'week' && (
        <div className="trainer-body">

          {/* Edit panel */}
          {editMode && (
            <div className="card card--cream trainer-edit-panel">
              <div className="trainer-edit-panel__title">Tage anpassen</div>
              <div className="trainer-edit-panel__hint">Mehrfachauswahl möglich — z.B. Gym + Lauf am selben Tag.</div>
              {DAY_KEYS.map(k => (
                <div key={k} className="trainer-edit-row">
                  <div className="trainer-edit-row__label">{DAY_LABELS[k]}</div>
                  <div className="trainer-edit-row__chips">
                    {ACTIVITY_TYPES.map(a => {
                      const active = (template[k] ?? []).includes(a.key)
                      return (
                        <button
                          key={a.key}
                          className={`trainer-activity-chip${active ? ' trainer-activity-chip--active' : ''}`}
                          style={active ? {
                            background: ZONE_COLORS[a.zone],
                            borderColor: ZONE_COLORS[a.zone],
                            color: a.zone === 'rest' ? '#1F1F1F' : '#FAF7F1',
                          } : {}}
                          onClick={() => toggleActivity(k, a.key)}
                        >
                          {a.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="trainer-edit-panel__tip">
                Tipp: 3 Gym-Tage halten den Muskelaufbau am Laufen. Läufe gut nach dem Krafttraining einplanen.
              </div>
            </div>
          )}

          {/* Week overview (no day selected) */}
          {!editMode && !selectedDay && (
            <>
              <WeekOverview
                template={template}
                weekStart={weekStart}
                onSelect={k => setSelectedDay(k)}
              />
              {weekWarnings.length > 0 && (
                <div>
                  <div className="section-label">Diese Woche</div>
                  <WarningBlock warnings={weekWarnings} />
                </div>
              )}
            </>
          )}

          {/* Day detail */}
          {!editMode && selectedDay && (
            <>
              <button
                className="trainer-back-btn"
                onClick={() => setSelectedDay(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                Übersicht
              </button>

              <WarningBlock warnings={analyzeDay(selectedDay, template)} />

              <div className="trainer-day-cards">
                {(template[selectedDay] ?? []).map(actKey => {
                  const act = ACTIVITY_MAP[actKey]
                  if (!act) return null
                  const exs = getExercises(actKey, customExercises)
                  const hasExercises = GYM_KB_ACTS.includes(actKey)
                  const date = dayDate(DAY_KEYS.indexOf(selectedDay))
                  const color = ZONE_COLORS[act.zone]
                  return (
                    <div key={actKey} className="card card--cream trainer-card">
                      <div className="trainer-card__header" style={{ borderLeftColor: color }}>
                        <div className="trainer-card__header-top">
                          <div>
                            <div className="trainer-card__eyebrow" style={{ color }}>
                              {DAY_LABELS[selectedDay]} · {date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
                            </div>
                            <div className="trainer-card__title">{act.label}</div>
                          </div>
                          {hasExercises && (
                            <button
                              className="trainer-edit-exercises-btn"
                              onClick={() => setExerciseEditor(actKey)}
                            >
                              Übungen
                            </button>
                          )}
                        </div>
                      </div>

                      {hasExercises && exs.length > 0 ? (
                        <div className="trainer-exercises">
                          {exs.map(ex => (
                            <div key={ex.id} className="trainer-exercise">
                              <div className="trainer-exercise__top">
                                <div className="trainer-exercise__name">{ex.name}</div>
                                <div className="trainer-exercise__meta">{ex.sets}×{ex.reps}</div>
                              </div>
                              <div className="trainer-exercise__bottom">
                                {Array.from({ length: ex.sets }).map((_, si) => {
                                  const done = !!checks[`${ex.id}-${si}`]
                                  return (
                                    <button
                                      key={si}
                                      className={`trainer-set-btn${done ? ' trainer-set-btn--done' : ''}`}
                                      style={done
                                        ? { background: color, borderColor: color, color: act.zone === 'rest' ? '#1F1F1F' : '#FAF7F1' }
                                        : { borderColor: color + '55' }
                                      }
                                      onClick={() => toggleCheck(ex.id, si)}
                                      aria-label={`Satz ${si + 1}`}
                                    >
                                      {si + 1}
                                    </button>
                                  )
                                })}
                                <input
                                  type="text"
                                  placeholder="kg"
                                  value={weights[ex.id] ?? ''}
                                  onChange={e => updateWeight(ex.id, e.target.value)}
                                  className="trainer-weight-input"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="trainer-card__note">{NOTES[actKey] ?? ''}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Week navigation */}
          <div className="trainer-week-nav">
            <button className="btn btn--secondary btn--sm" onClick={() => shiftWeek(-1)}>← Vorwoche</button>
            <button className="btn btn--secondary btn--sm" onClick={() => shiftWeek(1)}>Nächste →</button>
          </div>

        </div>
      )}

      {/* ── Run tab ── */}
      {tab === 'run' && (
        <div className="trainer-body">

          <div className="card card--cream trainer-run-hero">
            <div className="trainer-run-hero__eyebrow">Längster Lauf bisher</div>
            <div className="trainer-run-hero__value">{longestRun.toFixed(1)} km</div>
            <div className="trainer-run-hero__bar">
              <div className="trainer-run-hero__bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="trainer-run-hero__range">
              <span>0 km</span>
              <span>Halbmarathon · {HALF_MARATHON_KM} km</span>
            </div>
          </div>

          <div className="trainer-run-tip">
            Steigere den langen Lauf wöchentlich um ca. 10%, bis ~18 km, dann 2 Wochen Taper.
            Kombi-Tage (Gym + Lauf) eignen sich gut für kurze/lockere Läufe.
          </div>

          <div className="trainer-run-form">
            <input
              type="date"
              value={runForm.date}
              onChange={e => setRunForm(f => ({ ...f, date: e.target.value }))}
              className="trainer-run-form__input"
            />
            <div className="trainer-run-form__row">
              <input
                type="number"
                step="0.1"
                placeholder="km"
                value={runForm.distance}
                onChange={e => setRunForm(f => ({ ...f, distance: e.target.value }))}
                className="trainer-run-form__input trainer-run-form__km"
              />
              <select
                value={runForm.type}
                onChange={e => setRunForm(f => ({ ...f, type: e.target.value as RunEntry['type'] }))}
                className="trainer-run-form__input trainer-run-form__type"
              >
                <option value="long">Langer Lauf</option>
                <option value="tempo">Tempo</option>
                <option value="easy">Locker</option>
              </select>
            </div>
            <button className="btn btn--primary btn--md" onClick={addRun} style={{ width: '100%' }}>
              + Eintragen
            </button>
          </div>

          <div className="trainer-run-log">
            {runs.length === 0 && (
              <div className="trainer-empty">Noch keine Läufe eingetragen.</div>
            )}
            {[...runs].reverse().map((r, i) => {
              const idx = runs.length - 1 - i
              const typeLabel = r.type === 'long' ? 'Lang' : r.type === 'tempo' ? 'Tempo' : 'Locker'
              return (
                <div key={idx} className="trainer-run-entry">
                  <div className="trainer-run-entry__left">
                    <span className="trainer-run-entry__date">{r.date}</span>
                    <span className={`trainer-run-entry__type trainer-run-entry__type--${r.type}`}>
                      {typeLabel}
                    </span>
                  </div>
                  <div className="trainer-run-entry__right">
                    <span className="trainer-run-entry__dist">{r.distance} km</span>
                    <button
                      className="trainer-run-entry__del"
                      onClick={() => deleteRun(idx)}
                      aria-label="Lauf löschen"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* Exercise editor bottom sheet */}
      {exerciseEditor && (
        <ExerciseEditor
          actKey={exerciseEditor}
          exercises={getExercises(exerciseEditor, customExercises)}
          onClose={() => setExerciseEditor(null)}
          onSave={saveExercises}
        />
      )}

    </div>
  )
}
