// personal.js — Personal dashboard with card navigation to sub-views
import { state, navigate } from '../app.js?v=7';
import { showToast } from '../app.js?v=7';
import {
  getTodos, addTodo, toggleTodo, removeTodo,
  getExerciseLog, addExerciseEntry,
  lsGet, lsSet
} from '../data.js?v=7';

// ===== SUB-VIEW STATE =====
let subView = 'overview'; // overview | ideas | health | gym | diet | todos
let selectedTodoCat = 'all';

const TODO_CATS = {
  solon: [
    { id: 'school', label: 'Skóli' },
    { id: 'personal', label: 'Persónulegt' },
    { id: 'home', label: 'Heimili' }
  ],
  hekla: [
    { id: 'work', label: 'Vinna' },
    { id: 'personal', label: 'Persónulegt' },
    { id: 'home', label: 'Heimili' }
  ]
};

const BODY_PARTS = [
  { group: 'Overkroppur', parts: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms'] },
  { group: 'Undirkroppur', parts: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  { group: 'Miðja', parts: ['Core / Abs'] },
  { group: 'Annað', parts: ['Full body', 'Cardio only'] }
];

const INTENSITY = ['Létt', 'Miðlungs', 'Þung', 'Mjög þung'];
const WORKOUT_TYPES = ['Styrktarþjálfun', 'Cardio', 'Blandað'];

// ===== MAIN RENDER =====
export function renderPersonal(el, forceSubView) {
  if (forceSubView) subView = forceSubView;
  const person = state.person;
  const name = person === 'solon' ? 'Sólon' : 'Hekla';

  switch (subView) {
    case 'ideas': renderIdeas(el, person, name); break;
    case 'health': renderHealth(el, person, name); break;
    case 'gym': renderGym(el, person, name); break;
    case 'diet': renderDiet(el, person, name); break;
    case 'todos': renderTodos(el, person, name); break;
    default: renderOverview(el, person, name); break;
  }
}

// ===== OVERVIEW (Cards) =====
function renderOverview(el, person, name) {
  const ideas = getIdeas(person);
  const exercise = getExerciseLog(person);
  const todos = getTodos(person);
  const weekStart = getWeekStart();
  const thisWeekEx = exercise.filter(e => e.date >= weekStart).length;
  const openTodos = todos.filter(t => !t.done).length;

  let html = `<div class="header">
    <h1>Mitt svæði — ${name}</h1>
    <div class="sub">Hugmyndir, heilsa og verkefni</div>
  </div>`;

  // VD card
  const lt = state.longTerm;
  if (lt?.profiles?.vd) {
    const born = new Date(lt.profiles.vd.born);
    const now = new Date();
    const totalDays = Math.floor((now - born) / 86400000);
    const months = Math.floor(totalDays / 30.44);
    const remainDays = totalDays - Math.floor(months * 30.44);
    html += `<div class="ov-card personal-card" data-goto="vd" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="font-size:28px">👶</div>
        <div style="flex:1">
          <div class="ov-title">${lt.profiles.vd.name} <span style="font-size:12px;color:var(--text-light)">→</span></div>
          <div class="ov-subtitle">${months} mánaða${remainDays > 0 ? ` og ${Math.round(remainDays)} daga` : ''} · ${totalDays} daga</div>
        </div>
      </div>
    </div>`;
  }

  // Hugmyndabanki card
  html += `<div class="ov-card personal-card" data-goto="ideas" style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="font-size:28px">💡</div>
      <div style="flex:1">
        <div class="ov-title">Hugmyndabanki <span style="font-size:12px;color:var(--text-light)">→</span></div>
        <div class="ov-subtitle">${ideas.length} ${ideas.length === 1 ? 'hugmynd' : 'hugmyndir'} skráðar</div>
      </div>
    </div>
  </div>`;

  // Heilsa card
  html += `<div class="ov-card personal-card" data-goto="health" style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="font-size:28px">❤️</div>
      <div style="flex:1">
        <div class="ov-title">Heilsa <span style="font-size:12px;color:var(--text-light)">→</span></div>
        <div class="ov-subtitle">Líkamsrækt ${thisWeekEx}x þessa viku · Mataræði</div>
      </div>
    </div>
  </div>`;

  // To-do card
  html += `<div class="ov-card personal-card" data-goto="todos" style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="font-size:28px">✅</div>
      <div style="flex:1">
        <div class="ov-title">Verkefnalisti <span style="font-size:12px;color:var(--text-light)">→</span></div>
        <div class="ov-subtitle">${openTodos} opin verkefni</div>
      </div>
    </div>
  </div>`;

  el.innerHTML = html;

  el.querySelectorAll('[data-goto]').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.goto === 'vd') {
        navigate('#vd');
      } else {
        subView = card.dataset.goto;
        renderPersonal(el);
      }
    });
  });
}

