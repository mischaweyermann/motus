const DAYS = [
    { key: 'mon', short: 'Mo', full: 'Montag' },
    { key: 'tue', short: 'Di', full: 'Dienstag' },
    { key: 'wed', short: 'Mi', full: 'Mittwoch' },
    { key: 'thu', short: 'Do', full: 'Donnerstag' },
    { key: 'fri', short: 'Fr', full: 'Freitag' },
    { key: 'sat', short: 'Sa', full: 'Samstag' },
    { key: 'sun', short: 'So', full: 'Sonntag' },
];
const JS_TO_KEY = ['sun','mon','tue','wed','thu','fri','sat'];
const todayKey  = JS_TO_KEY[new Date().getDay()];

let state = { plan: {} };
let selectedDay  = null;
let editingId    = null;

// ── Persistence ──────────────────────────────────────────────
function load() {
    try {
        const raw = localStorage.getItem('motus_v1');
        if (raw) state = JSON.parse(raw);
    } catch (_) {}
    DAYS.forEach(d => { if (!state.plan[d.key]) state.plan[d.key] = []; });
}
function save() {
    localStorage.setItem('motus_v1', JSON.stringify(state));
}
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Week grid ─────────────────────────────────────────────────
function renderGrid() {
    const grid = document.getElementById('weekGrid');
    grid.innerHTML = '';
    DAYS.forEach(day => {
        const exs   = state.plan[day.key] || [];
        const count = exs.length;
        const dots  = Math.min(count, 4);
        const card  = document.createElement('div');
        card.className = [
            'day-card',
            day.key === selectedDay ? 'active'  : '',
            day.key === todayKey    ? 'today'   : '',
        ].join(' ').trim();

        card.innerHTML = `
            <div class="day-label">${day.short}</div>
            <div class="day-count ${count > 0 ? 'filled' : ''}">${count > 0 ? count : '—'}</div>
            <div class="day-dots">${'<div class="day-dot"></div>'.repeat(dots)}</div>
        `;
        card.title = count === 0
            ? `${day.full}: Kein Training`
            : `${day.full}: ${count} Übung${count > 1 ? 'en' : ''}`;
        card.onclick = () => selectDay(day.key);
        grid.appendChild(card);
    });
}

