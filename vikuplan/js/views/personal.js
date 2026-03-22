// personal.js — Personal dashboard (todos, exercise, goals)
import { state, navigate } from '../app.js?v=4';
import { getTodos, addTodo, toggleTodo, removeTodo, getExerciseLog, addExerciseEntry } from '../data.js?v=4';
import { showToast } from '../app.js?v=4';

const CATS = {
  solon: [
    { id: 'school', label: 'Skóli' },
    { id: 'canslim', label: 'CAN SLIM' },
    { id: 'personal', label: 'Persónulegt' }
  ],
  hekla: [
    { id: 'work', label: 'Vinna' },
    { id: 'personal', label: 'Persónulegt' }
  ]
};

const EXERCISE_TYPES = {
  solon: ['Nautilus', 'Hlaupabrétti', 'Golf', 'Annað'],
  hekla: ['World Class', 'Golf', 'Annað']
};

let selectedTodoCat = 'all';

export function renderPersonal(el) {
  const person = state.person;
  const name = person === 'solon' ? 'Sólon' : 'Hekla';
  const todos = getTodos(person);
  const exercise = getExerciseLog(person);
  const cats = CATS[person] || CATS.solon;
  const exerciseTypes = EXERCISE_TYPES[person] || EXERCISE_TYPES.solon;

  // Count this week's exercise
  const weekStart = getWeekStart();
  const thisWeekExercise = exercise.filter(e => e.date >= weekStart).length;

  const filteredTodos = selectedTodoCat === 'all'
    ? todos
    : todos.filter(t => t.category === selectedTodoCat);

  let html = '';

  // Back
  html += `<div style="margin-bottom:8px"><button class="back-btn" data-action="back">← Til baka</button></div>`;

  // Header
  html += `<div class="header">
    <h1>Mitt svæði — ${name}</h1>
    <div class="sub">To-do, rækt og markmið</div>
  </div>`;

  // To-do section
  html += `<div class="personal-section">
    <div class="section-title">Verkefnalisti</div>
    <div class="todo-categories">
      <button class="todo-cat ${selectedTodoCat === 'all' ? 'active' : ''}" data-cat="all">Allt</button>`;
  cats.forEach(c => {
    const count = todos.filter(t => t.category === c.id && !t.done).length;
    html += `<button class="todo-cat ${selectedTodoCat === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}${count > 0 ? ` (${count})` : ''}</button>`;
  });
  html += `</div>`;

  // Add todo input
  html += `<div style="display:flex;gap:8px;margin-bottom:10px">
    <input type="text" class="note-input" id="todo-input" placeholder="Nýtt verkefni..." style="flex:1">
    <select class="note-input" id="todo-cat-select" style="flex:0 0 auto;width:auto">`;
  cats.forEach(c => {
    html += `<option value="${c.id}" ${c.id === (selectedTodoCat !== 'all' ? selectedTodoCat : cats[0].id) ? 'selected' : ''}>${c.label}</option>`;
  });
  html += `</select></div>`;

  // Todo list
  if (filteredTodos.length > 0) {
    // Undone first, then done
    const sorted = [...filteredTodos.filter(t => !t.done), ...filteredTodos.filter(t => t.done)];
    sorted.forEach(t => {
      const catLabel = cats.find(c => c.id === t.category)?.label || t.category;
      html += `<div class="todo-item ${t.done ? 'done' : ''}">
        <input type="checkbox" class="note-check" data-todo-id="${t.id}" ${t.done ? 'checked' : ''}>
        <span class="todo-text">${escapeHtml(t.text)}</span>
        <span class="todo-cat-badge">${catLabel}</span>
        <button class="note-delete" data-todo-delete="${t.id}">✕</button>
      </div>`;
    });
  } else {
    html += `<div style="padding:12px 0;color:var(--text-light);font-size:13px">Enginn verkefni${selectedTodoCat !== 'all' ? ' í þessum flokki' : ''}</div>`;
  }
  html += `</div>`;

  // Exercise section
  html += `<div class="personal-section">
    <div class="section-title">Rækt þessa viku</div>
    <div style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:8px">${thisWeekExercise}x <span style="font-size:14px;color:var(--text-light);font-weight:400">af 2–4x markmiði</span></div>`;

  // Add exercise
  html += `<div class="exercise-form">
    <select id="exercise-type">`;
  exerciseTypes.forEach(t => { html += `<option value="${t}">${t}</option>`; });
  html += `</select>
    <input type="text" id="exercise-notes" placeholder="Athugasemd (valkvætt)">
    <button class="exercise-add-btn" id="exercise-add">+</button>
  </div>`;

  // Exercise log (last 10)
  if (exercise.length > 0) {
    html += `<div class="exercise-log">`;
    exercise.slice(0, 10).forEach(e => {
      const dateStr = new Date(e.date + 'T12:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });
      html += `<div class="exercise-entry">
        <div>
          <span class="type">${e.type}</span>
          ${e.notes ? `<span style="color:var(--text-light);margin-left:8px;font-size:12px">${escapeHtml(e.notes)}</span>` : ''}
        </div>
        <span class="date">${dateStr}</span>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  el.innerHTML = html;

  // Bind events
  el.querySelector('.back-btn')?.addEventListener('click', () => navigate('#yfirlit'));

  // Todo category filter
  el.querySelectorAll('.todo-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTodoCat = btn.dataset.cat;
      renderPersonal(el);
    });
  });

  // Add todo
  el.querySelector('#todo-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (!text) return;
      const cat = document.getElementById('todo-cat-select').value;
      addTodo(person, { text, category: cat });
      showToast('Verkefni bætt við!');
      renderPersonal(el);
    }
  });

  // Toggle todo
  el.querySelectorAll('[data-todo-id]').forEach(cb => {
    cb.addEventListener('change', () => {
      toggleTodo(person, cb.dataset.todoId);
      renderPersonal(el);
    });
  });

  // Delete todo
  el.querySelectorAll('[data-todo-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTodo(person, btn.dataset.todoDelete);
      renderPersonal(el);
    });
  });

  // Add exercise
  el.querySelector('#exercise-add')?.addEventListener('click', () => {
    const type = document.getElementById('exercise-type').value;
    const notes = document.getElementById('exercise-notes').value.trim();
    addExerciseEntry(person, { type, notes: notes || undefined });
    showToast('Æfing skráð!');
    renderPersonal(el);
  });
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start
  const start = new Date(now);
  start.setDate(start.getDate() - diff);
  return start.toISOString().split('T')[0];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
