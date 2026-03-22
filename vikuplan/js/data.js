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
    const personName = item.person === 'solon' ? 'Sólon' : item.person === 'hekla' ? 'Hekla' : '';
    text += `[${catLabels[item.category] || item.category}]${personName ? ` (${personName})` : ''} ${date}\n`;
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

// Day notes
export function getDayNotes(isoDate) {
  return lsGet(`daynotes_${isoDate}`) || [];
}

export function addDayNote(isoDate, note) {
  const items = getDayNotes(isoDate);
  items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    done: false,
    ...note
  });
  lsSet(`daynotes_${isoDate}`, items);
  return items;
}

export function removeDayNote(isoDate, noteId) {
  const items = getDayNotes(isoDate).filter(i => i.id !== noteId);
  lsSet(`daynotes_${isoDate}`, items);
  return items;
}

export function toggleDayNote(isoDate, noteId) {
  const items = getDayNotes(isoDate);
  const item = items.find(i => i.id === noteId);
  if (item) item.done = !item.done;
  lsSet(`daynotes_${isoDate}`, items);
  return items;
}

// VD notes and goals
export function getVdNotes() {
  return lsGet('vd_notes') || [];
}

export function addVdNote(note) {
  const items = getVdNotes();
  items.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    ...note
  });
  lsSet('vd_notes', items);
  return items;
}

export function removeVdNote(id) {
  const items = getVdNotes().filter(i => i.id !== id);
  lsSet('vd_notes', items);
  return items;
}

export function getVdGoals() {
  return lsGet('vd_goals') || [];
}

export function addVdGoal(goal) {
  const items = getVdGoals();
  items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    done: false,
    ...goal
  });
  lsSet('vd_goals', items);
  return items;
}

export function toggleVdGoal(id) {
  const items = getVdGoals();
  const item = items.find(i => i.id === id);
  if (item) item.done = !item.done;
  lsSet('vd_goals', items);
  return items;
}

export function removeVdGoal(id) {
  const items = getVdGoals().filter(i => i.id !== id);
  lsSet('vd_goals', items);
  return items;
}

// Personal todos
export function getTodos(person) {
  return lsGet(`todos_${person}`) || [];
}

export function addTodo(person, todo) {
  const items = getTodos(person);
  items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    done: false,
    ...todo
  });
  lsSet(`todos_${person}`, items);
  return items;
}

export function toggleTodo(person, id) {
  const items = getTodos(person);
  const item = items.find(i => i.id === id);
  if (item) item.done = !item.done;
  lsSet(`todos_${person}`, items);
  return items;
}

export function removeTodo(person, id) {
  const items = getTodos(person).filter(i => i.id !== id);
  lsSet(`todos_${person}`, items);
  return items;
}

// Exercise log
export function getExerciseLog(person) {
  return lsGet(`exercise_${person}`) || [];
}

export function addExerciseEntry(person, entry) {
  const items = getExerciseLog(person);
  items.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString().split('T')[0],
    ...entry
  });
  lsSet(`exercise_${person}`, items);
  return items;
}

// Master export — all user data
export function exportAllUserData() {
  const data = { exportedAt: new Date().toISOString() };

  // Inbox
  data.inbox = getInboxItems();

  // Day notes — scan all localStorage keys
  data.dayNotes = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('vikuplan_daynotes_')) {
      const date = key.replace('vikuplan_daynotes_', '');
      data.dayNotes[date] = JSON.parse(localStorage.getItem(key));
    }
  }

  // Check-ins
  data.checkins = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('vikuplan_checkin_')) {
      const week = key.replace('vikuplan_checkin_', '');
      data.checkins[week] = JSON.parse(localStorage.getItem(key));
    }
  }

  // VD
  data.vdNotes = getVdNotes();
  data.vdGoals = getVdGoals();

  // Personal todos
  data.todos = { solon: getTodos('solon'), hekla: getTodos('hekla') };

  // Exercise
  data.exercise = { solon: getExerciseLog('solon'), hekla: getExerciseLog('hekla') };

  // Vikuord
  data.vikuord = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('vikuplan_vikuord_')) {
      const week = key.replace('vikuplan_vikuord_', '');
      data.vikuord[week] = JSON.parse(localStorage.getItem(key));
    }
  }

  return data;
}

// Person preference
export function getSelectedPerson() {
  return lsGet('person') || 'solon';
}

export function setSelectedPerson(person) {
  lsSet('person', person);
}
