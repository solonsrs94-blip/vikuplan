// checkin.js — Mid-week check-in
import { state, showToast, navigate } from '../app.js?v=9';
import { getCheckin, saveCheckin } from '../data.js?v=9';

export function renderCheckin(el) {
  if (!state.weekData) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Engin vika til staðar.</div></div>`;
    return;
  }

  const isoWeek = state.weekData.isoWeek;
  const checkin = getCheckin(isoWeek) || {};
  const intentions = state.weekData.intentions;

  let html = `<div class="header">
    <h1>Miðviku check-in</h1>
    <div class="sub">${state.weekData.dateRange}</div>
  </div>`;

  // Show intentions for reference
  html += `<div class="intention" style="margin-bottom:20px">
    <div class="label">Ásetningar vikunnar</div>
    <div class="text" style="margin-bottom:4px"><strong>Sólon:</strong> ${intentions.solon}</div>
    <div class="text" style="margin-bottom:4px"><strong>Hekla:</strong> ${intentions.hekla}</div>
    <div class="saman">Saman: ${intentions.saman}</div>
  </div>`;

  // Sólon check-in
  html += renderPersonCheckin('Sólon', 'solon', checkin.solon);

  // Hekla check-in
  html += renderPersonCheckin('Hekla', 'hekla', checkin.hekla);

  // Save button
  html += `<button class="checkin-submit" id="checkin-save">Vista check-in</button>`;

  el.innerHTML = html;

  // Bind option clicks
  el.querySelectorAll('.checkin-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const person = opt.dataset.person;
      el.querySelectorAll(`.checkin-option[data-person="${person}"]`).forEach(o =>
        o.classList.remove('selected')
      );
      opt.classList.add('selected');
    });
  });

  // Save
  document.getElementById('checkin-save')?.addEventListener('click', () => {
    const getVal = (person) => {
      const selected = el.querySelector(`.checkin-option.selected[data-person="${person}"]`);
      const comment = el.querySelector(`#comment-${person}`)?.value?.trim() || '';
      return selected ? { onTrack: selected.dataset.value, comment } : null;
    };

    const data = {
      solon: getVal('solon'),
      hekla: getVal('hekla'),
      timestamp: new Date().toISOString()
    };

    saveCheckin(isoWeek, data);
    showToast('Check-in vistað!');
    navigate('#daily');
  });
}

function renderPersonCheckin(name, key, existing) {
  const options = [
    { value: 'yes', label: 'Já ✓', emoji: '' },
    { value: 'meh', label: 'Svona', emoji: '' },
    { value: 'no', label: 'Nei ✗', emoji: '' }
  ];

  let html = `<div class="checkin-card">
    <div class="checkin-person">${name}</div>
    <div style="font-size:14px;color:var(--text-mid);margin-bottom:10px">Er vikan á réttri braut?</div>
    <div class="checkin-options">`;

  options.forEach(opt => {
    const selected = existing?.onTrack === opt.value ? ' selected' : '';
    html += `<button class="checkin-option${selected}" data-person="${key}" data-value="${opt.value}">${opt.label}</button>`;
  });

  html += `</div>
    <textarea class="checkin-comment" id="comment-${key}" placeholder="Athugasemd (valfrjálst)...">${existing?.comment || ''}</textarea>
  </div>`;

  return html;
}
