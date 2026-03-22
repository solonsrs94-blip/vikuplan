// inbox.js — Quick notes / inbox view
import { getInboxItems, addInboxItem, removeInboxItem } from '../data.js?v=14';
import { state, showToast, updateNavBadge } from '../app.js?v=14';

const CATEGORIES = [
  { id: 'observation', label: '💬 Athugasemd', placeholder: 'Hvað gerðist?' },
  { id: 'idea', label: '💡 Hugmynd', placeholder: 'Hvað dettur þér í hug?' },
  { id: 'event', label: '📅 Atburður', placeholder: 'Hvað og hvenær?' },
  { id: 'thought', label: '🤔 Pæling', placeholder: 'Hvað viltu ræða á sunnudegi?' }
];

const CAT_LABELS = {
  observation: 'Athugasemd',
  idea: 'Hugmynd',
  event: 'Atburður',
  thought: 'Pæling'
};

let selectedCat = 'observation';

export function renderInbox(el) {
  const items = getInboxItems();

  let html = `<div class="header">
    <h1>Inbox</h1>
    <div class="sub">Skráðu athugasemdir, hugmyndir og pælingar</div>
  </div>`;

  // Input form
  html += `<div class="inbox-form">
    <div class="inbox-categories">`;
  CATEGORIES.forEach(cat => {
    html += `<button class="inbox-cat ${cat.id === selectedCat ? 'active' : ''}" data-cat="${cat.id}">${cat.label}</button>`;
  });
  html += `</div>
    <textarea class="inbox-textarea" id="inbox-text" placeholder="${CATEGORIES.find(c => c.id === selectedCat).placeholder}"></textarea>
    <button class="inbox-submit" id="inbox-add">Bæta við</button>
  </div>`;

  // Items list
  if (items.length > 0) {
    html += `<div class="section-title">Skráð (${items.length})</div>`;
    html += `<div class="inbox-list">`;
    items.forEach(item => {
      const date = new Date(item.timestamp);
      const dateStr = date.toLocaleString('is-IS', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      const personLabel = item.person === 'solon' ? 'Sólon' : item.person === 'hekla' ? 'Hekla' : '';
      const personColor = item.person === 'solon' ? '#2563EB' : item.person === 'hekla' ? '#059669' : '';
      html += `<div class="inbox-item" data-id="${item.id}">
        <span class="inbox-item-cat">${CAT_LABELS[item.category] || item.category}</span>
        ${personLabel ? `<span class="inbox-item-person" style="color:${personColor};font-size:11px;font-weight:600;margin-left:6px">${personLabel}</span>` : ''}
        <button class="inbox-item-delete" data-delete="${item.id}">✕</button>
        <div class="inbox-item-text">${escapeHtml(item.text)}</div>
        <div class="inbox-item-time">${dateStr}</div>
      </div>`;
    });
    html += `</div>`;

  } else {
    html += `<div class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">Ekkert skráð ennþá.<br>Bættu við athugasemdum yfir vikuna!</div>
    </div>`;
  }

  el.innerHTML = html;

  // Bind events
  el.querySelectorAll('.inbox-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCat = btn.dataset.cat;
      renderInbox(el);
      setTimeout(() => document.getElementById('inbox-text')?.focus(), 50);
    });
  });

  document.getElementById('inbox-add')?.addEventListener('click', () => {
    const text = document.getElementById('inbox-text')?.value?.trim();
    if (!text) return;
    addInboxItem({ category: selectedCat, text, person: state.person });
    updateNavBadge();
    showToast('Bætt við!');
    renderInbox(el);
  });

  el.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeInboxItem(btn.dataset.delete);
      updateNavBadge();
      renderInbox(el);
    });
  });

  // Handle Enter key in textarea
  document.getElementById('inbox-text')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('inbox-add')?.click();
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
