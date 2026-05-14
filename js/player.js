// ── Load session from URL param ────────────────────────────────
const params    = new URLSearchParams(location.search);
const sessionId = params.get('session') || 'push-upper';
const session   = getSession(sessionId);

let currentIndex = 0;
let elapsed      = 0;
let totalSecs    = session.duration * 60;
let playing      = false;
let timerInterval = null;

// Save for complete page
sessionStorage.setItem('motus_last_session', JSON.stringify({
  name:      session.name,
  duration:  session.duration,
  kcal:      session.kcal,
  exercises: session.exercises.length,
}));

// ── DOM refs ───────────────────────────────────────────────────
const elLabel    = document.getElementById('exerciseLabel');
const elTitle    = document.getElementById('sessionTitle');
const elDots     = document.getElementById('progressDots');
const elBadge    = document.getElementById('coverBadge');
const elCounter  = document.getElementById('coverCounter');
const elEyebrow  = document.getElementById('coverEyebrow');
const elName     = document.getElementById('coverName');
const elDetail   = document.getElementById('coverDetail');
const elElapsed  = document.getElementById('elapsed');
const elTotal    = document.getElementById('totalTime');
const elFill     = document.getElementById('trackFill');
const elUpNext   = document.getElementById('upNextList');
const btnPlay    = document.getElementById('btnPlay');
const iconPlay   = document.getElementById('iconPlay');
const iconPause  = document.getElementById('iconPause');

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function renderExercise() {
  const ex    = session.exercises[currentIndex];
  const total = session.exercises.length;

  elLabel.textContent   = `Übung ${currentIndex + 1} / ${total}`;
  elTitle.textContent   = session.name;
  elBadge.textContent   = 'Sätze';
  elCounter.textContent = `${currentIndex + 1} / ${total}`;
  elEyebrow.textContent = session.name.toUpperCase();
  elName.textContent    = ex.name;
  elDetail.textContent  = `${ex.sets} × ${ex.reps}${ex.weight ? ' · ' + ex.weight + ' kg' : ''}`;

  // Progress dots
  elDots.innerHTML = session.exercises.map((_, i) => {
    let cls = '';
    if (i < currentIndex)  cls = 'done';
    if (i === currentIndex) cls = 'active';
    return `<div class="progress-dots__dot ${cls}"></div>`;
  }).join('');

  // Up next
  const nextExs = session.exercises.slice(currentIndex + 1, currentIndex + 4);
  elUpNext.innerHTML = nextExs.map((e, i) => `
    <div class="next-item">
      <div class="next-item__num">${String(currentIndex + 2 + i).padStart(2, '0')}</div>
      <div class="next-item__info">
        <div class="next-item__name">${e.name}</div>
        <div class="next-item__detail">${e.sets} × ${e.reps}${e.weight ? ' · ' + e.weight + ' kg' : ''}</div>
      </div>
    </div>
  `).join('');

  if (nextExs.length === 0) {
    elUpNext.innerHTML = '<div class="next-item"><div class="next-item__num">🏁</div><div class="next-item__info"><div class="next-item__name">Letzte Übung!</div><div class="next-item__detail">Gleich fertig</div></div></div>';
  }
}

function renderTimer() {
  elElapsed.textContent = fmt(elapsed);
  elTotal.textContent   = fmt(totalSecs);
  const pct = Math.min((elapsed / totalSecs) * 100, 100);
  elFill.style.width = pct + '%';
}

function togglePlay() {
  playing = !playing;
  iconPlay.style.display  = playing ? 'none' : '';
  iconPause.style.display = playing ? '' : 'none';

  if (playing) {
    timerInterval = setInterval(() => {
      if (elapsed < totalSecs) {
        elapsed++;
        renderTimer();
      } else {
        clearInterval(timerInterval);
        finishSession();
      }
    }, 1000);
  } else {
    clearInterval(timerInterval);
  }
}

function prevExercise() {
  if (currentIndex > 0) {
    currentIndex--;
    renderExercise();
  }
}

function nextExercise() {
  if (currentIndex < session.exercises.length - 1) {
    currentIndex++;
    renderExercise();
  } else {
    finishSession();
  }
}

function finishSession() {
  clearInterval(timerInterval);
  location.href = 'complete.html';
}

// ── Events ─────────────────────────────────────────────────────
btnPlay.addEventListener('click', togglePlay);
document.getElementById('btnPrev').addEventListener('click', prevExercise);
document.getElementById('btnNext').addEventListener('click', nextExercise);

// ── Init ───────────────────────────────────────────────────────
renderExercise();
renderTimer();
