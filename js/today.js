function setDate() {
  const el = document.getElementById('todayDate');
  if (!el) return;
  const now = new Date();
  const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  el.textContent = `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]}`;
}

const LOG_SPORTS = [
  { id: 'gym',     label: 'Gym',    icon: '<path d="M6 11h4M14 11h4M10 8v6M14 8v6M3 11h3M18 11h3"/>' },
  { id: 'tennis',  label: 'Tennis', icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z"/>' },
  { id: 'cycle',   label: 'Cycle',  icon: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h3l3 6M10 8l-1-3h3"/>' },
  { id: 'run',     label: 'Run',    icon: '<circle cx="14" cy="4.5" r="2"/><path d="M9 21l1.5-6L7 12.5l2-6 3 2.5 3.5-1M14 21l-2-6 3-3.5"/>' },
  { id: 'ride',    label: 'Ride',   icon: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h3l3 6M10 8l-1-3h3"/>' },
  { id: 'other',   label: 'Sonstiges', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
];

let selectedSport = null;

function renderLogSports() {
  const grid = document.getElementById('logSportGrid');
  if (!grid) return;
  grid.innerHTML = LOG_SPORTS.map(s =>
    `<button class="log-sheet__sport-btn${selectedSport === s.id ? ' selected' : ''}" onclick="selectSport('${s.id}')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>
      ${s.label}
    </button>`
  ).join('');
}

function selectSport(id) {
  selectedSport = id;
  renderLogSports();
}

setDate();
renderLogSports();
