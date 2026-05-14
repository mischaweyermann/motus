const SETS = [
  { num: 1, reps: 8, kg: 72.5, state: 'done' },
  { num: 2, reps: 8, kg: 72.5, state: 'done' },
  { num: 3, reps: 8, kg: 72.5, state: 'active' },
  { num: 4, reps: 8, kg: 72.5, state: 'next' },
];

const TOTAL_TIME = 60;
let remaining = 37;
let running = false;
let interval = null;

const CIRC = 263.9;

function renderSets() {
  const list = document.getElementById('setsList');
  if (!list) return;
  list.innerHTML = SETS.map(s => {
    const done = s.state === 'done';
    const active = s.state === 'active';
    const badgeHtml = done
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      : active ? `<span class="set-row__badge">Jetzt</span>` : '';
    return `<div class="set-row set-row--${s.state}">
      <span class="set-row__num">${s.num}</span>
      <span class="set-row__reps">${s.reps} × ${s.kg} kg</span>
      ${badgeHtml}
    </div>`;
  }).join('');

  const done = SETS.filter(s => s.state === 'done').length;
  const el = document.getElementById('setsProgress');
  if (el) el.textContent = `${done} von ${SETS.length} erledigt`;
}

function updateRing() {
  const ring = document.getElementById('timerRing');
  const disp = document.getElementById('timerDisplay');
  if (!ring || !disp) return;
  const pct = remaining / TOTAL_TIME;
  ring.setAttribute('stroke-dashoffset', CIRC * (1 - pct));
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  disp.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function tick() {
  if (remaining <= 0) {
    clearInterval(interval);
    running = false;
    updatePlayBtn();
    showToast('Pause vorbei!');
    return;
  }
  remaining--;
  updateRing();
}

function updatePlayBtn() {
  const play = document.getElementById('iconPlay');
  const pause = document.getElementById('iconPause');
  const label = document.getElementById('btnLabel');
  if (!play || !pause || !label) return;
  if (running) {
    play.style.display = 'none';
    pause.style.display = '';
    label.textContent = 'Pause';
  } else {
    play.style.display = '';
    pause.style.display = 'none';
    label.textContent = 'Weiter';
  }
}

function toggleTimer() {
  running = !running;
  if (running) {
    interval = setInterval(tick, 1000);
  } else {
    clearInterval(interval);
  }
  updatePlayBtn();
}

function addTime() {
  remaining = Math.min(remaining + 10, 999);
  updateRing();
  showToast('+10s hinzugefügt');
}

renderSets();
updateRing();
