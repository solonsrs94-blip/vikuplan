// vd.js — Viktoría Dís view
import { state, navigate } from '../app.js?v=6';
import { getVdNotes, addVdNote, removeVdNote, getVdGoals, addVdGoal, toggleVdGoal, removeVdGoal, lsGet, lsSet } from '../data.js?v=6';
import { showToast } from '../app.js?v=6';

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

  // Growth chart
  const growth = lsGet('vd_growth') || [];
  html += `<div class="section-title">Vaxtarkúrfa</div>`;
  html += `<div class="personal-section">
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <input type="date" class="note-input" id="growth-date" value="${now.toISOString().split('T')[0]}" style="flex:1">
      <input type="number" class="note-input" id="growth-height" placeholder="Hæð (cm)" style="flex:1" step="0.1">
      <input type="number" class="note-input" id="growth-weight" placeholder="Þyngd (kg)" style="flex:1" step="0.1">
    </div>
    <button class="inbox-submit" id="growth-add" style="width:100%">Skrá mælingu</button>
  </div>`;

  if (growth.length > 0) {
    // Simple chart
    html += `<div class="ov-card" style="margin-bottom:12px">`;
    html += renderGrowthChart(growth);
    // Table
    html += `<div style="margin-top:12px">`;
    growth.slice().reverse().forEach(g => {
      const dateStr = new Date(g.date + 'T12:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' });
      html += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:13px">
        <span>${dateStr}</span>
        <span>${g.height ? g.height + ' cm' : '—'} · ${g.weight ? g.weight + ' kg' : '—'}</span>
        <button class="note-delete" data-growth-delete="${g.id}" style="font-size:11px">✕</button>
      </div>`;
    });
    html += `</div></div>`;
  }

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

  // Growth chart
  el.querySelector('#growth-add')?.addEventListener('click', () => {
    const date = document.getElementById('growth-date')?.value;
    const height = document.getElementById('growth-height')?.value;
    const weight = document.getElementById('growth-weight')?.value;
    if (!height && !weight) return;
    const items = lsGet('vd_growth') || [];
    items.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: date || new Date().toISOString().split('T')[0],
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null
    });
    items.sort((a, b) => a.date.localeCompare(b.date));
    lsSet('vd_growth', items);
    showToast('Mæling skráð!');
    renderVd(el);
  });

  el.querySelectorAll('[data-growth-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const items = (lsGet('vd_growth') || []).filter(i => i.id !== btn.dataset.growthDelete);
      lsSet('vd_growth', items);
      renderVd(el);
    });
  });

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

function renderGrowthChart(data) {
  if (data.length < 2) {
    return `<div style="font-size:13px;color:var(--text-light);text-align:center;padding:10px">Skráðu fleiri mælingar til að sjá graf</div>`;
  }

  const w = 280, h = 120, pad = { top: 15, right: 15, bottom: 25, left: 35 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const heights = data.filter(d => d.height).map(d => d.height);
  const weights = data.filter(d => d.weight).map(d => d.weight);

  let svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;max-height:140px">`;

  if (heights.length >= 2) {
    const minH = Math.min(...heights) - 2;
    const maxH = Math.max(...heights) + 2;
    const hData = data.filter(d => d.height);
    const xStep = plotW / (hData.length - 1);
    const toY = v => pad.top + plotH - ((v - minH) / (maxH - minH)) * plotH;
    let path = '';
    hData.forEach((d, i) => {
      path += `${i === 0 ? 'M' : 'L'}${(pad.left + i * xStep).toFixed(1)},${toY(d.height).toFixed(1)} `;
    });
    svg += `<polyline points="${path.trim()}" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>`;
    // Labels
    svg += `<text x="${pad.left - 4}" y="${pad.top}" text-anchor="end" fill="#2563EB" font-size="8">${maxH}cm</text>`;
    svg += `<text x="${pad.left - 4}" y="${pad.top + plotH}" text-anchor="end" fill="#2563EB" font-size="8">${minH}cm</text>`;
  }

  if (weights.length >= 2) {
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const wData = data.filter(d => d.weight);
    const xStep = plotW / (wData.length - 1);
    const toY = v => pad.top + plotH - ((v - minW) / (maxW - minW)) * plotH;
    let path = '';
    wData.forEach((d, i) => {
      path += `${i === 0 ? 'M' : 'L'}${(pad.left + i * xStep).toFixed(1)},${toY(d.weight).toFixed(1)} `;
    });
    svg += `<polyline points="${path.trim()}" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-dasharray="4,2"/>`;
  }

  svg += `</svg>`;
  svg += `<div style="display:flex;gap:16px;justify-content:center;font-size:11px;margin-top:4px">
    <span style="color:#2563EB">● Hæð (cm)</span>
    <span style="color:#059669">● Þyngd (kg)</span>
  </div>`;

  return svg;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
