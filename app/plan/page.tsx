'use client'
import { useState, useEffect, useCallback } from 'react'
import { ExercisePictogram } from '@/components/ExercisePictogram'
import { PhotoSlot } from '@/components/PhotoSlot'
import { ProgressRing } from '@/components/ProgressRing'

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

function zoneTextColor(zone: Zone): string {
  return zone === 'rest' ? '#1F1F1F' : '#FAF7F1'
}


type Activity = { key: string; label: string; zone: Zone }

const ACTIVITY_TYPES: Activity[] = [
  { key: 'gym_training1',      label: 'Training 1',        zone: 'gym' },
  { key: 'gym_training2',      label: 'Training 2',        zone: 'gym' },
  { key: 'gym_training3',      label: 'Training 3',        zone: 'gym' },
  { key: 'kb_training',        label: 'Kettlebell Training', zone: 'home' },
  { key: 'run_long',           label: 'Langer Lauf',       zone: 'run' },
  { key: 'run_intervall',      label: 'Intervall',         zone: 'run' },
  { key: 'run_basic',          label: 'Basic (~5km)',       zone: 'run' },
  { key: 'tennis',             label: 'Tennis',            zone: 'flex' },
  { key: 'rad',                label: 'Rennrad',           zone: 'flex' },
  { key: 'flex',               label: 'Flex / offen',      zone: 'flex' },
  { key: 'rest',               label: 'Ruhetag',           zone: 'rest' },
]

const ACTIVITY_MAP: Record<string, Activity> = Object.fromEntries(
  ACTIVITY_TYPES.map(a => [a.key, a])
)

const DEFAULT_TEMPLATE: Record<DayKey, string[]> = {
  mo: ['gym_training1'],
  di: ['kb_training'],
  mi: ['gym_training2'],
  do: ['flex'],
  fr: ['gym_training3'],
  sa: ['run_long'],
  so: ['rest'],
}

// Migrate old activity keys to the current plan (2026-08-20 coach rework)
const KEY_MIGRATION: Record<string, string> = {
  gym_push:           'gym_training1',
  gym_pull:            'gym_training2',
  gym_legs:            'gym_training3',
  gym_brust_ruecken:   'gym_training1',
  gym_arme_schultern:  'gym_training2',
  gym_beine_core:      'gym_training3',
  gym_rumpf_core:      'gym_training1',
  kettlebell:          'kb_training',
  kb_full:             'kb_training',
  kb_lower:            'kb_training',
  kb_upper:            'kb_training',
  kb_core:             'kb_training',
  run:                 'run_long',
}

type Exercise = { id: string; name: string; sets: number; reps: string; cue?: string }

const EXERCISES: Record<string, Exercise[]> = {
  gym_training1: [
    { id: 'tra1', name: 'Benchpress',                            sets: 5, reps: '6-12' },
    { id: 'tra2', name: 'Lateral Rows',                          sets: 5, reps: '6-12' },
    { id: 'tra3', name: 'Klappmesser mit Ball',                  sets: 5, reps: '6-12' },
    { id: 'tra4', name: 'Bulgarian Split Squat mit Kurzhanteln', sets: 5, reps: '6-12/Bein' },
  ],
  gym_training2: [
    { id: 'trb1', name: 'Cross Crunches', sets: 5, reps: '6-12' },
    { id: 'trb2', name: 'Deadlifts',      sets: 5, reps: '6-12' },
    { id: 'trb3', name: 'Pull-Ups',       sets: 5, reps: 'max' },
    { id: 'trb4', name: 'Push-Ups',       sets: 5, reps: 'max' },
  ],
  gym_training3: [
    { id: 'trc1', name: 'Deep Squats',                                    sets: 5, reps: '6-12' },
    { id: 'trc2', name: 'Dips',                                           sets: 5, reps: '6-12' },
    { id: 'trc3', name: 'Klappmesser / Cross Klappmesser (abwechselnd)',  sets: 5, reps: '6-12' },
    { id: 'trc4', name: 'Reverse Benchpress',                             sets: 5, reps: '6-12' },
  ],
  kb_training: [
    { id: 'kbt1', name: 'Kettlebell Swings',   sets: 4, reps: '15-20',
      cue: 'Kraft nur aus der Hüfte holen. Rücken (bes. unterer Rücken) gerade halten.' },
    { id: 'kbt2', name: 'Russian-Twist',       sets: 4, reps: '20',
      cue: 'KB berührt bei jeder Rotation den Boden (ohne Lärm). Wie im Bild halten oder ganze Kugel greifen (schwieriger).' },
    { id: 'kbt3', name: 'Goblet Squats',       sets: 4, reps: '12',
      cue: 'So tief wie möglich absitzen, unten 0.5s pausieren. Oberkörper aufrecht.' },
    { id: 'kbt4', name: 'Lunge Overheadpress', sets: 4, reps: '8/Seite',
      cue: 'Stabiler Ausfallschritt (Knie Richtung Boden). Ellbogen beim Hochdrücken unter dem KB halten, Oberkörper gerade.' },
  ],
}

