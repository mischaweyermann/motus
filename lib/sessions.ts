export interface Exercise {
  name: string
  sets: number
  reps: number
  weight: number
}

export interface Session {
  id: string
  name: string
  type: 'Gym' | 'Tennis' | 'Cycle' | 'Run' | 'Mobility'
  difficulty: string
  duration: number
  kcal: number
  exercises: Exercise[]
}

export const SESSIONS: Session[] = [
  {
    id: 'push-upper',
    name: 'Push · Upper Body',
    type: 'Gym',
    difficulty: 'Mittel',
    duration: 42,
    kcal: 320,
    exercises: [
      { name: 'Bench Press',      sets: 4, reps: 8,  weight: 72.5 },
      { name: 'Incline DB Press', sets: 3, reps: 10, weight: 22.5 },
      { name: 'Overhead Press',   sets: 4, reps: 8,  weight: 45   },
      { name: 'Cable Flys',       sets: 3, reps: 12, weight: 14   },
      { name: 'Lateral Raises',   sets: 3, reps: 15, weight: 8    },
      { name: 'Tricep Pushdown',  sets: 3, reps: 12, weight: 20   },
    ],
  },
  {
    id: 'pull-back',
    name: 'Pull · Back & Bi',
    type: 'Gym',
    difficulty: 'Mittel',
    duration: 48,
    kcal: 340,
    exercises: [
      { name: 'Pull-Ups',    sets: 4, reps: 8,  weight: 0  },
      { name: 'Barbell Row', sets: 4, reps: 8,  weight: 60 },
      { name: 'Lat Pulldown',sets: 3, reps: 10, weight: 55 },
      { name: 'Cable Row',   sets: 3, reps: 12, weight: 45 },
      { name: 'Bicep Curls', sets: 3, reps: 12, weight: 15 },
      { name: 'Hammer Curls',sets: 3, reps: 12, weight: 14 },
    ],
  },
  {
    id: 'topspin',
    name: 'Topspin Drill',
    type: 'Tennis',
    difficulty: 'Fortgeschritten',
    duration: 60,
    kcal: 450,
    exercises: [
      { name: 'Warm-Up Rally',        sets: 1, reps: 10, weight: 0 },
      { name: 'Cross-Court Topspin',  sets: 3, reps: 20, weight: 0 },
      { name: 'Down-the-Line',        sets: 3, reps: 20, weight: 0 },
      { name: 'Serve Practice',       sets: 4, reps: 10, weight: 0 },
    ],
  },
  {
    id: 'endurance',
    name: 'Endurance · Z2',
    type: 'Cycle',
    difficulty: 'Easy',
    duration: 90,
    kcal: 620,
    exercises: [
      { name: 'Warm-Up',      sets: 1, reps: 1, weight: 0 },
      { name: 'Zone 2 Block', sets: 1, reps: 1, weight: 0 },
      { name: 'Cool-Down',    sets: 1, reps: 1, weight: 0 },
    ],
  },
  {
    id: 'long-run',
    name: 'Long Run',
    type: 'Run',
    difficulty: 'Easy',
    duration: 84,
    kcal: 560,
    exercises: [
      { name: 'Easy Pace',    sets: 1, reps: 1, weight: 0 },
      { name: 'Steady State', sets: 1, reps: 1, weight: 0 },
    ],
  },
]

export function getSession(id: string): Session {
  return SESSIONS.find(s => s.id === id) ?? SESSIONS[0]
}
