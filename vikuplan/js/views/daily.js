// daily.js — Main daily view
import { state, setDay, navigate } from '../app.js?v=7';
import { getCheckin, getDayNotes, addDayNote, removeDayNote, toggleDayNote } from '../data.js?v=7';

const ICONS = ['🌅', '☀️', '🕐', '🌙'];
const PERIODS = ['Morgunn', 'Hádegi', 'Síðdegi', 'Kvöld'];
const PERIOD_KEYS = ['morning', 'midday', 'afternoon', 'evening'];
const ABBR = ['M', 'Þ', 'Mi', 'Fi', 'Fö', 'L', 'S'];

export function renderDaily(el) {
  if (!state.weekData) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">Engin vikugögn fundust.<br>Keyrðu sunnudagsflæðið í Claude Code til að búa til viku.</div>
    </div>`;
    return;
  }

  const d = state.weekData.days[state.selectedDay];
  const isSolon = state.person === 'solon';
  const name = isSolon ? 'Sólon' : 'Hekla';
  const otherName = isSolon ? 'Hekla' : 'Sólon';
  const view = isSolon ? d.solon : d.hekla;
  const otherView = isSolon ? d.hekla : d.solon;
  const tags = view.tags;
  const alert = view.alert;
  const otherAlert = otherView.alert;
  const intentions = state.weekData.intentions;
  const intention = isSolon ? intentions.solon : intentions.hekla;
  const needFromOther = state.weekData.needFromOther?.[state.person];

  const todayIdx = getTodayIdx();
  const checkin = getCheckin(state.weekData.isoWeek);
  const showCheckinBanner = shouldShowCheckin(todayIdx, checkin, state.person);

  let html = '';

  // Header
  html += `<div class="header">
    <h1>Vikuplanið þitt, ${name}</h1>
    <div class="sub">${state.weekData.dateRange} · ${state.weekData.shiftPattern === 'A' ? 'Vika A (þung)' : 'Vika B (létt)'}</div>
  </div>`;

  // Day picker
  html += `<div class="day-picker">`;
  for (let i = 0; i < 7; i++) {
    const dayData = state.weekData.days[i];
    const dateNum = dayData.isoDate.split('-')[2].replace(/^0/, '');
    let cls = 'day-btn';
    if (i === state.selectedDay) cls += ' active';
    if (i === todayIdx && i !== state.selectedDay) cls += ' today';
    html += `<button class="${cls}" data-day="${i}">
      <div class="abbr">${ABBR[i]}</div>
      <div class="num">${dateNum}</div>
      ${i === todayIdx && i !== state.selectedDay ? '<div class="today-dot"></div>' : ''}
    </button>`;
  }
  html += `</div>`;

  // Day header
  html += `<div class="day-header">
    <h2>${d.name}</h2>
    <div class="date">${d.date}</div>
  </div>`;

  // Tags
  html += `<div class="tags">`;
  tags.forEach(t => { html += `<span class="tag">${t}</span>`; });
  html += `</div>`;

  // Alert for self
  if (alert) {
    html += `<div class="alert">⚠️ ${alert}</div>`;
  }

  // Alert about the OTHER person's load
  if (otherAlert) {
    html += `<div class="alert-other">💛 ${otherName}: ${otherAlert}</div>`;
  }

  // Check-in banner (Wed-Sat)
  if (showCheckinBanner) {
    const done = checkin && checkin[state.person];
    html += `<div class="checkin-banner ${done ? 'done' : ''}" data-action="checkin">
      <span class="text">${done ? '✓ Check-in lokið' : 'Miðviku check-in — er vikan á réttri braut?'}</span>
      <span class="arrow">→</span>
    </div>`;
  }

  // Time blocks
  const parts = [view.blocks.morning, view.blocks.midday, view.blocks.afternoon, view.blocks.evening];
  const isoDate = d.isoDate;
  const dayNotes = getDayNotes(isoDate);

  html += `<div class="time-blocks">`;
  parts.forEach((text, i) => {
    const periodKey = PERIOD_KEYS[i];
    const periodNotes = dayNotes.filter(n => n.period === periodKey);

    html += `<div class="time-block">
      <div class="icon">${ICONS[i]}</div>
      <div class="content">
        <div class="period">${PERIODS[i]} <button class="note-add-btn" data-period="${periodKey}" data-date="${isoDate}">+</button></div>
        <div class="desc">${text}</div>`;

    // Render existing notes
    if (periodNotes.length > 0) {
      html += `<div class="day-notes">`;
      periodNotes.forEach(note => {
        const personCls = note.person === 'solon' ? 'note-solon' : 'note-hekla';
        html += `<div class="day-note ${note.done ? 'done' : ''} ${personCls}">
          <input type="checkbox" class="note-check" data-note-id="${note.id}" data-date="${isoDate}" ${note.done ? 'checked' : ''}>
          <span class="note-text">${escapeHtml(note.text)}</span>
          <button class="note-delete" data-note-id="${note.id}" data-date="${isoDate}">✕</button>
        </div>`;
      });
      html += `</div>`;
    }

    // Inline input (hidden by default)
    html += `<div class="note-input-row hidden" data-period="${periodKey}">
          <input type="text" class="note-input" placeholder="Bæta við..." data-period="${periodKey}" data-date="${isoDate}">
        </div>`;

    html += `</div>
    </div>`;
  });
  html += `</div>`;

  // Other person context
  html += `<div class="context-box">
    <div class="label">${otherName} í dag</div>
    <div class="text">${view.otherContext}</div>
  </div>`;

  // Dinner
  html += `<div class="dinner-card">
    <div class="icon">🍽️</div>
    <div>
      <div class="label">Kvöldmatur</div>
      <div class="meal">${d.dinner}</div>
    </div>
  </div>`;

  // Intention (at bottom)
  html += `<div class="intention">
    <div class="label">Ásetningur vikunnar</div>
    <div class="text">${intention}</div>
    <div class="saman">Saman: ${intentions.saman}</div>
    ${needFromOther ? `<div class="need">💬 ${otherName} þarf frá þér: ${needFromOther}</div>` : ''}
  </div>`;

  html += `<div class="swipe-hint">Strjúktu til að skipta á milli daga</div>`;

  el.innerHTML = html;

  // Bind day picker clicks
  el.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => setDay(parseInt(btn.dataset.day)));
  });

  // Bind checkin banner
  const checkinBanner = el.querySelector('[data-action="checkin"]');
  if (checkinBanner) {
    checkinBanner.addEventListener('click', () => navigate('#checkin'));
  }

  // Day notes: show input on "+" click
  el.querySelectorAll('.note-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const period = btn.dataset.period;
      const row = el.querySelector(`.note-input-row[data-period="${period}"]`);
      row.classList.toggle('hidden');
      if (!row.classList.contains('hidden')) {
        row.querySelector('.note-input').focus();
      }
    });
  });

  // Day notes: save on Enter
  el.querySelectorAll('.note-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = input.value.trim();
        if (!text) return;
        addDayNote(input.dataset.date, {
          period: input.dataset.period,
          text,
          person: state.person
        });
        renderDaily(el);
      }
      if (e.key === 'Escape') {
        input.value = '';
        input.closest('.note-input-row').classList.add('hidden');
      }
    });
  });

  // Day notes: toggle done
  el.querySelectorAll('.note-check').forEach(cb => {
    cb.addEventListener('change', () => {
      toggleDayNote(cb.dataset.date, cb.dataset.noteId);
      renderDaily(el);
    });
  });

  // Day notes: delete
  el.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeDayNote(btn.dataset.date, btn.dataset.noteId);
      renderDaily(el);
    });
  });
}

function getTodayIdx() {
  if (!state.weekData) return -1;
  const today = new Date().toISOString().split('T')[0];
  return state.weekData.days.findIndex(d => d.isoDate === today);
}

function shouldShowCheckin(todayIdx, checkin, person) {
  // Show from Wednesday (idx 2) to Saturday (idx 5)
  return todayIdx >= 2 && todayIdx <= 5;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