// ===== HUGMYNDABANKI =====
function getIdeas(person) { return lsGet(`ideas_${person}`) || []; }
function saveIdeas(person, items) { lsSet(`ideas_${person}`, items); }

function renderIdeas(el, person, name) {
  const ideas = getIdeas(person);

  let html = `<div style="margin-bottom:8px"><button class="back-btn" data-action="back">← Til baka</button></div>`;
  html += `<div class="header">
    <h1>💡 Hugmyndabanki</h1>
    <div class="sub">${name} · ${ideas.length} hugmyndir</div>
  </div>`;

  // Add form
  html += `<div class="personal-section">
    <input type="text" class="note-input" id="idea-title" placeholder="Titill hugmyndar..." style="width:100%;margin-bottom:8px">
    <textarea class="inbox-textarea" id="idea-desc" placeholder="Lýsing (valkvætt)..." style="min-height:50px"></textarea>
    <button class="inbox-submit" id="idea-add" style="margin-top:8px">Bæta við</button>
  </div>`;

  // Ideas list
  if (ideas.length > 0) {
    html += `<div class="section-title">Hugmyndir</div>`;
    ideas.forEach(idea => {
      const date = new Date(idea.timestamp).toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' });
      html += `<div class="ov-card" style="margin-bottom:8px;position:relative">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="flex:1">
            <div style="font-weight:600;${idea.starred ? 'color:var(--accent)' : ''}">${idea.starred ? '⭐ ' : ''}${escapeHtml(idea.title)}</div>
            ${idea.description ? `<div style="font-size:13px;color:var(--text-light);margin-top:4px">${escapeHtml(idea.description)}</div>` : ''}
            <div style="font-size:11px;color:var(--text-light);margin-top:6px">${date}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="idea-star" data-star="${idea.id}" style="background:none;border:none;font-size:16px;cursor:pointer;padding:4px">${idea.starred ? '⭐' : '☆'}</button>
            <button class="note-delete" data-idea-delete="${idea.id}">✕</button>
          </div>
        </div>
      </div>`;
    });
  } else {
    html += `<div class="empty-state" style="padding:30px 0"><div class="empty-icon">💡</div><div class="empty-text">Enginn hugmyndir ennþá.<br>Skráðu hugmyndirnar þínar!</div></div>`;
  }

  el.innerHTML = html;

  el.querySelector('.back-btn')?.addEventListener('click', () => { subView = 'overview'; renderPersonal(el); });

  el.querySelector('#idea-add')?.addEventListener('click', () => {
    const title = document.getElementById('idea-title')?.value?.trim();
    if (!title) return;
    const desc = document.getElementById('idea-desc')?.value?.trim();
    const items = getIdeas(person);
    items.unshift({
      id: uid(),
      timestamp: new Date().toISOString(),
      title,
      description: desc || '',
      starred: false
    });
    saveIdeas(person, items);
    showToast('Hugmynd skráð!');
    renderIdeas(el, person, name);
  });

  el.querySelector('#idea-title')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); el.querySelector('#idea-add')?.click(); }
  });

  el.querySelectorAll('[data-star]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const items = getIdeas(person);
      const item = items.find(i => i.id === btn.dataset.star);
      if (item) item.starred = !item.starred;
      saveIdeas(person, items);
      renderIdeas(el, person, name);
    });
  });

  el.querySelectorAll('[data-idea-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const items = getIdeas(person).filter(i => i.id !== btn.dataset.ideaDelete);
      saveIdeas(person, items);
      renderIdeas(el, person, name);
    });
  });
}

