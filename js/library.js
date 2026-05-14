let activeFilter = 'all';

function renderSessions(filter) {
  const grid  = document.getElementById('sessionsGrid');
  const label = document.getElementById('sessionsLabel');
  const featured = document.getElementById('featuredCard');
  if (!grid) return;

  const visible = filter === 'all'
    ? SESSIONS
    : SESSIONS.filter(s => s.type === filter);

  // Featured card: show first visible session (excluding the featured slot)
  const featured_session = visible[0] || SESSIONS[0];
  if (featured) {
    featured.style.display = visible.length ? '' : 'none';
    featured.onclick = () => { location.href = `player.html?session=${featured_session.id}`; };
    featured.querySelector('.featured-card__badge').textContent = featured_session.difficulty;
    featured.querySelector('.featured-card__duration').textContent = featured_session.duration + "'";
    featured.querySelector('.featured-card__title').textContent = featured_session.name;
    featured.querySelector('.featured-card__sub').textContent =
      `${featured_session.exercises.length} Übungen · ~${featured_session.kcal} kcal`;
    featured.querySelector('.featured-card__symbol').textContent = typeSymbol(featured_session.type);
  }

  const gridSessions = visible.slice(1);
  if (label) label.textContent = `${gridSessions.length} Sessions`;

  grid.innerHTML = gridSessions.map(s => `
    <div class="sess-thumb sess-thumb--${typeClass(s.type)}"
         onclick="location.href='player.html?session=${s.id}'">
      <span class="sess-thumb__badge">${s.difficulty}</span>
      <span class="sess-thumb__duration">${s.duration}'</span>
      <div class="sess-thumb__content">
        <div class="sess-thumb__title">${s.name}</div>
      </div>
      <span class="sess-thumb__symbol">${typeSymbol(s.type)}</span>
    </div>
  `).join('');
}

// Filter chips
document.getElementById('filterRow').addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.filter;
  renderSessions(activeFilter);
});

renderSessions('all');
