// charts.js — Reusable chart rendering helpers (pure CSS + inline SVG)

/**
 * Heatmap: 7 days x 2 people, color = load level (1-5)
 */
export function renderHeatmap(loadScores, dayLabels) {
  if (!loadScores) return '';

  const solon = loadScores.solon || [0,0,0,0,0,0,0];
  const hekla = loadScores.hekla || [0,0,0,0,0,0,0];

  const cellColor = (val) => {
    if (!val || val === 0) return 'var(--border-light)';
    // Interpolate from green (120) to red (0)
    const hue = Math.round(120 - (val - 1) * 30); // 1=120(green), 5=0(red)
    return `hsl(${hue}, 70%, 65%)`;
  };

  const cellColorDark = (val) => {
    if (!val || val === 0) return 'var(--border-light)';
    const hue = Math.round(120 - (val - 1) * 30);
    return `hsl(${hue}, 60%, 35%)`;
  };

  let cells = '';
  dayLabels.forEach((label, i) => {
    cells += `<div class="hm-header">${label}</div>`;
  });
  solon.forEach((val, i) => {
    cells += `<div class="hm-cell" style="--hm-color:${cellColor(val)};--hm-color-dark:${cellColorDark(val)}" title="Sólon: ${val}/5">${val || ''}</div>`;
  });
  hekla.forEach((val, i) => {
    cells += `<div class="hm-cell" style="--hm-color:${cellColor(val)};--hm-color-dark:${cellColorDark(val)}" title="Hekla: ${val}/5">${val || ''}</div>`;
  });

  return `<div class="ov-card">
    <div class="ov-title">Vikuhitakort</div>
    <div class="ov-subtitle">Álag á hverjum degi (1–5)</div>
    <div class="heatmap">
      <div class="hm-label"></div>${cells.slice(0, cells.indexOf('</div>') * 0 + cells.length)}
    </div>
    <div class="hm-legend">
      <div class="hm-row-label"><span class="hm-dot" style="background:#2563EB"></span> Sólon</div>
      <div class="hm-row-label"><span class="hm-dot" style="background:#059669"></span> Hekla</div>
    </div>
  </div>`;
}

// Simpler heatmap that actually works with CSS grid
export function renderHeatmapGrid(loadScores, dayLabels) {
  if (!loadScores) return '';

  const solon = loadScores.solon || [0,0,0,0,0,0,0];
  const hekla = loadScores.hekla || [0,0,0,0,0,0,0];

  const cellColor = (val) => {
    if (!val || val === 0) return 'var(--border-light)';
    const hue = Math.round(120 - (val - 1) * 30);
    return `hsl(${hue}, 70%, 65%)`;
  };

  let headerCells = dayLabels.map(l => `<div class="hm-hdr">${l}</div>`).join('');
  let solonCells = solon.map(v => `<div class="hm-cell" style="background:${cellColor(v)}">${v || '–'}</div>`).join('');
  let heklaCells = hekla.map(v => `<div class="hm-cell" style="background:${cellColor(v)}">${v || '–'}</div>`).join('');

  return `<div class="ov-card">
    <div class="ov-title">Vikuhitakort</div>
    <div class="ov-subtitle">Álag á hverjum degi (1–5)</div>
    <div class="heatmap-grid">
      <div class="hm-rlabel"></div>${headerCells}
      <div class="hm-rlabel"><span class="hm-dot" style="background:#2563EB"></span>S</div>${solonCells}
      <div class="hm-rlabel"><span class="hm-dot" style="background:#059669"></span>H</div>${heklaCells}
    </div>
  </div>`;
}

/**
 * Horizontal bar group comparison
 */
