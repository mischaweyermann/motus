// ── Shared session data ────────────────────────────────────────
const SESSIONS = [
  {
    id: 'push-upper',
    name: 'Push · Upper Body',
    type: 'Gym',
    difficulty: 'Mittel',
    duration: 42,
    kcal: 320,
    exercises: [
      { name: 'Bench Press',       sets: 4, reps: 8,  weight: 72.5 },
      { name: 'Incline DB Press',  sets: 3, reps: 10, weight: 22.5 },
      { name: 'Overhead Press',    sets: 4, reps: 8,  weight: 45   },
      { name: 'Cable Flys',        sets: 3, reps: 12, weight: 14   },
      { name: 'Lateral Raises',    sets: 3, reps: 15, weight: 8    },
      { name: 'Tricep Pushdown',   sets: 3, reps: 12, weight: 20   },
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
      { name: 'Pull-Ups',          sets: 4, reps: 8,  weight: 0    },
      { name: 'Barbell Row',       sets: 4, reps: 8,  weight: 60   },
      { name: 'Lat Pulldown',      sets: 3, reps: 10, weight: 55   },
      { name: 'Cable Row',         sets: 3, reps: 12, weight: 45   },
      { name: 'Bicep Curls',       sets: 3, reps: 12, weight: 15   },
      { name: 'Hammer Curls',      sets: 3, reps: 12, weight: 14   },
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
      { name: 'Warm-Up Rally',     sets: 1, reps: 10, weight: 0 },
      { name: 'Cross-Court Topspin', sets: 3, reps: 20, weight: 0 },
      { name: 'Down-the-Line',     sets: 3, reps: 20, weight: 0 },
      { name: 'Serve Practice',    sets: 4, reps: 10, weight: 0 },
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
      { name: 'Warm-Up',           sets: 1, reps: 1, weight: 0 },
      { name: 'Zone 2 Block',      sets: 1, reps: 1, weight: 0 },
      { name: 'Cool-Down',         sets: 1, reps: 1, weight: 0 },
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
      { name: 'Easy Pace',         sets: 1, reps: 1, weight: 0 },
      { name: 'Steady State',      sets: 1, reps: 1, weight: 0 },
    ],
  },
  {
    id: 'mobility',
    name: 'Full Body Mobility',
    type: 'Mobility',
    difficulty: 'Easy',
    duration: 30,
    kcal: 120,
    exercises: [
      { name: 'Hip Flexor Stretch', sets: 2, reps: 30, weight: 0 },
      { name: 'Thoracic Rotation',  sets: 2, reps: 15, weight: 0 },
      { name: 'Pigeon Pose',        sets: 2, reps: 60, weight: 0 },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT · Full Body',
    type: 'Gym',
    difficulty: 'Fortgeschritten',
    duration: 35,
    kcal: 480,
    exercises: [
      { name: 'Burpees',           sets: 4, reps: 12, weight: 0 },
      { name: 'Jump Squats',       sets: 4, reps: 15, weight: 0 },
      { name: 'Mountain Climbers', sets: 4, reps: 20, weight: 0 },
      { name: 'Box Jumps',         sets: 3, reps: 10, weight: 0 },
    ],
  },
  {
    id: 'morning-ride',
    name: 'Morning Ride',
    type: 'Cycle',
    difficulty: 'Easy',
    duration: 72,
    kcal: 480,
    exercises: [
      { name: 'Warm-Up Spin',      sets: 1, reps: 1, weight: 0 },
      { name: 'Main Set',          sets: 1, reps: 1, weight: 0 },
      { name: 'Cool-Down',         sets: 1, reps: 1, weight: 0 },
    ],
  },
];

function getSession(id) {
  return SESSIONS.find(s => s.id === id) || SESSIONS[0];
}

// ── Toast ──────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ── Type → CSS class map ───────────────────────────────────────
function typeClass(type) {
  return { Gym: 'gym', Tennis: 'tennis', Cycle: 'cycle', Run: 'run', Mobility: 'mobility' }[type] || 'default';
}

// ── Type → symbol ──────────────────────────────────────────────
function typeSymbol(type) {
  return { Gym: '+', Tennis: '◉', Cycle: '◎', Run: '↗', Mobility: '✦' }[type] || '+';
}
