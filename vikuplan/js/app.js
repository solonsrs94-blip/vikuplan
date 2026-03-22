// app.js — Router, state management, initialization
import {
  loadWeekIndex, loadWeek, loadLongTerm, loadContext,
  getSelectedPerson, setSelectedPerson, getInboxItems
} from './data.js?v=12';
import { renderDaily } from './views/daily.js?v=12';
import { renderInbox } from './views/inbox.js?v=12';
import { renderCheckin } from './views/checkin.js?v=12';
import { renderTimeline } from './views/timeline.js?v=12';
import { renderHistory } from './views/history.js?v=12';
import { renderReflection, renderMonthly } from './views/reflection.js?v=12';
import { renderYfirlit } from './views/yfirlit.js?v=12';
import { renderVd } from './views/vd.js?v=12';
import { renderPersonal } from './views/personal.js?v=12';
import { initFirebaseSync } from './firebase.js?v=12';

// Global state
export const state = {
  person: 'solon',
  selectedDay: 0,
  currentWeek: null,
  weekData: null,
  weekIndex: [],
  longTerm: null,
  context: null
};

// DOM references
let appEl, navEl;

// Initialize
export async function init() {
  appEl = document.getElementById('app');
  navEl = document.getElementById('bottom-nav');

  state.person = getSelectedPerson();
  updatePersonToggle();
  updateAccentColors();

  // Load data
  state.weekIndex = await loadWeekIndex();
  if (state.weekIndex.length > 0) {
    state.currentWeek = state.weekIndex[state.weekIndex.length - 1];
    state.weekData = await loadWeek(state.currentWeek);
  }
  state.longTerm = await loadLongTerm();
  state.context = await loadContext();

  // Auto-detect today
  if (state.weekData) {
    const today = new Date().toISOString().split('T')[0];
    const dayIdx = state.weekData.days.findIndex(d => d.isoDate === today);
    if (dayIdx >= 0) state.selectedDay = dayIdx;
  }

  // Setup person toggle
  document.getElementById('btn-solon').addEventListener('click', () => setPerson('solon'));
  document.getElementById('btn-hekla').addEventListener('click', () => setPerson('hekla'));

  // Setup swipe
  setupSwipe();

  // Firebase sync
  initFirebaseSync().then(() => {
    // Re-render after sync in case new data came in
    route();
    updateNavBadge();
  });

  // Route
  window.addEventListener('hashchange', route);
  route();

  // Update nav badge
  updateNavBadge();
}

function setPerson(p) {
  state.person = p;
  setSelectedPerson(p);
  updatePersonToggle();
  updateAccentColors();
  route();
}

function updatePersonToggle() {
  const btnS = document.getElementById('btn-solon');
  const btnH = document.getElementById('btn-hekla');
  btnS.className = 'person-btn' + (state.person === 'solon' ? ' active-solon' : '');
  btnH.className = 'person-btn' + (state.person === 'hekla' ? ' active-hekla' : '');
}

function updateAccentColors() {
  const r = document.documentElement.style;
  if (state.person === 'solon') {
    r.setProperty('--accent', '#2563EB');
    r.setProperty('--accent-light', '#EFF6FF');
    r.setProperty('--accent-mid', '#DBEAFE');
    r.setProperty('--accent-dark', '#1D4ED8');
    r.setProperty('--other', '#059669');
    r.setProperty('--other-light', '#ECFDF5');
  } else {
    r.setProperty('--accent', '#059669');
    r.setProperty('--accent-light', '#ECFDF5');
    r.setProperty('--accent-mid', '#D1FAE5');
    r.setProperty('--accent-dark', '#047857');
    r.setProperty('--other', '#2563EB');
    r.setProperty('--other-light', '#EFF6FF');
  }
}

export function updateNavBadge() {
  const badge = document.getElementById('inbox-badge');
  const count = getInboxItems().length;
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
}

// Routing
function route() {
  const hash = location.hash || '#daily';
  const [view, param] = hash.slice(1).split('/');

  // Update nav active state
  navEl.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });

  // Render view
  switch (view) {
    case 'inbox': renderInbox(appEl); break;
    case 'checkin': renderCheckin(appEl); break;
    case 'timeline': renderTimeline(appEl); break;
    case 'history': renderHistory(appEl); break;
    case 'reflection': renderReflection(appEl, param); break;
    case 'monthly': renderMonthly(appEl, param); break;
    case 'yfirlit': renderYfirlit(appEl); break;
    case 'vd': renderVd(appEl); break;
    case 'personal': renderPersonal(appEl, 'overview'); break;
    default: renderDaily(appEl); break;
  }
}

export function navigate(hash) {
  location.hash = hash;
}

export function setDay(i) {
  state.selectedDay = i;
  renderDaily(appEl);
}

// Touch swipe
function setupSwipe() {
  let startX = 0;
  document.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].screenX - startX;
    const hash = location.hash || '#daily';
    if (!hash.startsWith('#daily')) return;

    if (Math.abs(diff) > 60) {
      if (diff < 0 && state.selectedDay < 6) {
        state.selectedDay++;
        renderDaily(appEl);
      } else if (diff > 0 && state.selectedDay > 0) {
        state.selectedDay--;
        renderDaily(appEl);
      }
    }
  }, { passive: true });
}

// Toast
export function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Init on load
init();
