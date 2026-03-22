// reflection.js — View a specific week's reflection
import { state, navigate } from '../app.js?v=5';
import { loadReflection, loadWeek } from '../data.js?v=5';

export async function renderReflection(el, isoWeek) {
  if (!isoWeek) {
    navigate('#history');
    return;
  }

  const reflection = await loadReflection(isoWeek);
  const week = isoWeek === state.weekData?.isoWeek
    ? state.weekData
    : await loadWeek(isoWeek);

  let html = `<div class="header">
    <h1>Vikuyfirferð</h1>
    <div class="sub">${week ? week.dateRange : isoWeek}</div>
  </div>`;

  // Back button
  html += `<button style="background:none;border:none;color:var(--accent);font-size:14px;font-weight:600;cursor:pointer;padding:8px 0;font-family:'DM Sans',sans-serif" id="back-btn">← Til baka</button>`;

  if (!reflection) {
    html += `<div class="empty-state" style="padding-top:24px">
      <div class="empty-icon">📝</div>
      <div class="empty-text">Engin vikuyfirferð fyrir þessa viku ennþá.<br>Hún verður skrifuð á næsta sunnudagskvöldi.</div>
    </div>`;

    // Show intentions if we have week data
    if (week) {
      html += `<div class="section-title" style="margin-top:24px">Ásetningar vikunnar</div>`;
      html += `<div class="reflection-section">
        <div class="rs-content">
          <strong>Sólon:</strong> ${week.intentions.solon}<br><br>
          <strong>Hekla:</strong> ${week.intentions.hekla}<br><br>
          <em>Saman:</em> ${week.intentions.saman}
        </div>
      </div>`;
    }
  } else {
    // Mood
    if (reflection.mood) {
      html += `<div class="reflection-section">
        <div class="rs-title">Líðan</div>
        <div style="display:flex;gap:24px">
          ${reflection.mood.solon ? `<div>
            <div style="font-size:28px;font-weight:700;color:#2563EB">${reflection.mood.solon.overall}/10</div>
            <div style="font-size:12px;color:var(--text-mid)">Sólon</div>
          </div>` : ''}
          ${reflection.mood.hekla ? `<div>
            <div style="font-size:28px;font-weight:700;color:#059669">${reflection.mood.hekla.overall}/10</div>
            <div style="font-size:12px;color:var(--text-mid)">Hekla</div>
          </div>` : ''}
          ${reflection.coupleScore ? `<div>
            <div style="font-size:28px;font-weight:700;color:var(--text)">${reflection.coupleScore}/10</div>
            <div style="font-size:12px;color:var(--text-mid)">Saman</div>
          </div>` : ''}
        </div>
      </div>`;
    }

    // Gratitude
    if (reflection.gratitude) {
      html += `<div class="reflection-section">
        <div class="rs-title">Þakkir</div>
        <div class="rs-content">
          ${reflection.gratitude.solon ? `<div style="margin-bottom:8px"><strong style="color:#2563EB">Sólon:</strong> ${reflection.gratitude.solon}</div>` : ''}
          ${reflection.gratitude.hekla ? `<div><strong style="color:#059669">Hekla:</strong> ${reflection.gratitude.hekla}</div>` : ''}
        </div>
      </div>`;
    }

    // What worked
    if (reflection.whatWorked?.length) {
      html += `<div class="reflection-section">
        <div class="rs-title">Hvað gekk vel</div>
        <ul class="rs-list">${reflection.whatWorked.map(w => `<li>${w}</li>`).join('')}</ul>
      </div>`;
    }

    // What didn't work
    if (reflection.whatDidnt?.length) {
      html += `<div class="reflection-section">
        <div class="rs-title">Hvað gekk ekki</div>
        <ul class="rs-list">${reflection.whatDidnt.map(w => `<li>${w}</li>`).join('')}</ul>
      </div>`;
    }

    // Summary
    if (reflection.summary) {
      html += `<div class="reflection-section">
        <div class="rs-title">Samantekt</div>
        <div class="rs-content">${reflection.summary}</div>
      </div>`;
    }

    // Notes from week
    if (reflection.notesFromWeek?.length) {
      html += `<div class="reflection-section">
        <div class="rs-title">Athugasemdir vikunnar</div>
        <ul class="rs-list">${reflection.notesFromWeek.map(n =>
          `<li>${n.text}</li>`
        ).join('')}</ul>
      </div>`;
    }
  }

  el.innerHTML = html;

  document.getElementById('back-btn')?.addEventListener('click', () => navigate('#history'));
}
