// reflection.js — View a specific week's narrative + reflection
import { state, navigate } from '../app.js?v=11';
import { loadReflection, loadWeek, loadAiSummary } from '../data.js?v=11';

export async function renderReflection(el, isoWeek) {
  if (!isoWeek) {
    navigate('#history');
    return;
  }

  const reflection = await loadReflection(isoWeek);
  const week = isoWeek === state.weekData?.isoWeek
    ? state.weekData
    : await loadWeek(isoWeek);

  let html = '';

  // Back button
  html += `<div style="margin-bottom:8px"><button class="back-btn" id="back-btn">← Til baka</button></div>`;

  // Header
  html += `<div class="header">
    <h1>Vika ${isoWeek.split('-W')[1]}</h1>
    <div class="sub">${week ? week.dateRange : isoWeek}</div>
  </div>`;

  if (!reflection) {
    html += `<div class="empty-state" style="padding-top:24px">
      <div class="empty-icon">📝</div>
      <div class="empty-text">Engin greining fyrir þessa viku ennþá.<br>Hún verður skrifuð á næsta sunnudegi.</div>
    </div>`;

    // Show intentions if we have week data
    if (week) {
      html += `<div class="ov-card" style="margin-top:16px">
        <div class="ov-title">Ásetningar vikunnar</div>
        <div style="margin-top:8px;font-size:14px;line-height:1.6">
          <div style="margin-bottom:6px"><strong style="color:#2563EB">Sólon:</strong> ${week.intentions.solon}</div>
          <div style="margin-bottom:6px"><strong style="color:#059669">Hekla:</strong> ${week.intentions.hekla}</div>
          <div><em>Saman:</em> ${week.intentions.saman}</div>
        </div>
      </div>`;
    }
  } else {
    // === NARRATIVE ===
    if (reflection.narrative) {
      html += `<div class="narrative-section">
        <div class="narrative-text">${formatNarrative(reflection.narrative)}</div>
      </div>`;
    }

    // === HIGHLIGHTS ===
    if (reflection.highlights?.length) {
      html += `<div class="ov-card" style="margin-top:16px">
        <div class="ov-title">✨ Highlights</div>
        <ul class="narrative-list">
          ${reflection.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>`;
    }

    // === PATTERNS / OBSERVATIONS ===
    if (reflection.observations?.length) {
      html += `<div class="ov-card" style="margin-top:12px">
        <div class="ov-title">🔍 Athuganir</div>
        <ul class="narrative-list">
          ${reflection.observations.map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>`;
    }

    // === SUGGESTIONS ===
    if (reflection.suggestions?.length) {
      html += `<div class="ov-card" style="margin-top:12px">
        <div class="ov-title">💡 Tillögur fyrir næstu viku</div>
        <ul class="narrative-list">
          ${reflection.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>`;
    }

    // === MOOD ===
    if (reflection.mood) {
      html += `<div class="ov-card" style="margin-top:12px">
        <div class="ov-title">Líðan</div>
        <div style="display:flex;gap:24px;margin-top:8px">
          ${reflection.mood.solon != null ? `<div>
            <div style="font-size:28px;font-weight:700;color:#2563EB">${reflection.mood.solon}/10</div>
            <div style="font-size:12px;color:var(--text-mid)">Sólon</div>
          </div>` : ''}
          ${reflection.mood.hekla != null ? `<div>
            <div style="font-size:28px;font-weight:700;color:#059669">${reflection.mood.hekla}/10</div>
            <div style="font-size:12px;color:var(--text-mid)">Hekla</div>
          </div>` : ''}
          ${reflection.mood.couple != null ? `<div>
            <div style="font-size:28px;font-weight:700;color:var(--text)">${reflection.mood.couple}/10</div>
            <div style="font-size:12px;color:var(--text-mid)">Saman</div>
          </div>` : ''}
        </div>
      </div>`;
    }

    // === INTENTIONS REVIEW ===
    if (week) {
      html += `<div class="ov-card" style="margin-top:12px">
        <div class="ov-title">Ásetningar vs. raunveruleiki</div>
        <div style="margin-top:8px;font-size:13px;line-height:1.6">
          <div style="margin-bottom:8px">
            <strong style="color:#2563EB">Sólon ætlaði:</strong> ${week.intentions.solon}
            ${reflection.intentionReview?.solon ? `<div style="margin-top:4px;color:var(--text-mid);font-style:italic">${reflection.intentionReview.solon}</div>` : ''}
          </div>
          <div style="margin-bottom:8px">
            <strong style="color:#059669">Hekla ætlaði:</strong> ${week.intentions.hekla}
            ${reflection.intentionReview?.hekla ? `<div style="margin-top:4px;color:var(--text-mid);font-style:italic">${reflection.intentionReview.hekla}</div>` : ''}
          </div>
          <div>
            <strong>Saman:</strong> ${week.intentions.saman}
            ${reflection.intentionReview?.saman ? `<div style="margin-top:4px;color:var(--text-mid);font-style:italic">${reflection.intentionReview.saman}</div>` : ''}
          </div>
        </div>
      </div>`;
    }
  }

  // Bottom spacer
  html += `<div style="height:24px"></div>`;

  el.innerHTML = html;

  document.getElementById('back-btn')?.addEventListener('click', () => navigate('#history'));
}

