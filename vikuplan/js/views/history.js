// history.js — Weekly history browser + mood trends
import { state, navigate } from '../app.js?v=16';
import { loadWeek, loadReflection, loadAiSummary } from '../data.js?v=16';

export async function renderHistory(el) {
  const weekIndex = [...state.weekIndex].reverse();

  let html = `<div class="header">
    <h1>Saga</h1>
    <div class="sub">Fyrri vikur og þróun</div>
  </div>`;

  // Mood chart if we have data
  if (state.context?.moodHistory) {
    const solon = state.context.moodHistory.solon || {};
    const hekla = state.context.moodHistory.hekla || {};
    const weeks = Object.keys({ ...solon, ...hekla }).sort();

    if (weeks.length > 1) {
      html += renderMoodChart(weeks, solon, hekla);
    }
  }

  // Week list
  html += `<div class="section-title">Vikur</div>`;

  if (weekIndex.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-text">Engin vikusaga ennþá.</div></div>`;
  } else {
    html += `<div class="history-list">`;
    for (const isoWeek of weekIndex) {
      const week = isoWeek === state.weekData?.isoWeek
        ? state.weekData
        : await loadWeek(isoWeek);

      if (!week) continue;

      const reflection = await loadReflection(isoWeek);
      const moodS = state.context?.moodHistory?.solon?.[isoWeek];
      const moodH = state.context?.moodHistory?.hekla?.[isoWeek];

      html += `<div class="history-week" data-week="${isoWeek}">
        <div class="hw-header">
          <span class="hw-label">Vika ${week.week}</span>
          <span class="hw-date">${week.dateRange}</span>
        </div>
        <div class="hw-intentions">
          <strong>S:</strong> ${truncate(week.intentions.solon, 60)}<br>
          <strong>H:</strong> ${truncate(week.intentions.hekla, 60)}
        </div>
        ${(moodS || moodH) ? `<div class="hw-mood">
          ${moodS ? `<span class="hw-mood-item">Sólon: <strong>${moodS}/10</strong></span>` : ''}
          ${moodH ? `<span class="hw-mood-item">Hekla: <strong>${moodH}/10</strong></span>` : ''}
        </div>` : ''}
        ${reflection?.narrative ? '<div style="font-size:11px;color:var(--accent);margin-top:6px;font-weight:600">📖 Lesa vikugreiningu →</div>' : reflection ? '<div style="font-size:11px;color:var(--success);margin-top:6px">✓ Vikuyfirferð lokið</div>' : ''}
      </div>`;
    }
    html += `</div>`;
  }

  // Monthly narratives
  const today = new Date().toISOString().split('T')[0];
  const allMonths = await loadAllMonthlyNarratives(today);
  if (allMonths.length > 0) {
    html += `<div class="section-title" style="margin-top:20px">Mánaðargreiningar</div>`;
    allMonths.forEach(m => {
      html += `<div class="ov-card" data-month="${m.yearMonth}" style="cursor:pointer;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">${m.monthName}</div>
            <div style="font-size:12px;color:var(--text-light);margin-top:2px">${truncate(m.summary || '', 80)}</div>
          </div>
          <div style="font-size:14px;color:var(--accent)">📖 →</div>
        </div>
      </div>`;
    });
  }

  el.innerHTML = html;

  // Bind clicks
  el.querySelectorAll('.history-week').forEach(card => {
    card.addEventListener('click', () => {
      navigate(`#reflection/${card.dataset.week}`);
    });
  });

  el.querySelectorAll('[data-month]').forEach(card => {
    card.addEventListener('click', () => {
      navigate(`#monthly/${card.dataset.month}`);
    });
  });
}

function renderMoodChart(weeks, solon, hekla) {
  const w = 100;
  const h = 80;
  const pad = { top: 10, right: 10, bottom: 20, left: 5 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const xStep = weeks.length > 1 ? plotW / (weeks.length - 1) : plotW;

  const toY = (val) => pad.top + plotH - ((val || 5) / 10) * plotH;
  const toX = (i) => pad.left + i * xStep;

  let pathS = '', pathH = '';
  weeks.forEach((w, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    if (solon[w]) pathS += `${cmd}${toX(i).toFixed(1)},${toY(solon[w]).toFixed(1)} `;
    if (hekla[w]) pathH += `${cmd}${toX(i).toFixed(1)},${toY(hekla[w]).toFixed(1)} `;
  });

  let labels = '';
  weeks.forEach((w, i) => {
    const num = w.split('-W')[1];
    labels += `<text x="${toX(i)}" y="${h - 4}" text-anchor="middle" fill="var(--text-light)" font-size="3">${num}</text>`;
  });

  return `<div class="mood-chart">
    <div class="title">Líðan yfir tíma</div>
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      ${labels}
      <line x1="${pad.left}" y1="${toY(5)}" x2="${w - pad.right}" y2="${toY(5)}" stroke="var(--border)" stroke-width="0.3" stroke-dasharray="2"/>
      ${pathS ? `<polyline points="${pathS.trim()}" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${pathH ? `<polyline points="${pathH.trim()}" fill="none" stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    </svg>
    <div style="display:flex;gap:16px;justify-content:center;margin-top:6px">
      <span style="font-size:11px;color:#2563EB">● Sólon</span>
      <span style="font-size:11px;color:#059669">● Hekla</span>
    </div>
  </div>`;
}

const MONTH_NAMES = ['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];

async function loadAllMonthlyNarratives(today) {
  const results = [];
  // Check current and previous months
  const d = new Date(today);
  for (let i = 0; i < 6; i++) {
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const data = await loadAiSummary(ym);
    if (data) {
      results.push({
        yearMonth: ym,
        monthName: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        ...data
      });
    }
    d.setMonth(d.getMonth() - 1);
  }
  return results;
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