// ===== HEILSA (overview) =====
function renderHealth(el, person, name) {
  const exercise = getExerciseLog(person);
  const diet = getDietLog(person);
  const weekStart = getWeekStart();
  const thisWeekEx = exercise.filter(e => e.date >= weekStart).length;

  let html = `<div style="margin-bottom:8px"><button class="back-btn" data-action="back">← Til baka</button></div>`;
  html += `<div class="header">
    <h1>❤️ Heilsa</h1>
    <div class="sub">${name}</div>
  </div>`;

  // Líkamsrækt card
  html += `<div class="ov-card personal-card" data-goto="gym" style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="font-size:28px">🏋️</div>
      <div style="flex:1">
        <div class="ov-title">Líkamsrækt <span style="font-size:12px;color:var(--text-light)">→</span></div>
        <div class="ov-subtitle">${thisWeekEx}x þessa viku</div>
      </div>
    </div>
  </div>`;

  // Mataræði card
  html += `<div class="ov-card personal-card" data-goto="diet" style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="font-size:28px">🥗</div>
      <div style="flex:1">
        <div class="ov-title">Mataræði <span style="font-size:12px;color:var(--text-light)">→</span></div>
        <div class="ov-subtitle">${diet.length} færslur skráðar</div>
      </div>
    </div>
  </div>`;

  el.innerHTML = html;

  el.querySelector('.back-btn')?.addEventListener('click', () => { subView = 'overview'; renderPersonal(el); });
  el.querySelectorAll('[data-goto]').forEach(card => {
    card.addEventListener('click', () => {
      subView = card.dataset.goto;
      renderPersonal(el);
    });
  });
}

// ===== GYM TRACKER =====
function renderGym(el, person, name) {
  const exercise = getExerciseLog(person);
  const weekStart = getWeekStart();
  const thisWeekEx = exercise.filter(e => e.date >= weekStart).length;

  let html = `<div style="margin-bottom:8px"><button class="back-btn" data-action="back">← Til baka</button></div>`;
  html += `<div class="header">
    <h1>🏋️ Líkamsrækt</h1>
    <div class="sub">${name} · ${thisWeekEx}x þessa viku</div>
  </div>`;

  // Log form
  html += `<div class="personal-section">
    <div class="section-title">Skrá æfingu</div>

    <label class="form-label">Dagsetning</label>
    <input type="date" class="note-input" id="gym-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;margin-bottom:10px">

    <label class="form-label">Tegund</label>
    <div class="gym-type-row" style="display:flex;gap:6px;margin-bottom:10px">
      ${WORKOUT_TYPES.map((t, i) => `<button class="todo-cat gym-type-btn ${i === 0 ? 'active' : ''}" data-wtype="${t}">${t}</button>`).join('')}
    </div>

    <label class="form-label">Líkamshlutar</label>
    <div class="gym-bodyparts" style="margin-bottom:10px">
      ${BODY_PARTS.map(g => `
        <div style="margin-bottom:6px">
          <div style="font-size:11px;color:var(--text-light);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">${g.group}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${g.parts.map(p => `<label class="bp-chip"><input type="checkbox" class="bp-check" value="${p}"><span>${p}</span></label>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <label class="form-label">Lengd (mínútur)</label>
    <input type="number" class="note-input" id="gym-duration" placeholder="t.d. 60" style="width:100%;margin-bottom:10px">

    <label class="form-label">Álagsstig</label>
    <div class="gym-intensity-row" style="display:flex;gap:6px;margin-bottom:10px">
      ${INTENSITY.map((t, i) => `<button class="todo-cat gym-int-btn ${i === 1 ? 'active' : ''}" data-intensity="${t}">${t}</button>`).join('')}
    </div>

    <label class="form-label">Kaloríur (valkvætt)</label>
    <input type="number" class="note-input" id="gym-calories" placeholder="Úr úri" style="width:100%;margin-bottom:10px">

    <label class="form-label">Meðalhjartslátttur (valkvætt)</label>
    <input type="number" class="note-input" id="gym-hr" placeholder="Úr úri" style="width:100%;margin-bottom:10px">

    <label class="form-label">Dagbók (valkvætt)</label>
    <textarea class="inbox-textarea" id="gym-notes" placeholder="Hvernig gekk æfingin?" style="min-height:50px"></textarea>

    <button class="inbox-submit" id="gym-save" style="margin-top:10px;width:100%">Skrá æfingu</button>
  </div>`;

  // Exercise log
  if (exercise.length > 0) {
    html += `<div class="section-title">Æfingalog</div>`;
    exercise.slice(0, 20).forEach(e => {
      const dateStr = new Date(e.date + 'T12:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });
      const parts = e.bodyParts?.length ? e.bodyParts.join(', ') : '';
      html += `<div class="ov-card" style="margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-weight:600">${e.workoutType || e.type || 'Æfing'}</div>
            ${parts ? `<div style="font-size:12px;color:var(--text-light);margin-top:2px">${parts}</div>` : ''}
            ${e.duration ? `<div style="font-size:12px;color:var(--text-light)">${e.duration} mín · ${e.intensity || ''}</div>` : ''}
            ${e.notes ? `<div style="font-size:12px;color:var(--text-light);margin-top:4px;font-style:italic">"${escapeHtml(typeof e.notes === 'string' ? e.notes.slice(0, 80) : '')}"</div>` : ''}
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--text-light)">${dateStr}</div>
            ${e.calories ? `<div style="font-size:11px;color:var(--text-light)">${e.calories} kcal</div>` : ''}
            ${e.heartRate ? `<div style="font-size:11px;color:var(--text-light)">${e.heartRate} bpm</div>` : ''}
          </div>
        </div>
      </div>`;
    });
  }

  el.innerHTML = html;

  // Back
  el.querySelector('.back-btn')?.addEventListener('click', () => { subView = 'health'; renderPersonal(el); });

  // Type buttons
  let selectedType = WORKOUT_TYPES[0];
  el.querySelectorAll('.gym-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.gym-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.wtype;
    });
  });

  // Intensity buttons
  let selectedIntensity = INTENSITY[1];
  el.querySelectorAll('.gym-int-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.gym-int-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedIntensity = btn.dataset.intensity;
    });
  });

  // Save
  el.querySelector('#gym-save')?.addEventListener('click', () => {
    const date = document.getElementById('gym-date')?.value;
    const duration = document.getElementById('gym-duration')?.value;
    const calories = document.getElementById('gym-calories')?.value;
    const hr = document.getElementById('gym-hr')?.value;
    const notes = document.getElementById('gym-notes')?.value?.trim();
    const bodyParts = Array.from(el.querySelectorAll('.bp-check:checked')).map(cb => cb.value);

    addExerciseEntry(person, {
      date: date || new Date().toISOString().split('T')[0],
      workoutType: selectedType,
      bodyParts,
      duration: duration ? parseInt(duration) : undefined,
      intensity: selectedIntensity,
      calories: calories ? parseInt(calories) : undefined,
      heartRate: hr ? parseInt(hr) : undefined,
      notes: notes || undefined
    });

    showToast('Æfing skráð!');
    renderGym(el, person, name);
  });
}