// ===== MONTHLY NARRATIVE =====
const MONTH_NAMES = ['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];

export async function renderMonthly(el, yearMonth) {
  if (!yearMonth) { navigate('#history'); return; }

  const data = await loadAiSummary(yearMonth);
  const [year, month] = yearMonth.split('-');
  const monthName = `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;

  let html = '';
  html += `<div style="margin-bottom:8px"><button class="back-btn" id="back-btn">← Til baka</button></div>`;
  html += `<div class="header">
    <h1>${monthName}</h1>
    <div class="sub">Mánaðarleg greining</div>
  </div>`;

  if (!data) {
    html += `<div class="empty-state" style="padding-top:24px">
      <div class="empty-icon">📊</div>
      <div class="empty-text">Engin mánaðargreining ennþá.<br>Hún verður skrifuð í lok mánaðar.</div>
    </div>`;
  } else {
    // Narrative
    if (data.narrative) {
      html += `<div class="narrative-section">
        <div class="narrative-text">${formatNarrative(data.narrative)}</div>
      </div>`;
    } else if (data.summary) {
      html += `<div class="narrative-section">
        <div class="narrative-text"><p>${data.summary}</p></div>
      </div>`;
    }

    // Highlights
    if (data.highlights?.length) {
      html += `<div class="ov-card" style="margin-top:16px">
        <div class="ov-title">✨ Highlights mánaðarins</div>
        <ul class="narrative-list">${data.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>`;
    }

    // Patterns
    if (data.patterns?.length) {
      html += `<div class="ov-card" style="margin-top:12px">
        <div class="ov-title">🔍 Mynstur</div>
        <ul class="narrative-list">${data.patterns.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>`;
    }

    // Observations
    if (data.observations?.length) {
      html += `<div class="ov-card" style="margin-top:12px">
        <div class="ov-title">🔍 Athuganir</div>
        <ul class="narrative-list">${data.observations.map(o => `<li>${o}</li>`).join('')}</ul>
      </div>`;
    }

    // Recommendations / suggestions
    if (data.recommendations?.length || data.suggestions?.length) {
      const items = data.suggestions || data.recommendations;
      html += `<div class="ov-card" style="margin-top:12px">
        <div class="ov-title">💡 Tillögur fyrir næsta mánuð</div>
        <ul class="narrative-list">${items.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>`;
    }
  }

  html += `<div style="height:24px"></div>`;
  el.innerHTML = html;
  document.getElementById('back-btn')?.addEventListener('click', () => navigate('#history'));
}

function formatNarrative(text) {
  // Split into paragraphs and wrap
  return text.split('\n\n').map(p =>
    `<p style="margin:0 0 14px 0">${p.trim()}</p>`
  ).join('');
}
