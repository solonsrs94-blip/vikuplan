// firebase.js — Firebase Realtime Database sync
// All localStorage data syncs to Firebase so both devices see the same data

const DB_URL = 'https://vikuplan-f3f90-default-rtdb.europe-west1.firebasedatabase.app';

// Keys to sync (all localStorage keys that hold user data)
const SYNC_KEYS = [
  'vikuplan_inbox',
  'vikuplan_checkin_',      // prefix — multiple keys
  'vikuplan_daynotes_',     // prefix — multiple keys
  'vikuplan_vikuord_',      // prefix — multiple keys
  'vikuplan_todos_solon',
  'vikuplan_todos_hekla',
  'vikuplan_exercise_solon',
  'vikuplan_exercise_hekla',
  'vikuplan_diet_solon',
  'vikuplan_diet_hekla',
  'vikuplan_ideas_solon',
  'vikuplan_ideas_hekla',
  'vikuplan_vd_notes',
  'vikuplan_vd_goals',
  'vikuplan_vd_growth',
  'vikuplan_person'
];

// Check if a localStorage key should be synced
function shouldSync(key) {
  return SYNC_KEYS.some(sk => key === sk || (sk.endsWith('_') && key.startsWith(sk)));
}

// Get all syncable keys from localStorage
function getAllSyncKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (shouldSync(key)) keys.push(key);
  }
  return keys;
}

// Firebase REST API helpers
async function fbGet(path) {
  try {
    const res = await fetch(`${DB_URL}/${path}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fbSet(path, data) {
  try {
    await fetch(`${DB_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return true;
  } catch { return false; }
}

// Sanitize key for Firebase path (no dots, $, #, [, ], /)
function toFbKey(key) {
  return key.replace(/[.$#\[\]\/]/g, '_');
}

// Upload all localStorage to Firebase
export async function pushToFirebase() {
  const keys = getAllSyncKeys();
  const data = {};
  keys.forEach(key => {
    try {
      const val = localStorage.getItem(key);
      if (val) data[toFbKey(key)] = val;
    } catch {}
  });
  data._lastPush = new Date().toISOString();
  return await fbSet('appdata', data);
}

// Download from Firebase and merge into localStorage
export async function pullFromFirebase() {
  const data = await fbGet('appdata');
  if (!data) return false;

  Object.keys(data).forEach(fbKey => {
    if (fbKey === '_lastPush') return;
    // Convert Firebase key back to localStorage key
    const lsKey = fbKey; // keys are the same since we used the original key names
    try {
      const remoteVal = data[fbKey];
      if (remoteVal && typeof remoteVal === 'string') {
        const localVal = localStorage.getItem(lsKey);
        if (!localVal) {
          // Local is empty, use remote
          localStorage.setItem(lsKey, remoteVal);
        } else {
          // Both exist — merge arrays, keep newest
          mergeData(lsKey, localVal, remoteVal);
        }
      }
    } catch {}
  });
  return true;
}

// Smart merge — for arrays, combine and deduplicate by id
function mergeData(key, localStr, remoteStr) {
  try {
    const local = JSON.parse(localStr);
    const remote = JSON.parse(remoteStr);

    if (Array.isArray(local) && Array.isArray(remote)) {
      // Merge arrays by id (keep unique items from both)
      const merged = [...local];
      const localIds = new Set(local.map(i => i.id).filter(Boolean));
      remote.forEach(item => {
        if (item.id && !localIds.has(item.id)) {
          merged.push(item);
        }
      });
      // Sort by timestamp if available (newest first)
      if (merged[0]?.timestamp) {
        merged.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      }
      localStorage.setItem(key, JSON.stringify(merged));
    } else {
      // Not arrays — use remote if local is older or same
      // For simple values, remote wins (it was set by the other person)
      localStorage.setItem(key, remoteStr);
    }
  } catch {
    // Parse failed — use remote
    localStorage.setItem(key, remoteStr);
  }
}

// Auto-sync: push after any change, pull on load
let pushTimer = null;

export function schedulePush() {
  // Debounce — wait 2 seconds after last change before pushing
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushToFirebase();
  }, 2000);
}

// Initial sync on app load
export async function initFirebaseSync() {
  // Pull first (get data from other device)
  await pullFromFirebase();

  // Then push local data
  await pushToFirebase();

  // Intercept localStorage.setItem to auto-push on changes
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    originalSetItem(key, value);
    if (shouldSync(key)) {
      schedulePush();
    }
  };

  console.log('[Firebase] Sync initialized');
}