export function renderBarGroup(title, subtitle, items) {
  if (!items || items.length === 0) return '';
  const maxVal = Math.max(...items.map(i => Math.max(i.solon || 0, i.hekla || 0)), 1);

  let bars = items.map(item => {
    const sPct = Math.round(((item.solon || 0) / maxVal) * 100);
    const hPct = Math.round(((item.hekla || 0) / maxVal) * 100);
    return `<div class="bar-row">
      <div class="bar-label">${item.label}</div>
      <div class="bar-pair">
        <div class="bar-line">
          <div class="bar-track-h"><div class="bar-fill-h" style="width:${sPct}%;background:#2563EB"></div></div>
          <span class="bar-val">${item.solon || 0}</span>
        </div>
        <div class="bar-line">
          <div class="bar-track-h"><div class="bar-fill-h" style="width:${hPct}%;background:#059669"></div></div>
          <span class="bar-val">${item.hekla || 0}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<div class="ov-card">
    <div class="ov-title">${title}</div>
    ${subtitle ? `<div class="ov-subtitle">${subtitle}</div>` : ''}
    <div class="bar-legend">
      <span><span class="hm-dot" style="background:#2563EB"></span> Sólon</span>
      <span><span class="hm-dot" style="background:#059669"></span> Hekla</span>
    </div>
    <div class="bar-group">${bars}</div>
  </div>`;
}

/**
 * Mood trend — inline SVG line chart
 */
export function renderMoodTrend(weeks, solon, hekla) {
  if (!weeks || weeks.length === 0) return '';

  const w = 100;
  const h = 80;
  const pad = { top: 10, right: 10, bottom: 20, left: 5 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const xStep = weeks.length > 1 ? plotW / (weeks.length - 1) : plotW;

  const toY = (val) => pad.top + plotH - ((val || 5) / 10) * plotH;
  const toX = (i) => pad.left + i * xStep;

  let pathS = '', pathH = '';
  let dotsS = '', dotsH = '';
  weeks.forEach((wk, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    if (solon[wk]) {
      pathS += `${cmd}${toX(i).toFixed(1)},${toY(solon[wk]).toFixed(1)} `;
      dotsS += `<circle cx="${toX(i).toFixed(1)}" cy="${toY(solon[wk]).toFixed(1)}" r="1.5" fill="#2563EB"/>`;
    }
    if (hekla[wk]) {
      pathH += `${cmd}${toX(i).toFixed(1)},${toY(hekla[wk]).toFixed(1)} `;
      dotsH += `<circle cx="${toX(i).toFixed(1)}" cy="${toY(hekla[wk]).toFixed(1)}" r="1.5" fill="#059669"/>`;
    }
  });

  let labels = weeks.map((wk, i) => {
    const num = wk.split('-W')[1];
    return `<text x="${toX(i)}" y="${h - 4}" text-anchor="middle" fill="var(--text-light)" font-size="3">V${num}</text>`;
  }).join('');

  return `<div class="ov-card">
    <div class="ov-title">Líðan yfir tíma</div>
    <svg class="mood-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      ${labels}
      <line x1="${pad.left}" y1="${toY(5)}" x2="${w - pad.right}" y2="${toY(5)}" stroke="var(--border)" stroke-width="0.3" stroke-dasharray="2"/>
      ${pathS ? `<polyline points="${pathS.trim()}" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${pathH ? `<polyline points="${pathH.trim()}" fill="none" stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${dotsS}${dotsH}
    </svg>
    <div class="chart-legend">
      <span><span class="hm-dot" style="background:#2563EB"></span> Sólon</span>
      <span><span class="hm-dot" style="background:#059669"></span> Hekla</span>
    </div>
  </div>`;
}

/**
 * Progress ring using conic-gradient
 */
export function renderProgressRing(pct, label, color) {
  const rounded = Math.round((pct || 0) * 100);
  return `<div class="progress-ring-wrap">
    <div class="progress-ring" style="background:conic-gradient(${color} ${rounded}%, var(--border-light) ${rounded}%)">
      <div class="progress-ring-inner">${rounded}%</div>
    </div>
    <div class="progress-ring-label">${label}</div>
  </div>`;
}

/**
 * Horizontal event timeline (season wheel)
 */
export function renderSeasonWheel(events, today) {
  if (!events || events.length === 0) return '';

  const todayDate = new Date(today);
  const futureEvents = events
    .filter(e => new Date(e.endDate || e.date) >= todayDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 8);

  if (futureEvents.length === 0) return '';

  const catColors = {
    trip: '#8B5CF6',
    activity: '#059669',
    family: '#EC4899'
  };

  const catEmoji = {
    trip: '✈️',
    activity: '⛳',
    family: '👨‍👩‍👧'
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const day = date.getDate();
    const months = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des'];
    return `${day}. ${months[date.getMonth()]}`;
  };

  const daysUntil = (d) => {
    const diff = Math.ceil((new Date(d) - todayDate) / 86400000);
    if (diff === 0) return 'Í dag';
    if (diff === 1) return 'Á morgun';
    return `Eftir ${diff} daga`;
  };

  let items = futureEvents.map(ev => {
    const color = catColors[ev.category] || 'var(--accent)';
    const emoji = catEmoji[ev.category] || '📌';
    return `<div class="sw-item">
      <div class="sw-dot" style="background:${color}">${emoji}</div>
      <div class="sw-info">
        <div class="sw-title">${ev.title}</div>
        <div class="sw-date">${formatDate(ev.date)}${ev.endDate ? ' — ' + formatDate(ev.endDate) : ''}</div>
        <div class="sw-countdown" style="color:${color}">${daysUntil(ev.date)}</div>
      </div>
    </div>`;
  }).join('');

  return `<div class="ov-card">
    <div class="ov-title">Framundan</div>
    <div class="ov-subtitle">Stórir atburðir á næstunni</div>
    <div class="season-wheel">${items}</div>
  </div>`;
}