const EXERCISE_LIBRARY: Record<string, Array<{ name: string; sets: number; reps: string }>> = {
  gym_training1: [
    { name: 'Benchpress',                            sets: 5, reps: '6-12' },
    { name: 'Lateral Rows',                          sets: 5, reps: '6-12' },
    { name: 'Klappmesser mit Ball',                  sets: 5, reps: '6-12' },
    { name: 'Bulgarian Split Squat mit Kurzhanteln', sets: 5, reps: '6-12/Bein' },
  ],
  gym_training2: [
    { name: 'Cross Crunches', sets: 5, reps: '6-12' },
    { name: 'Deadlifts',      sets: 5, reps: '6-12' },
    { name: 'Pull-Ups',       sets: 5, reps: 'max' },
    { name: 'Push-Ups',       sets: 5, reps: 'max' },
  ],
  gym_training3: [
    { name: 'Deep Squats',                                   sets: 5, reps: '6-12' },
    { name: 'Dips',                                          sets: 5, reps: '6-12' },
    { name: 'Klappmesser / Cross Klappmesser (abwechselnd)', sets: 5, reps: '6-12' },
    { name: 'Reverse Benchpress',                            sets: 5, reps: '6-12' },
  ],
  kb_training: [
    { name: 'Kettlebell Swings',   sets: 4, reps: '15-20' },
    { name: 'Russian-Twist',       sets: 4, reps: '20' },
    { name: 'Goblet Squats',       sets: 4, reps: '12' },
    { name: 'Lunge Overheadpress', sets: 4, reps: '8/Seite' },
  ],
}

const GYM_KB_ACTS = ['gym_training1', 'gym_training2', 'gym_training3', 'kb_training']

// 6-Wochen-Zyklus (Trainingsplan Mischa Weyermann, 20.08.2026): Wochen 1–3 normal,
// Woche 4+6 Deload, Woche 5 Heavy Week. Reihenfolge wiederholt sich danach.
const CYCLE_LENGTH = 6
type CycleType = 'normal' | 'deload' | 'heavy'

const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
  normal: 'Normal', deload: 'Deload', heavy: 'Heavy Week',
}
const CYCLE_TYPE_REPS: Record<CycleType, string> = {
  normal: '6–12 Wdh.',
  deload: '12–16 Wdh. (kein Max)',
  heavy:  '1–3 Wdh. auf Maximalgewicht',
}

function cycleTypeForWeek(weekInCycle: number): CycleType {
  if (weekInCycle === 5) return 'heavy'
  if (weekInCycle === 4 || weekInCycle === 6) return 'deload'
  return 'normal'
}

