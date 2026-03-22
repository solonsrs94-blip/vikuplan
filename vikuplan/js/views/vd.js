// vd.js — Viktoría Dís view
import { state, navigate } from '../app.js?v=5';
import { getVdNotes, addVdNote, removeVdNote, getVdGoals, addVdGoal, toggleVdGoal, removeVdGoal } from '../data.js?v=5';
import { showToast } from '../app.js?v=5';

const NOTE_CATS = [
  { id: 'observation', label: '💬 Athugasemd' },
  { id: 'milestone', label: '⭐ Tímamót' },
  { id: 'health', label: '🏥 Heilsa' }
];

let selectedCat = 'observation';

export function renderVd(el) {
  const vd = state.longTerm?.profiles?.vd;
  if (!vd) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">👶</div><div class="empty-text">Engin gögn um VD fundust.</div></div>`;
    return;
  }

  const born = new Date(vd.born);
  const now = new Date();
  const ageMs = now - born;
  const ageDays = Math.floor(ageMs / 86400000);
  const ageMonths = Math.floor(ageDays / 30.44);
  const ageYears = Math.floor(ageMonths / 12);
  const remainMonths = ageMonths % 12;
  const ageStr = ageYears > 0 ? `${ageYears} ár og ${remainMonths} mán` : `${ageMonths} mánaða`;

  const nextBday = new Date(now.getFullYear(), born.getMonth(), born.getDate());
  if (nextBday < now) nextBday.setFullYear(nextBday.getFullYear() + 1);
  const daysToBday = Math.ceil((nextBday - now) / 86400000);

  const notes = getVdNotes();
  const goals = getVdGoals();
  const today = now.getDay(); // 0=sun, 1=mon...
  const isFri = today === 5;

  let html = '';

  // Back button
  html += `<div style="margin-bottom:8px"><button class="back-btn" data-action="back">← Til baka</button></div>`;

  // Header
  html += `<div class="header">
    <h1>👶 ${vd.name}</h1>
    <div class="sub">${ageStr} · ${ageDays} dagar · ${daysToBday} dagar til afmælis</div>
  </div>`;

  // Dagmamma schedule
  html += `<div class="vd-schedule">
    <div class="label">Dagmamma</div>
    <div class="vd-schedule-row ${!isFri ? 'active' : ''}">
      <span class="day">Mán–Fim</span>
      <span class="time">${vd.daycareSchedule.monThu.dropoff} – ${vd.daycareSchedule.monThu.pickup}</span>
    </div>
    <div class="vd-schedule-row ${isFri ? 'active' : ''}">
      <span class="day">Föstudagur</span>
      <span class="time">${vd.daycareSchedule.fri.dropoff} – ${vd.daycareSchedule.fri.pickup}</span>
    </div>
  </div>`;

  // Goals
  html += `<div class="section-title">Markmið</div>`;
  html += `<div class="vd-goals">`;
  goals.forEach(g => {
    html += `<div class="vd-goal ${g.done ? 'done' : ''}">
      <input type="checkbox" class="note-check" data-goal-id="${g.id}" ${g.done ? 'checked' : ''}>
      <span class="goal-text">${escapeHtml(g.text)}</span>
      <button class="note-delete" data-goal-delete="${g.id}">✕</button>
    </div>`;
  });
  html += `<div class="vd-goal-input-row">
    <input type="text" class="note-input" id="vd-goal-input" placeholder="Nýtt markmið...">
  </div>`;
  html += `</div>`;

  // Notes
  html += `<div class="section-title">Athugasemdir</div>`;
  html += `<div class="inbox-categories vd-cats">`;
  NOTE_CATS.forEach(c => {
    html += `<button class="inbox-cat ${c.id === selectedCat ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`;
  });
  html += `</div>`;
  html += `<div class="vd-note-input-row">
    <textarea class="inbox-textarea" id="vd-note-text" placeholder="Skrifa athugasemd..."></textarea>
    <button class="inbox-submit" id="vd-note-add">Bæta við</button>
  </div>`;

  if (notes.length > 0) {
    html += `<div class="vd-notes-list">`;
    notes.forEach(n => {
      const catLabel = NOTE_CATS.find(c => c.id === n.category)?.label || n.category;
      const date = new Date(n.timestamp).toLocaleString('is-IS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      html += `<div class="inbox-item" data-id="${n.id}">
        <span class="inbox-item-cat">${catLabel}</span>
        <button class="inbox-item-delete" data-note-delete="${n.id}">✕</button>
        <div class="inbox-item-text">${escapeHtml(n.text)}</div>
        <div class="inbox-item-time">${date}</div>
      </div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="empty-state" style="padding:20px 0"><div class="empty-text" style="font-size:13px;color:var(--text-light)">Engar athugasemdir ennþá</div></div>`;
  }

  el.innerHTML = html;

  // Bind events
  el.querySelector('.back-btn')?.addEventListener('click', () => navigate('#yfirlit'));

  // Category select
  el.querySelectorAll('.vd-cats .inbox-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCat = btn.dataset.cat;
      renderVd(el);
    });
  });

  // Add note
  el.querySelector('#vd-note-add')?.addEventListener('click', () => {
    const text = document.getElementById('vd-note-text')?.value?.trim();
    if (!text) return;
    addVdNote({ category: selectedCat, text });
    showToast('Bætt við!');
    renderVd(el);
  });

  // Enter in note textarea
  el.querySelector('#vd-note-text')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      el.querySelector('#vd-note-add')?.click();
    }
  });

  // Delete notes
  el.querySelectorAll('[data-note-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeVdNote(btn.dataset.noteDelete);
      renderVd(el);
    });
  });

  // Goal checkbox
  el.querySelectorAll('[data-goal-id]').forEach(cb => {
    cb.addEventListener('change', () => {
      toggleVdGoal(cb.dataset.goalId);
      renderVd(el);
    });
  });

  // Delete goal
  el.querySelectorAll('[data-goal-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeVdGoal(btn.dataset.goalDelete);
      renderVd(el);
    });
  });

  // Add goal on Enter
  el.querySelector('#vd-goal-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (!text) return;
      addVdGoal({ text, person: state.person });
      showToast('Markmiði bætt við!');
      renderVd(el);
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
