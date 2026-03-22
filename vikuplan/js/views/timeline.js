// timeline.js — Long-term timeline view
import { state } from '../app.js?v=10';

const MONTHS_IS = ['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];

export function renderTimeline(el) {
  if (!state.longTerm || !state.longTerm.events) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Engir atburðir skráðir.</div></div>`;
    return;
  }

  const events = [...state.longTerm.events]
    .filter(e => e.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const today = new Date().toISOString().split('T')[0];

  let html = `<div class="header">
    <h1>Tímalína</h1>
    <div class="sub">Hvað er framundan</div>
  </div>`;

  html += `<div class="timeline"><div class="timeline-line"></div>`;

  let currentMonth = '';

  // Add "today" marker
  const todayDate = new Date();
  let todayInserted = false;

  events.forEach(ev => {
    const evDate = new Date(ev.date);
    const monthKey = `${evDate.getFullYear()}-${evDate.getMonth()}`;
    const monthLabel = `${MONTHS_IS[evDate.getMonth()]} ${evDate.getFullYear()}`;

    // Insert today marker before first future event
    if (!todayInserted && ev.date >= today) {
      const todayMonthKey = `${todayDate.getFullYear()}-${todayDate.getMonth()}`;
      if (todayMonthKey !== currentMonth) {
        currentMonth = todayMonthKey;
        html += `<div class="timeline-month">${MONTHS_IS[todayDate.getMonth()]} ${todayDate.getFullYear()}</div>`;
      }
      html += `<div class="timeline-item">
        <div class="timeline-dot today"></div>
        <div class="timeline-content">
          <div class="tl-date" style="color:var(--danger);font-weight:700">Í dag — ${todayDate.getDate()}. ${MONTHS_IS[todayDate.getMonth()]}</div>
        </div>
      </div>`;
      todayInserted = true;
    }

    if (monthKey !== currentMonth) {
      currentMonth = monthKey;
      html += `<div class="timeline-month">${monthLabel}</div>`;
    }

    const dateStr = formatDateRange(ev.date, ev.endDate);
    const dotClass = ev.category || 'default';
    const isPast = ev.endDate ? ev.endDate < today : ev.date < today;

    html += `<div class="timeline-item" ${isPast ? 'style="opacity:0.5"' : ''}>
      <div class="timeline-dot ${dotClass}"></div>
      <div class="timeline-content">
        <div class="tl-date">${dateStr}</div>
        <div class="tl-title">${ev.title}</div>
        ${ev.person ? `<div class="tl-person">${formatPerson(ev.person)}</div>` : ''}
        ${ev.notes ? `<div class="tl-note">${ev.notes}</div>` : ''}
      </div>
    </div>`;
  });

  // Insert today at end if all events are past
  if (!todayInserted) {
    html += `<div class="timeline-item">
      <div class="timeline-dot today"></div>
      <div class="timeline-content">
        <div class="tl-date" style="color:var(--danger);font-weight:700">Í dag — ${todayDate.getDate()}. ${MONTHS_IS[todayDate.getMonth()]}</div>
      </div>
    </div>`;
  }

  html += `</div>`;

  el.innerHTML = html;
}

function formatDateRange(start, end) {
  const s = new Date(start);
  const sDay = s.getDate();
  const sMonth = MONTHS_IS[s.getMonth()];

  if (!end) return `${sDay}. ${sMonth}`;

  const e = new Date(end);
  const eDay = e.getDate();
  const eMonth = MONTHS_IS[e.getMonth()];

  if (s.getMonth() === e.getMonth()) {
    return `${sDay}.–${eDay}. ${sMonth}`;
  }
  return `${sDay}. ${sMonth} – ${eDay}. ${eMonth}`;
}

function formatPerson(person) {
  const map = {
    'solon': '👤 Sólon',
    'hekla': '👤 Hekla',
    'bæði': '👥 Bæði',
    'fjölskyldan': '👨‍👩‍👧 Fjölskyldan',
    'both': '👥 Bæði'
  };
  return map[person] || person;
}