// ── Day panel ─────────────────────────────────────────────────
function selectDay(key) {
    selectedDay = key;
    renderGrid();
    renderPanel();
    const panel = document.getElementById('dayPanel');
    panel.classList.add('visible');
    requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function renderPanel() {
    const day  = DAYS.find(d => d.key === selectedDay);
    const exs  = state.plan[selectedDay] || [];
    const isToday = selectedDay === todayKey;

    document.getElementById('panelTitle').textContent = day.full;
    document.getElementById('panelMeta').textContent  =
        isToday ? '📅 Heute' : (exs.length === 0 ? 'Kein Training geplant' : `${exs.length} Übung${exs.length !== 1 ? 'en' : ''}`);

    const list = document.getElementById('exerciseList');
    if (exs.length === 0) {
        list.innerHTML = `
            <div class="exercise-empty">
                <span class="empty-icon">🏋️</span>
                Noch keine Übungen für diesen Tag.<br>Füge deine erste Übung hinzu!
            </div>`;
    } else {
        list.innerHTML = exs.map((ex, i) => `
            <div class="exercise-item" data-id="${ex.id}">
                <div class="exercise-num">${i + 1}</div>
                <div class="exercise-info">
                    <div class="exercise-name">${esc(ex.name)}</div>
                    <div class="exercise-tags">
                        ${ex.category ? `<span class="tag accent">${esc(ex.category)}</span>` : ''}
                        ${ex.sets   ? `<span class="tag">${ex.sets} Sätze</span>` : ''}
                        ${ex.reps   ? `<span class="tag">${ex.reps} Wdh.</span>` : ''}
                        ${ex.weight ? `<span class="tag">${ex.weight} kg</span>` : ''}
                    </div>
                    ${ex.note ? `<div class="exercise-note">${esc(ex.note)}</div>` : ''}
                </div>
                <div class="exercise-actions">
                    <button class="btn-icon" onclick="moveUp('${ex.id}')" title="Nach oben">↑</button>
                    <button class="btn-icon" onclick="moveDown('${ex.id}')" title="Nach unten">↓</button>
                    <button class="btn-icon" onclick="openEditModal('${ex.id}')" title="Bearbeiten">✏</button>
                    <button class="btn-icon del" onclick="deleteExercise('${ex.id}')" title="Löschen">✕</button>
                </div>
            </div>
        `).join('');
    }

    const copyRow  = document.getElementById('copyRow');
    const copyBtns = document.getElementById('copyButtons');
    if (exs.length > 0) {
        copyRow.style.display = 'flex';
        copyBtns.innerHTML = DAYS
            .filter(d => d.key !== selectedDay)
            .map(d => `<button onclick="copyTo('${d.key}')">${d.short}</button>`)
            .join('');
    } else {
        copyRow.style.display = 'none';
    }
}

// ── Exercise CRUD ─────────────────────────────────────────────
function moveUp(id) {
    const arr = state.plan[selectedDay];
    const i   = arr.findIndex(e => e.id === id);
    if (i > 0) { [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; save(); renderPanel(); }
}
function moveDown(id) {
    const arr = state.plan[selectedDay];
    const i   = arr.findIndex(e => e.id === id);
    if (i < arr.length - 1) { [arr[i+1], arr[i]] = [arr[i], arr[i+1]]; save(); renderPanel(); }
}
function deleteExercise(id) {
    state.plan[selectedDay] = state.plan[selectedDay].filter(e => e.id !== id);
    save(); renderGrid(); renderPanel();
    toast('Übung gelöscht');
}
function copyTo(targetKey) {
    const src    = state.plan[selectedDay] || [];
    const newExs = src.map(ex => ({ ...ex, id: uid() }));
    state.plan[targetKey] = [...(state.plan[targetKey] || []), ...newExs];
    save(); renderGrid();
    const targetDay = DAYS.find(d => d.key === targetKey);
    toast(`Plan nach ${targetDay.full} kopiert`);
}

function clearAllConfirm() {
    if (confirm('Wirklich den gesamten Plan zurücksetzen? Alle Übungen werden gelöscht.')) {
        state = { plan: {} };
        DAYS.forEach(d => state.plan[d.key] = []);
        save(); selectedDay = null;
        document.getElementById('dayPanel').classList.remove('visible');
        renderGrid();
        toast('Plan zurückgesetzt');
    }
}

// ── Modal ─────────────────────────────────────────────────────
function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Übung hinzufügen';
    clearForm();
    showModal();
}
function openEditModal(id) {
    const ex = state.plan[selectedDay].find(e => e.id === id);
    if (!ex) return;
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Übung bearbeiten';
    document.getElementById('exName').value     = ex.name     || '';
    document.getElementById('exSets').value     = ex.sets     || '';
    document.getElementById('exReps').value     = ex.reps     || '';
    document.getElementById('exWeight').value   = ex.weight   || '';
    document.getElementById('exCategory').value = ex.category || '';
    document.getElementById('exNote').value     = ex.note     || '';
    showModal();
}
function showModal() {
    document.getElementById('modalOverlay').classList.add('visible');
    setTimeout(() => document.getElementById('exName').focus(), 100);
}
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('visible');
}
function clearForm() {
    ['exName','exSets','exReps','exWeight','exNote'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('exCategory').value = '';
}

function saveExercise() {
    const name = document.getElementById('exName').value.trim();
    if (!name) {
        const input = document.getElementById('exName');
        input.focus();
        input.style.borderColor = 'var(--red)';
        setTimeout(() => input.style.borderColor = '', 1200);
        return;
    }
    const ex = {
        id:       editingId || uid(),
        name,
        sets:     parseInt(document.getElementById('exSets').value)     || null,
        reps:     parseInt(document.getElementById('exReps').value)     || null,
        weight:   parseFloat(document.getElementById('exWeight').value) || null,
        category: document.getElementById('exCategory').value           || null,
        note:     document.getElementById('exNote').value.trim()        || null,
    };
    if (editingId) {
        const idx = state.plan[selectedDay].findIndex(e => e.id === editingId);
        if (idx >= 0) state.plan[selectedDay][idx] = ex;
        toast('Übung gespeichert');
    } else {
        state.plan[selectedDay].push(ex);
        toast('Übung hinzugefügt');
    }
    save(); closeModal(); renderGrid(); renderPanel();
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer = null;
function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Utils ─────────────────────────────────────────────────────
function esc(str) {
    return String(str || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Events ───────────────────────────────────────────────────
document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && document.getElementById('modalOverlay').classList.contains('visible')) {
        saveExercise();
    }
});

// ── Init ─────────────────────────────────────────────────────
load();
renderGrid();
selectDay(todayKey);
