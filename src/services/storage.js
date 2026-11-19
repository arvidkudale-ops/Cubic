const DB = 'cubic';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run(storeName, mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = fn(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

export async function loadState() {
  try {
    const saved = await run('kv', 'readonly', (store) => store.get('state'));
    if (saved) return saved;
  } catch {
    /* local fallback */
  }
  try {
    const raw = localStorage.getItem('cubic-state');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveState(state) {
  const payload = { ...state, savedAt: Date.now() };
  try { localStorage.setItem('cubic-state', JSON.stringify(payload)); } catch { /* ignore quota */ }
  try { await run('kv', 'readwrite', (store) => store.put(payload, 'state')); } catch { /* ignore */ }
}

export async function listBackups() {
  try {
    const rows = await run('backups', 'readonly', (store) => store.getAll());
    return (rows || []).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export async function saveBackup(state) {
  const entry = { id: `backup-${Date.now()}`, savedAt: Date.now(), state };
  try {
    await run('backups', 'readwrite', (store) => store.put(entry));
    const all = await listBackups();
    await Promise.all(all.slice(10).map((item) => run('backups', 'readwrite', (store) => store.delete(item.id))));
    return entry;
  } catch (error) {
    return { error: error.message };
  }
}