function cycleWeekInfo(weekStart: Date, cycleStart: Date): { weekInCycle: number; type: CycleType } {
  const diffWeeks = Math.round((weekStart.getTime() - cycleStart.getTime()) / (7 * 86400000))
  const weekInCycle = ((diffWeeks % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH + 1
  return { weekInCycle, type: cycleTypeForWeek(weekInCycle) }
}

// General rules that apply regardless of which week of the cycle it is —
// the week-specific rep target is prepended dynamically at render time.
const GYM_CYCLE_NOTE = '5 Sätze pro Übung (+1 Aufwärmsatz falls nötig), Wiederholungen sinken über die Sätze. Pause: 1:30 normal, 2:00 bei Maximalkraft-Sätzen. Mind. 36–48h Pause zwischen Training 1 und 3 — sonst frei planbar (z.B. Training + Tennis am selben Tag ist ok). Elektrolyte nicht vergessen — Müdigkeit erhöht das Verletzungsrisiko.'

function gymWeekNote(info: { weekInCycle: number; type: CycleType }): string {
  return `Woche ${info.weekInCycle}/6 · ${CYCLE_TYPE_LABELS[info.type]} — Zielbereich: ${CYCLE_TYPE_REPS[info.type]}. ${GYM_CYCLE_NOTE}`
}

const NOTES: Record<string, string> = {
  kb_training:  'Superset-Format, 4 Sets: Übung 1 → 45s Pause → Übung 2 → 45s Pause → wiederholen.',
  run_long:     'Langer Lauf — Pace: 60–70% HRmax, ruhig halten. Wöchentliche Steigerung: ~10%.',
  run_intervall:'Intervall — z.B. 6×800m oder 4×1km. 10 min Aufwärmen, danach lockerer Auslauf. Hohe neuromuskuläre Last.',
  run_basic:    'Basic (~5km) — lockeres, aerobes Tempo. Ideal als Erholung oder Tageseinstieg.',
  tennis:       'Tennis — zählt als Konditionsreiz. An Gym-Tagen eher als lockere Ergänzung.',
  rad:          'Rennrad — lockere bis mittlere Ausfahrt. Weniger Interferenz mit Gym als Laufen.',
  flex:         'Flex-Tag — Tennis, Rad, kurzer Lauf oder Ruhe. Was gerade passt.',
  rest:         'Ruhetag oder leichte Mobility. Erholung ist aktiver Teil des Muskelaufbaus.',
}

const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

// ── Warning system ────────────────────────────────────────────────────
// Tag-based: warnings fire based on actual muscle groups stressed,
// not hardcoded activity names.
//
// Sources: Frontiers (2025), Barbell Medicine, PMC 5752732, PMC 7224562,
//          PMC 11359207, PMC 5093324, PLOS ONE 0233134, TrainingPeaks

type Warning = { severity: 'warning' | 'info'; text: string }

// Training 1/2/3 and Kettlebell Training are full-body sessions (each mixes a
// squat/hinge-pattern lift with press/pull/core work) — unlike the old
// muscle-group split, they all count as both LOWER and UPPER stress.
const LOWER = ['gym_training1', 'gym_training2', 'gym_training3', 'kb_training', 'run_long']
// Activities that significantly stress upper body
const UPPER = ['gym_training1', 'gym_training2', 'gym_training3', 'kb_training']
// Lower-body strength activities (not just cardio)
const STR_LOWER = ['gym_training1', 'gym_training2', 'gym_training3', 'kb_training']
// High-intensity cardio (significant fatigue + leg stress for run_long)
const RUN_HI = ['run_long', 'run_intervall']
// Low-intensity cardio
const RUN_LO = ['run_basic', 'rad']
// All gym/kb strength activities
const ALL_STR = [...GYM_KB_ACTS]

function anyIn(acts: string[], keys: string[]): boolean {
  return keys.some(k => acts.includes(k))
}

function prevDayKey(k: DayKey): DayKey {
  return DAY_KEYS[(DAY_KEYS.indexOf(k) + 6) % 7]
}
function nextDayKey(k: DayKey): DayKey {
  return DAY_KEYS[(DAY_KEYS.indexOf(k) + 1) % 7]
}

function analyzeDay(k: DayKey, t: Record<DayKey, string[]>): Warning[] {
  const w: Warning[] = []
  const acts = t[k] ?? []
  const prev = t[prevDayKey(k)] ?? []
  const next = t[nextDayKey(k)] ?? []

  const aLower    = anyIn(acts, LOWER)
  const aStrLower = anyIn(acts, STR_LOWER)
  const aRunHi    = anyIn(acts, RUN_HI)
  const aRunLo    = anyIn(acts, RUN_LO) && !aRunHi
  const aRad      = acts.includes('rad')
  const aTennis   = acts.includes('tennis')
  const activeCount = acts.filter(a => a !== 'rest').length

  const nLower    = anyIn(next, LOWER)
  const nStrLower = anyIn(next, STR_LOWER)
  const nRunHi    = anyIn(next, RUN_HI)
  const nRunLo    = anyIn(next, RUN_LO) && !nRunHi

  const pLower    = anyIn(prev, LOWER)
  const pStrLower = anyIn(prev, STR_LOWER)
  const pRunHi    = anyIn(prev, RUN_HI)
  const pRunLo    = anyIn(prev, RUN_LO) && !pRunHi

  // ── Same-day ─────────────────────────────────────────────────────

  if (aStrLower && aRunHi)
    w.push({ severity: 'warning', text: 'Unterkörper-Kraft + intensiver Lauf am selben Tag: Kraft zuerst einplanen. AMPK-Signaling vom Laufen hemmt mTOR bis 3h — Muskelproteinsynthese wird gebremst.' })
  else if (aStrLower && aRunLo)
    w.push({ severity: 'info', text: 'Unterkörper-Training + lockerer Lauf: Gym zuerst, dann Laufen. Kurze, lockere Läufe nach dem Training sind gut verträglich.' })

  if (!aLower && anyIn(acts, UPPER) && (aRunHi || aRunLo))
    w.push({ severity: 'info', text: 'Oberkörper-Einheit + Lauf am selben Tag: Kein Interferenzeffekt auf Beine — freie Reihenfolge möglich.' })

  if (aStrLower && aRad && !aRunHi)
    w.push({ severity: 'info', text: 'Beintraining + Rennrad: Deutlich weniger Interferenz als Laufen — kein exzentrischer Belastungsanteil beim Radfahren.' })

  if (aStrLower && aTennis && !aRunHi)
    w.push({ severity: 'info', text: 'Beintraining + Tennis: Gym zuerst einplanen — Tennis beansprucht ähnliche neuromuskuläre Kapazitäten.' })

  if (activeCount >= 3)
    w.push({ severity: 'warning', text: `${activeCount} Einheiten heute: Sehr hohe Tageslast — echte Erholung kaum möglich. Besser eine Einheit verschieben.` })

  // ── Today → tomorrow ────────────────────────────────────────────

  if (aLower && nRunHi)
    w.push({ severity: 'warning', text: 'Unterkörper heute → intensiver Lauf morgen: Exzentrisches Training beeinträchtigt Laufökonomie bis 48h. Morgen Tempo anpassen.' })
  else if (aStrLower && nRunLo)
    w.push({ severity: 'info', text: 'Unterkörper-Kraft heute → lockerer Lauf morgen: Beine noch in der Erholung. Locker laufen ist ok, auf Körpergefühl achten.' })

  if (aRunHi && nLower)
    w.push({ severity: 'warning', text: 'Intensiver Lauf heute → Unterkörper morgen: Glykogen und Muskeln noch nicht voll erholt. Gut essen und schlafen.' })
  else if (aRunLo && nStrLower)
    w.push({ severity: 'info', text: 'Lockerer Lauf heute → Unterkörper-Kraft morgen: Geringe Interferenz. Kohlenhydrate nach dem Lauf tanken.' })

  if (aRunHi && nRunHi)
    w.push({ severity: 'warning', text: 'Intensiver Lauf heute → intensiver Lauf morgen: Zwei harte Cardio-Einheiten hintereinander — Erholung nicht ausreichend. Eine Einheit locker halten.' })

  // Same training day tomorrow
  const GYM_TYPES = ['gym_training1', 'gym_training2', 'gym_training3'] as const
  const GYM_WARN_LABELS: Record<string, string> = {
    gym_training1: 'Training 1',
    gym_training2: 'Training 2',
    gym_training3: 'Training 3',
  }
  for (const gt of GYM_TYPES) {
    if (acts.includes(gt) && next.includes(gt))
      w.push({ severity: 'warning', text: `${GYM_WARN_LABELS[gt]} morgen ebenfalls: Weniger als 48h Pause ist für Hypertrophie suboptimal und erhöht das Verletzungsrisiko.` })
  }

  // Training 1 ↔ Training 3 specifically need the 36–48h gap (coach's explicit rule).
  // Other day combinations are confirmed flexible (e.g. Training + Tennis same day is fine).
  if ((acts.includes('gym_training1') && next.includes('gym_training3')) ||
      (acts.includes('gym_training3') && next.includes('gym_training1')))
    w.push({ severity: 'warning', text: 'Training 1 und Training 3 mit weniger als 36–48h Abstand: Laut Plan mindestens 36–48h Pause dazwischen einhalten.' })

  // ── Yesterday → today ───────────────────────────────────────────

  if (pLower && aRunHi)
    w.push({ severity: 'warning', text: 'Unterkörper gestern → intensiver Lauf heute: Muskulatur noch in der Erholung. Tempo bewusst reduzieren.' })
  else if (pStrLower && aRunLo)
    w.push({ severity: 'info', text: 'Unterkörper-Kraft gestern → lockerer Lauf heute: Beine noch leicht ermüdet. Auf Körpergefühl achten.' })

  if (pRunHi && aLower)
    w.push({ severity: 'warning', text: 'Intensiver Lauf gestern → Unterkörper heute: Energiespeicher und Muskeln noch nicht voll erholt. Gewichte ggf. reduzieren.' })
  else if (pRunLo && aStrLower)
    w.push({ severity: 'info', text: 'Lockerer Lauf gestern → Unterkörper-Kraft heute: Geringe Interferenz. Vor dem Training ausreichend essen.' })

  if (pRunHi && aRunHi)
    w.push({ severity: 'warning', text: 'Intensiver Lauf gestern → intensiver Lauf heute: Tempo heute deutlich reduzieren oder auf Recovery-Lauf wechseln.' })

  // Same training day yesterday
  for (const gt of GYM_TYPES) {
    if (prev.includes(gt) && acts.includes(gt))
      w.push({ severity: 'warning', text: `${GYM_WARN_LABELS[gt]} gestern → heute: Zu wenig Erholung für optimale Hypertrophie. 48h Pause zwischen identischen Einheiten.` })
  }

  // Training 1 ↔ Training 3 specifically (same rule, other direction)
  if ((prev.includes('gym_training1') && acts.includes('gym_training3')) ||
      (prev.includes('gym_training3') && acts.includes('gym_training1')))
    w.push({ severity: 'warning', text: 'Training 1 und Training 3 mit weniger als 36–48h Abstand: Laut Plan mindestens 36–48h Pause dazwischen einhalten.' })

  return w
}

function analyzeWeek(t: Record<DayKey, string[]>): Warning[] {
  const w: Warning[] = []
  const restDays = DAY_KEYS.filter(k => t[k]?.every(a => a === 'rest')).length
  const strDays  = DAY_KEYS.filter(k => anyIn(t[k] ?? [], ALL_STR)).length
  const runDays  = DAY_KEYS.filter(k => anyIn(t[k] ?? [], [...RUN_HI, ...RUN_LO])).length
  const hiRunDays = DAY_KEYS.filter(k => anyIn(t[k] ?? [], RUN_HI)).length

  if (restDays === 0)
    w.push({ severity: 'warning', text: 'Kein Ruhetag diese Woche: Mindestens 1–2 echte Erholungstage sind entscheidend für Muskelaufbau, Hormonhaushalt und Verletzungsprävention.' })
  if (strDays < 2)
    w.push({ severity: 'info', text: 'Weniger als 2 Krafteinheiten: Für Muskelerhalt beim Concurrent Training werden 2–3 Gym/KB-Tage pro Woche empfohlen.' })
  if (hiRunDays >= 3)
    w.push({ severity: 'info', text: '3+ intensive Laufeinheiten (Lang/Intervall): Hohes Cardio-Volumen. Mindestens einen Lauf durch Basic (~5km) ersetzen.' })
  if (runDays >= 3 && strDays >= 3)
    w.push({ severity: 'info', text: '3+ Lauf- und 3+ Krafttage: Hohes Gesamtvolumen — Concurrent Training erhöht den Erholungsbedarf. Auf Schlaf und Kohlenhydrate achten.' })

  return w
}

function analyzeExercises(actKey: string, exs: Exercise[]): Warning[] {
  const w: Warning[] = []

  if (exs.length > 7)
    w.push({ severity: 'info', text: `${exs.length} Übungen geplant: Mehr als 6–7 senken die Intensität pro Satz. Qualität vor Quantität.` })
  else if (exs.length < 3 && GYM_KB_ACTS.includes(actKey))
    w.push({ severity: 'info', text: `Nur ${exs.length} Übung(en): Für einen effektiven Trainingstag 4–5 Übungen empfohlen.` })

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

// Local calendar date as YYYY-MM-DD — NOT d.toISOString(), which converts to UTC
// and rolls back a day in timezones ahead of UTC (e.g. midnight CEST → previous day).
function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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
    const migrated = Array.isArray(v)
      ? [...new Set(v.map(a => KEY_MIGRATION[a] ?? a).filter(a => ACTIVITY_MAP[a]))]
      : []
    out[k] = migrated.length ? migrated : [...DEFAULT_TEMPLATE[k]]
  }
  return out
}

function getExercises(actKey: string, custom: Record<string, Exercise[]>): Exercise[] {
  return custom[actKey] ?? EXERCISES[actKey] ?? []
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Noch wach?'
  if (h < 11) return 'Guten Morgen'
  if (h < 17) return 'Guten Tag'
  if (h < 22) return 'Guten Abend'
  return 'Noch wach?'
}

// ── Sub-components ───────────────────────────────────────────────────

function WarningBlock({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) return null
  return (
    <div className="warning-block">
      {warnings.map((w, i) => (
        <div key={i} className={`warning-item warning-item--${w.severity}`}>
          <span className="warning-item__icon">{w.severity === 'warning' ? '⚠' : 'ℹ'}</span>
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

        const iconZone = (ACTIVITY_MAP[acts[0]]?.zone ?? 'rest') as Zone
        const iconColor = isRest ? '#E8E1D2' : ZONE_COLORS[iconZone]

        return (
          <div key={k} className="week-day-row" onClick={() => onSelect(k)}>
            <div className="week-day-row__icon" style={{ background: iconColor, color: zoneTextColor(isRest ? 'rest' : iconZone) }}>
              {d.getDate()}
            </div>
            <div className="week-day-row__content">
              <span className="week-day-row__name">{DAY_LABELS[k]}</span>
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
                          background: ZONE_COLORS[act.zone as Zone],
                          color: zoneTextColor(act.zone as Zone),
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
                  {warnCount > 0 && <span className="week-day-row__badge week-day-row__badge--warn">⚠ {warnCount}</span>}
                  {infoCount > 0 && <span className="week-day-row__badge week-day-row__badge--info">ℹ {infoCount}</span>}
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
      name: ex.name, sets: ex.sets, reps: ex.reps,
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

  const updateReps = (id: string, val: string) =>
    setList(prev => prev.map(e => e.id === id ? { ...e, reps: val } : e))

  return (
    <div className="log-sheet-scrim" onClick={onClose}>
      <div className="log-sheet" onClick={e => e.stopPropagation()}>
        <div className="log-sheet__handle" />
        <div className="ex-editor-header">
          <div>
            <div className="log-sheet__eyebrow">Übungen anpassen</div>
            <div className="log-sheet__title" style={{ color }}>{act?.label}</div>
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => { onSave(actKey, list); onClose() }}>
            Speichern
          </button>
        </div>

        {warnings.length > 0 && <WarningBlock warnings={warnings} />}

        {list.length > 0 && (
          <div className="ex-editor-list">
            {list.map(ex => (
              <div key={ex.id} className="ex-editor-row">
                <div className="ex-editor-row__label">
                  <ExercisePictogram name={ex.name} className="ex-editor-row__icon" />
                  <span className="ex-editor-row__name">{ex.name}</span>
                </div>
                <div className="ex-editor-row__controls">
                  <input type="number" min="1" max="10" value={ex.sets}
                    onChange={e => updateSets(ex.id, e.target.value)}
                    className="ex-editor-input ex-editor-input--sets" />
                  <span className="ex-editor-row__x">×</span>
                  <input type="text" value={ex.reps}
                    onChange={e => updateReps(ex.id, e.target.value)}
                    className="ex-editor-input ex-editor-input--reps" />
                  <button onClick={() => remove(ex.id)} className="ex-editor-row__del" aria-label="Entfernen">
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
                <button key={l.name} className="ex-editor-chip" onClick={() => addFromLib(l)}>+ {l.name}</button>
              ))}
            </div>
          </>
        )}

        <div className="ex-editor-custom">
          <input type="text" placeholder="Eigene Übung eingeben…" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom() }}
            className="ex-editor-custom__input" />
          <button className="btn btn--secondary btn--sm" onClick={addCustom}>Hinzufügen</button>
        </div>

        {EXERCISES[actKey] && (
          <button className="ex-editor-reset" onClick={() => setList(EXERCISES[actKey].map(e => ({ ...e })))}>
            ↺ Standard wiederherstellen
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [template, setTemplate] = useState<Record<DayKey, string[]>>(DEFAULT_TEMPLATE)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [weights, setWeights] = useState<Record<string, string>>({})
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [customExercises, setCustomExercises] = useState<Record<string, Exercise[]>>({})
  const [exerciseEditor, setExerciseEditor] = useState<string | null>(null)
  const [cycleStart, setCycleStart] = useState<Date>(() => getMonday(new Date()))

  const weekId = isoDate(weekStart)

  // Cycle start is a global setting, loaded once (not tied to the viewed week).
  useEffect(() => {
    const saved = lsGet<string>('motus-cycle-start')
    if (saved) setCycleStart(new Date(saved + 'T00:00:00'))
  }, [])

  const updateCycleStart = useCallback((dateStr: string) => {
    const d = getMonday(new Date(dateStr + 'T00:00:00'))
    setCycleStart(d)
    lsSet('motus-cycle-start', isoDate(d))
  }, [])

  useEffect(() => {
    setChecks(lsGet<Record<string, boolean>>('motus-checks-' + weekId) ?? {})
    setWeights(lsGet<Record<string, string>>('motus-weights') ?? {})

    const thisWeek = lsGet<Record<string, string[]>>('motus-template-' + weekId)
    if (thisWeek) {
      setTemplate(normalizeTemplate(thisWeek))
    } else {
      const prevDate = new Date(weekId + 'T00:00:00')
      prevDate.setDate(prevDate.getDate() - 7)
      const prevId = isoDate(prevDate)
      const prevWeek = lsGet<Record<string, string[]>>('motus-template-' + prevId)
      const globalFallback = lsGet<Record<string, string[]>>('motus-template')
      setTemplate(normalizeTemplate(prevWeek ?? globalFallback))
    }

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

  const todayKey: DayKey = DAY_KEYS[(new Date().getDay() + 6) % 7]

  const jumpToToday = useCallback(() => {
    setWeekStart(getMonday(new Date()))
    setSelectedDay(todayKey)
    setEditMode(false)
  }, [todayKey])

  const weekActKeys = [...new Set(DAY_KEYS.flatMap(k => template[k] ?? []))]
    .filter(a => GYM_KB_ACTS.includes(a))
  let totalSets = 0
  let doneSets = 0
  for (const actKey of weekActKeys) {
    for (const ex of getExercises(actKey, customExercises)) {
      totalSets += ex.sets
      for (let si = 0; si < ex.sets; si++) {
        if (checks[`${ex.id}-${si}`]) doneSets++
      }
    }
  }
  const weekProgressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  const weekNum = isoWeekNumber(weekStart)
  const monthName = MONTHS_DE[weekStart.getMonth()]
  const weekWarnings = analyzeWeek(template)

  return (
    <div className="page">

      <div className="app-header">
        <div className="app-header__text">
          <div className="app-header__eyebrow">{greeting()}</div>
          <div className="app-header__title">Trainingsplan</div>
          <div className="app-header__sub">{monthName} · KW {weekNum}</div>
        </div>
        <div className="app-header__actions">
          <button
            className={`btn btn--sm ${editMode ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => { setEditMode(e => !e); setSelectedDay(null) }}
          >
            {editMode ? 'Fertig' : 'Anpassen'}
          </button>
          <PhotoSlot
            src="/avatar.jpg"
            alt="Profil"
            fallbackColor="#C24B2E"
            className="app-header__avatar"
            fallback={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
              </svg>
            }
          />
        </div>
      </div>

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
            isSelected ? 'trainer-day-pill--active' : '',
            hasWarn    ? 'trainer-day-pill--has-warning' : '',
            hasInfo    ? 'trainer-day-pill--has-info' : '',
          ].filter(Boolean).join(' ')
          return (
            <div key={k} className={pillClass}
              onClick={() => setSelectedDay(prev => prev === k ? null : k)}>
              {hasWarn && <span className="trainer-day-pill__alert trainer-day-pill__alert--warning">!</span>}
              {hasInfo && <span className="trainer-day-pill__alert trainer-day-pill__alert--info">i</span>}
              <div className="trainer-day-pill__dots">
                {acts.map((a, i) => {
                  const zone = (ACTIVITY_MAP[a]?.zone ?? 'rest') as Zone
                  const dotBg = isSelected && zone === 'gym' ? 'rgba(242,237,227,0.7)' : ZONE_COLORS[zone]
                  return <span key={i} className="trainer-day-pill__dot" style={{ background: dotBg }} />
                })}
              </div>
              <span className="trainer-day-pill__label">{DAY_SHORT[k]}</span>
              <span className="trainer-day-pill__date">{date.getDate()}</span>
            </div>
          )
        })}
      </div>

      <div className="trainer-body">

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
                        <button key={a.key}
                          className={`trainer-activity-chip${active ? ' trainer-activity-chip--active' : ''}`}
                          style={active ? {
                            background: ZONE_COLORS[a.zone],
                            borderColor: ZONE_COLORS[a.zone],
                            color: zoneTextColor(a.zone),
                          } : {}}
                          onClick={() => toggleActivity(k, a.key)}>
                          {a.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="trainer-edit-panel__tip">
                Tipp: 3 Gym-Tage halten den Muskelaufbau am Laufen. Intensiver Lauf erst nach dem Krafttraining.
              </div>
            </div>
          )}

          {!editMode && !selectedDay && (
            <>
              <div className="card card--ink dash-hero">
                <div className="dash-hero__info">
                  <div className="dash-hero__eyebrow">Diese Woche</div>
                  <div className="dash-hero__title">{doneSets} / {totalSets} Sätze</div>
                  <button className="btn btn--primary btn--sm" onClick={jumpToToday}>Heute weiter</button>
                </div>
                <ProgressRing pct={weekProgressPct} track="rgba(250,247,241,0.14)" fill="#C24B2E">
                  <div className="dash-hero__pct">{weekProgressPct}%</div>
                </ProgressRing>
              </div>

              <div className="dash-quick-actions">
                <button className="dash-quick-action" onClick={jumpToToday}>
                  <span className="dash-quick-action__icon" style={{ background: '#C24B2E' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </span>
                  Heute trainieren
                </button>
                <button className="dash-quick-action" onClick={() => { setEditMode(true); setSelectedDay(null) }}>
                  <span className="dash-quick-action__icon" style={{ background: '#1F1F1F' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAF7F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  </span>
                  Plan anpassen
                </button>
              </div>

              <div className="card card--cream dash-cycle">
                <div className="dash-cycle__header">
                  <div className="dash-cycle__title">Trainingszyklus</div>
                  <label className="dash-cycle__start">
                    Woche 1 ab
                    <input
                      type="date"
                      value={isoDate(cycleStart)}
                      onChange={e => updateCycleStart(e.target.value)}
                    />
                  </label>
                </div>
                <div className="dash-cycle__rows">
                  {Array.from({ length: CYCLE_LENGTH }).map((_, i) => {
                    const d = new Date(weekStart)
                    d.setDate(d.getDate() + i * 7)
                    const info = cycleWeekInfo(d, cycleStart)
                    const isCurrent = i === 0
                    return (
                      <div key={i} className={`dash-cycle-row${isCurrent ? ' dash-cycle-row--current' : ''}`}>
                        <span className="dash-cycle-row__label">
                          {isCurrent ? 'Diese Woche' : `KW ${isoWeekNumber(d)}`}
                        </span>
                        <span className={`dash-cycle-row__type dash-cycle-row__type--${info.type}`}>
                          Wo {info.weekInCycle} · {CYCLE_TYPE_LABELS[info.type]}
                        </span>
                        <span className="dash-cycle-row__reps">{CYCLE_TYPE_REPS[info.type]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <WeekOverview template={template} weekStart={weekStart} onSelect={k => setSelectedDay(k)} />
              {weekWarnings.length > 0 && (
                <div>
                  <div className="section-label">Diese Woche</div>
                  <WarningBlock warnings={weekWarnings} />
                </div>
              )}
            </>
          )}

          {!editMode && selectedDay && (
            <>
              <button className="trainer-back-btn" onClick={() => setSelectedDay(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                Übersicht
              </button>

              <WarningBlock warnings={analyzeDay(selectedDay, template)} />

              <div className="trainer-day-cards">
                {(template[selectedDay] ?? []).map(actKey => {
                  const act = ACTIVITY_MAP[actKey]
                  if (!act) return null
                  const hasExercises = GYM_KB_ACTS.includes(actKey)
                  const exs = getExercises(actKey, customExercises)
                  const date = dayDate(DAY_KEYS.indexOf(selectedDay))
                  const color = ZONE_COLORS[act.zone]
                  const isGymTraining = actKey === 'gym_training1' || actKey === 'gym_training2' || actKey === 'gym_training3'
                  const noteText = isGymTraining ? gymWeekNote(cycleWeekInfo(weekStart, cycleStart)) : NOTES[actKey]
                  return (
                    <div key={actKey} className="card card--cream trainer-card">
                      <div className="sess-card" style={{ background: color }}>
                        <span className="sess-card__badge">
                          {DAY_LABELS[selectedDay]} · {date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
                        </span>
                        {hasExercises && <span className="sess-card__duration">{exs.length} Übungen</span>}
                        {hasExercises && (
                          <button className="sess-card__edit-btn" onClick={() => setExerciseEditor(actKey)} aria-label="Übungen anpassen">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                        )}
                        <div className="sess-card__content">
                          <div className="sess-card__title">{act.label}</div>
                        </div>
                      </div>

                      {noteText && <div className="trainer-card__note">{noteText}</div>}

                      {hasExercises && exs.length > 0 && (
                        <div className="trainer-exercises">
                          {exs.map(ex => {
                            const firstUndone = Array.from({ length: ex.sets })
                              .findIndex((_, si) => !checks[`${ex.id}-${si}`])
                            return (
                              <div key={ex.id} className="trainer-exercise">
                                <div className="trainer-exercise__top">
                                  <div className="trainer-exercise__label">
                                    <div className="trainer-exercise__icon-tile" style={{ background: color + '14', color }}>
                                      <ExercisePictogram name={ex.name} className="trainer-exercise__icon" />
                                    </div>
                                    <div className="trainer-exercise__name">{ex.name}</div>
                                  </div>
                                  <div className="trainer-exercise__meta">{ex.sets}×{ex.reps}</div>
                                </div>
                                {ex.cue && <div className="trainer-exercise__cue">{ex.cue}</div>}
                                <div className="trainer-exercise__bottom">
                                  {Array.from({ length: ex.sets }).map((_, si) => {
                                    const done = !!checks[`${ex.id}-${si}`]
                                    const isActive = !done && si === firstUndone
                                    const state = done ? 'done' : isActive ? 'active' : 'next'
                                    const style = done
                                      ? { background: color, borderColor: color, color: zoneTextColor(act.zone) }
                                      : isActive
                                        ? { background: color + '14', borderColor: color, color }
                                        : { borderColor: color + '55' }
                                    return (
                                      <button key={si}
                                        className={`trainer-set-btn${state !== 'next' ? ` trainer-set-btn--${state}` : ''}`}
                                        style={style}
                                        onClick={() => toggleCheck(ex.id, si)}
                                        aria-label={`Satz ${si + 1}`}>
                                        {si + 1}
                                      </button>
                                    )
                                  })}
                                  <input type="text" placeholder="kg"
                                    value={weights[ex.id] ?? ''}
                                    onChange={e => updateWeight(ex.id, e.target.value)}
                                    className="trainer-weight-input" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="trainer-week-nav">
            <button className="btn btn--secondary btn--sm" onClick={() => shiftWeek(-1)}>← Vorwoche</button>
            <button className="btn btn--secondary btn--sm" onClick={() => shiftWeek(1)}>Nächste →</button>
          </div>
      </div>

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
