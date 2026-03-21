// data.js — Data fetching and localStorage helpers

const BASE = import.meta.url.includes('localhost') || import.meta.url.includes('127.0.0.1')
  ? '.' : '.';

export async function fetchJSON(path) {
  try {
    const res = await fetch(`${BASE}/${path}?t=${Date.now()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function loadWeekIndex() {
  return await fetchJSON('data/weeks/index.json') || [];
}

export async function loadWeek(isoWeek) {
  return await fetchJSON(`data/weeks/${isoWeek}.json`);
}

export async function loadLongTerm() {
  return await fetchJSON('data/long-term.json');
}

export async function loadContext() {
  return await fetchJSON('data/context.json');
}

export async function loadReflection(isoWeek) {
  return await fetchJSON(`data/reflections/${isoWeek}.json`);
}

// localStorage helpers
const LS_PREFIX = 'vikuplan_';

export function lsGet(key) {
  try {
    const val = localStorage.getItem(LS_PREFIX + key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export function lsSet(key, val) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch {}
}

// Inbox
export function getInboxItems() {
  return lsGet('inbox') || [];
}

export function addInboxItem(item) {
  const items = getInboxItems();
  items.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    ...item
  });
  lsSet('inbox', items);
  return items;
}

export function removeInboxItem(id) {
  const items = getInboxItems().filter(i => i.id !== id);
  lsSet('inbox', items);
  return items;
}

export function exportInbox() {
  const items = getInboxItems();
  if (!items.length) return 'Engar athugasemdir í inbox.';

  const catLabels = {
    observation: 'Athugasemd',
    idea: 'Hugmynd',
    event: 'Nýr atburður',
    thought: 'Pæling'
  };

  let text = '=== INBOX EXPORT ===\n';
  text += `Exported: ${new Date().toLocaleString('is-IS')}\n\n`;

  items.forEach(item => {
    const date = new Date(item.timestamp).toLocaleString('is-IS', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    text += `[${catLabels[item.category] || item.category}] ${date}\n`;
    text += `${item.text}\n\n`;
  });

  return text;
}

// Check-in
export function getCheckin(isoWeek) {
  return lsGet(`checkin_${isoWeek}`);
}

export function saveCheckin(isoWeek, data) {
  lsSet(`checkin_${isoWeek}`, data);
}

// AI summaries
export async function loadAiSummary(yearMonth) {
  return await fetchJSON(`data/ai-summaries/${yearMonth}.json`);
}

// Vikuord (weekly word/emoji)
export function getVikuord(isoWeek) {
  return lsGet(`vikuord_${isoWeek}`);
}

export function setVikuord(isoWeek, person, val) {
  const current = getVikuord(isoWeek) || {};
  current[person] = val;
  lsSet(`vikuord_${isoWeek}`, current);
}

// Person preference
export function getSelectedPerson() {
  return lsGet('person') || 'solon';
}

export function setSelectedPerson(person) {
  lsSet('person', person);
}