// ===== MATARÆÐI =====
function getDietLog(person) { return lsGet(`diet_${person}`) || []; }
function saveDietLog(person, items) { lsSet(`diet_${person}`, items); }

function renderDiet(el, person, name) {
  const entries = getDietLog(person);

  let html = `<div style="margin-bottom:8px"><button class="back-btn" data-action="back">← Til baka</button></div>`;
  html += `<div class="header">
    <h1>🥗 Mataræði</h1>
    <div class="sub">${name}</div>
  </div>`;

  // Add entry
  html += `<div class="personal-section">
    <textarea class="inbox-textarea" id="diet-text" placeholder="Skráðu færslu um mataræði..." style="min-height:60px"></textarea>
    <button class="inbox-submit" id="diet-add" style="margin-top:8px">Bæta við</button>
  </div>`;

  // Entries
  if (entries.length > 0) {
    html += `<div class="section-title">Færslur</div>`;
    entries.forEach(e => {
      const date = new Date(e.timestamp).toLocaleString('is-IS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      html += `<div class="ov-card" style="margin-bottom:6px;position:relative">
        <div class="inbox-item-text">${escapeHtml(e.text)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
          <div style="font-size:11px;color:var(--text-light)">${date}</div>
          <button class="note-delete" data-diet-delete="${e.id}">✕</button>
        </div>
      </div>`;
    });
  } else {
    html += `<div class="empty-state" style="padding:30px 0"><div class="empty-icon">🥗</div><div class="empty-text">Engar færslur ennþá</div></div>`;
  }

  el.innerHTML = html;

  el.querySelector('.back-btn')?.addEventListener('click', () => { subView = 'health'; renderPersonal(el); });

  el.querySelector('#diet-add')?.addEventListener('click', () => {
    const text = document.getElementById('diet-text')?.value?.trim();
    if (!text) return;
    const items = getDietLog(person);
    items.unshift({ id: uid(), timestamp: new Date().toISOString(), text });
    saveDietLog(person, items);
    showToast('Færsla skráð!');
    renderDiet(el, person, name);
  });

  el.querySelector('#diet-text')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      el.querySelector('#diet-add')?.click();
    }
  });

  el.querySelectorAll('[data-diet-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const items = getDietLog(person).filter(i => i.id !== btn.dataset.dietDelete);
      saveDietLog(person, items);
      renderDiet(el, person, name);
    });
  });
}

// ===== TO-DO =====
function renderTodos(el, person, name) {
  const todos = getTodos(person);
  const cats = TODO_CATS[person] || TODO_CATS.solon;
  const filtered = selectedTodoCat === 'all' ? todos : todos.filter(t => t.category === selectedTodoCat);
  const sorted = [...filtered.filter(t => !t.done), ...filtered.filter(t => t.done)];
  const openCount = todos.filter(t => !t.done).length;

  let html = `<div style="margin-bottom:8px"><button class="back-btn" data-action="back">← Til baka</button></div>`;
  html += `<div class="header">
    <h1>✅ Verkefnalisti</h1>
    <div class="sub">${name} · ${openCount} opin</div>
  </div>`;

  // Category filter
  html += `<div class="todo-categories">
    <button class="todo-cat ${selectedTodoCat === 'all' ? 'active' : ''}" data-cat="all">Allt</button>`;
  cats.forEach(c => {
    const count = todos.filter(t => t.category === c.id && !t.done).length;
    html += `<button class="todo-cat ${selectedTodoCat === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}${count > 0 ? ` (${count})` : ''}</button>`;
  });
  html += `</div>`;

  // Add input
  html += `<div style="display:flex;gap:8px;margin-bottom:12px">
    <input type="text" class="note-input" id="todo-input" placeholder="Nýtt verkefni..." style="flex:1">
    <select class="note-input" id="todo-cat-select" style="flex:0 0 auto;width:auto">`;
  cats.forEach(c => {
    html += `<option value="${c.id}" ${c.id === (selectedTodoCat !== 'all' ? selectedTodoCat : cats[0].id) ? 'selected' : ''}>${c.label}</option>`;
  });
  html += `</select></div>`;

  // Todo list
  if (sorted.length > 0) {
    sorted.forEach(t => {
      const catLabel = cats.find(c => c.id === t.category)?.label || t.category;
      const date = t.timestamp ? new Date(t.timestamp).toLocaleDateString('is-IS', { day: 'numeric', month: 'short' }) : '';
      html += `<div class="todo-item ${t.done ? 'done' : ''}">
        <input type="checkbox" class="note-check" data-todo-id="${t.id}" ${t.done ? 'checked' : ''}>
        <div style="flex:1">
          <span class="todo-text">${escapeHtml(t.text)}</span>
          <div style="display:flex;gap:6px;align-items:center;margin-top:2px">
            <span class="todo-cat-badge">${catLabel}</span>
            ${date ? `<span style="font-size:10px;color:var(--text-light)">${date}</span>` : ''}
          </div>
        </div>
        <button class="note-delete" data-todo-delete="${t.id}">✕</button>
      </div>`;
    });
  } else {
    html += `<div style="padding:20px 0;color:var(--text-light);font-size:13px;text-align:center">Engin verkefni${selectedTodoCat !== 'all' ? ' í þessum flokki' : ''}</div>`;
  }

  el.innerHTML = html;

  el.querySelector('.back-btn')?.addEventListener('click', () => { subView = 'overview'; renderPersonal(el); });

  el.querySelectorAll('.todo-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTodoCat = btn.dataset.cat;
      renderTodos(el, person, name);
    });
  });

  el.querySelector('#todo-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (!text) return;
      const cat = document.getElementById('todo-cat-select').value;
      addTodo(person, { text, category: cat });
      showToast('Verkefni bætt við!');
      renderTodos(el, person, name);
    }
  });

  el.querySelectorAll('[data-todo-id]').forEach(cb => {
    cb.addEventListener('change', () => {
      toggleTodo(person, cb.dataset.todoId);
      renderTodos(el, person, name);
    });
  });

  el.querySelectorAll('[data-todo-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTodo(person, btn.dataset.todoDelete);
      renderTodos(el, person, name);
    });
  });
}

// ===== HELPERS =====
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(start.getDate() - diff);
  return start.toISOString().split('T')[0];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
