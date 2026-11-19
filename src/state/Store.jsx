import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { eventById } from '../data/events.js';
import { isPersonalBestSingle, summarize } from '../engine/stats.js';
import { effectiveMs } from '../engine/time.js';
import { createScramble } from '../services/scrambleApi.js';
import { listBackups, loadState, saveBackup, saveState } from '../services/storage.js';
import { DEFAULT_SETTINGS, mergeSettings } from './settings.js';

const StoreContext = createContext(null);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function freshSession(eventId, name) {
  const event = eventById(eventId);
  return { id: uid(), name: name || `${event.label} Main`, eventId, createdAt: Date.now(), solves: [] };
}

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [eventId, setEventIdState] = useState('333');
  const [stack, setStack] = useState([]);
  const [stackIndex, setStackIndex] = useState(0);
  const [caseName, setCaseName] = useState('');
  const [scrambleSource, setScrambleSource] = useState('');
  const [view, setView] = useState('timer');
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [solveCount, setSolveCount] = useState(0);
  const saveTimer = useRef(0);
  const stackRef = useRef([]);
  const indexRef = useRef(0);
  const scrambleLock = useRef(false);
  const scrambleGen = useRef(0);
  stackRef.current = stack;
  indexRef.current = stackIndex;

  const toast = useCallback((message, tone = 'info') => {
    const id = uid();
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3400);
  }, []);

  const pushScramble = useCallback(async (nextEvent = eventId, nextSettings = settings) => {
    const result = await createScramble(nextEvent, nextSettings);
    setStack((list) => [...list.slice(0, stackIndex + 1), result.scramble]);
    setStackIndex((index) => {
      const base = Math.min(index, stack.length - 1);
      return (base < 0 ? 0 : base) + (stack.length ? 1 : 0);
    });
    setCaseName(result.caseName || '');
    setScrambleSource(result.source || '');
    return result.scramble;
  }, [eventId, settings, stack.length, stackIndex]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const saved = await loadState();
      if (cancel) return;
      if (saved?.sessions?.length) {
        setSettings(mergeSettings(saved.settings));
        setSessions(saved.sessions);
        setCurrentSessionId(saved.currentSessionId || saved.sessions[0].id);
        setEventIdState(saved.eventId || '333');
        setSolveCount(saved.sessions.reduce((sum, session) => sum + session.solves.length, 0));
      } else {
        const session = freshSession('333');
        setSessions([session]);
        setCurrentSessionId(session.id);
      }
      setReady(true);
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState({ settings, sessions, currentSessionId, eventId, version: 1 });
    }, 250);
  }, [ready, settings, sessions, currentSessionId, eventId]);

  useEffect(() => {
    if (!ready || stackRef.current.length) return;
    const token = ++scrambleGen.current;
    createScramble(eventId, settings).then((result) => {
      if (token !== scrambleGen.current) return;
      stackRef.current = [result.scramble];
      indexRef.current = 0;
      setStack([result.scramble]);
      setStackIndex(0);
      setCaseName(result.caseName || '');
      setScrambleSource(result.source || '');
    });
  }, [ready]);

  const session = sessions.find((item) => item.id === currentSessionId) || sessions[0];
  const solves = session?.solves || [];
  const scramble = stack[stackIndex] || '';

  const updateSession = useCallback((id, updater) => {
    setSessions((list) => list.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const actions = useMemo(() => ({
    toast,
    setView,
    setDrawer,
    setModal,
    setSettings: (patch) => {
      setSettings((current) => {
        const next = structuredClone(current);
        const apply = (target, source) => {
          Object.entries(source).forEach(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              target[key] = target[key] || {};
              apply(target[key], value);
            } else target[key] = value;
          });
        };
        apply(next, patch);
        return next;
      });
    },
    replaceSettings: (next) => setSettings(mergeSettings(next)),
    async setEvent(nextEvent) {
      setEventIdState(nextEvent);
      const currentSettings = settings;
      if (currentSettings.general.autoSessionOnEvent) {
        const existing = sessions.find((item) => item.eventId === nextEvent);
        if (existing) setCurrentSessionId(existing.id);
        else {
          const created = freshSession(nextEvent);
          setSessions((list) => (list.some((item) => item.eventId === nextEvent) ? list : [...list, created]));
          setCurrentSessionId(created.id);
        }
      }
      const token = ++scrambleGen.current;
      const result = await createScramble(nextEvent, currentSettings);
      if (token !== scrambleGen.current) return;
      stackRef.current = [result.scramble];
      indexRef.current = 0;
      setStack([result.scramble]);
      setStackIndex(0);
      setCaseName(result.caseName || '');
      setScrambleSource(result.source || '');
    },
    selectSession(id) {
      const next = sessions.find((item) => item.id === id);
      if (!next) return;
      setCurrentSessionId(id);
      if (settings.general.autoSessionOnEvent && next.eventId !== eventId) {
        setEventIdState(next.eventId);
        const token = ++scrambleGen.current;
        createScramble(next.eventId, settings).then((result) => {
          if (token !== scrambleGen.current) return;
          stackRef.current = [result.scramble];
          indexRef.current = 0;
          setStack([result.scramble]);
          setStackIndex(0);
          setCaseName(result.caseName || '');
          setScrambleSource(result.source || '');
        });
      }
    },
    createSession(name, forEvent = eventId) {
      const created = freshSession(forEvent, name);
      setSessions((list) => [...list, created]);
      setCurrentSessionId(created.id);
      toast(`Created ${created.name}`, 'good');
    },
    renameSession(id, name) {
      updateSession(id, (item) => ({ ...item, name }));
    },
    deleteSession(id) {
      setSessions((list) => {
        const next = list.filter((item) => item.id !== id);
        if (!next.length) {
          const created = freshSession(eventId);
          setCurrentSessionId(created.id);
          return [created];
        }
        if (id === currentSessionId) setCurrentSessionId(next[0].id);
        return next;
      });
    },
    clearSession(id) {
      updateSession(id, (item) => ({ ...item, solves: [] }));
      toast('Session cleared');
    },
    splitSession(id, index) {
      const source = sessions.find((item) => item.id === id);
      if (!source || index <= 0 || index >= source.solves.length) return;
      const created = { ...freshSession(source.eventId, `${source.name} split`), solves: source.solves.slice(index) };
      updateSession(id, (item) => ({ ...item, solves: item.solves.slice(0, index) }));
      setSessions((list) => [...list, created]);
      toast('Session split');
    },
    mergeSession(fromId, intoId) {
      const from = sessions.find((item) => item.id === fromId);
      if (!from || fromId === intoId) return;
      updateSession(intoId, (item) => ({ ...item, solves: [...item.solves, ...from.solves] }));
      setSessions((list) => list.filter((item) => item.id !== fromId));
      if (fromId === currentSessionId) setCurrentSessionId(intoId);
      toast('Sessions merged');
    },
    async nextScramble() {
      if (indexRef.current < stackRef.current.length - 1) {
        indexRef.current += 1;
        setStackIndex(indexRef.current);
        return;
      }
      if (scrambleLock.current) return;
      scrambleLock.current = true;
      const token = ++scrambleGen.current;
      try {
        const result = await createScramble(eventId, settings);
        if (token !== scrambleGen.current) return;
        const list = [...stackRef.current, result.scramble];
        stackRef.current = list;
        indexRef.current = list.length - 1;
        setStack(list);
        setStackIndex(list.length - 1);
        setCaseName(result.caseName || '');
        setScrambleSource(result.source || '');
      } finally {
        scrambleLock.current = false;
      }
    },
    prevScramble() {
      const next = Math.max(0, indexRef.current - 1);
      indexRef.current = next;
      setStackIndex(next);
    },
    async inputScramble(text) {
      const value = text.trim();
      if (!value) return;
      setStack((list) => [...list.slice(0, stackIndex), value, ...list.slice(stackIndex + 1)]);
      setCaseName('manual');
      setScrambleSource('manual');
    },
    addSolve(partial) {
      const solve = {
        id: uid(),
        time: partial.time,
        penalty: partial.penalty || 'ok',
        scramble: partial.scramble ?? scramble,
        date: partial.date || Date.now(),
        comment: partial.comment || '',
        reconstruction: partial.reconstruction || '',
        phases: partial.phases || [],
        moves: partial.moves || null,
        eventId,
      };
      const nextSolves = [...solves, solve];
      const wasBest = isPersonalBestSingle(nextSolves, nextSolves.length - 1);
      const sessionId = session.id;
      setSessions((list) => list.map((item) => (item.id === sessionId ? { ...item, solves: [...item.solves, solve] } : item)));
      setSolveCount((count) => count + 1);
      if (wasBest && solve.penalty !== 'dnf') toast(`New best ${formatBest(solve)}`, 'good');
      if (settings.scramble.autoGenerate && !scrambleLock.current) {
        scrambleLock.current = true;
        const token = ++scrambleGen.current;
        createScramble(eventId, settings).then((result) => {
          if (token !== scrambleGen.current) return;
          const list = [...stackRef.current, result.scramble];
          stackRef.current = list;
          indexRef.current = list.length - 1;
          setStack(list);
          setStackIndex(list.length - 1);
          setCaseName(result.caseName || '');
          setScrambleSource(result.source || '');
        }).finally(() => { scrambleLock.current = false; });
      }
      const every = settings.data.autoBackupEvery || 0;
      if (every > 0 && (solveCount + 1) % every === 0) {
        saveBackup({ settings, sessions: sessions.map((item) => item.id === session.id ? { ...item, solves: nextSolves } : item), currentSessionId, eventId });
        toast(`Local backup saved after ${every} solves`);
      }
      return solve;
    },
    updateSolve(id, patch) {
      updateSession(session.id, (item) => ({
        ...item,
        solves: item.solves.map((solve) => (solve.id === id ? { ...solve, ...patch } : solve)),
      }));
    },
    deleteSolve(id) {
      updateSession(session.id, (item) => ({ ...item, solves: item.solves.filter((solve) => solve.id !== id) }));
    },
    deleteLast() {
      if (!solves.length) return;
      updateSession(session.id, (item) => ({ ...item, solves: item.solves.slice(0, -1) }));
      toast('Deleted latest solve');
    },
    deleteMany(ids) {
      const set = new Set(ids);
      updateSession(session.id, (item) => ({ ...item, solves: item.solves.filter((solve) => !set.has(solve.id)) }));
    },
    setPenalty(id, penalty) {
      updateSession(session.id, (item) => ({
        ...item,
        solves: item.solves.map((solve) => (solve.id === id ? { ...solve, penalty } : solve)),
      }));
    },
    penaltyLast(penalty) {
      if (!solves.length) return;
      const last = solves[solves.length - 1];
      updateSession(session.id, (item) => ({
        ...item,
        solves: item.solves.map((solve) => (solve.id === last.id ? { ...solve, penalty } : solve)),
      }));
    },
    setTools(slots) {
      setSettings((current) => ({ ...current, tools: { ...current.tools, slots: slots.slice(0, 4) } }));
    },
    exportData() {
      const blob = new Blob([JSON.stringify({ app: 'cubic', version: 1, settings, sessions, currentSessionId, eventId }, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `cubic-backup-${new Date().toISOString().slice(0, 10)}.json`);
    },
    exportSessionCsv() {
      const header = 'number,time_ms,penalty,scramble,date,comment,reconstruction';
      const rows = solves.map((solve, index) => [index + 1, solve.time, solve.penalty, csv(solve.scramble), new Date(solve.date).toISOString(), csv(solve.comment), csv(solve.reconstruction)].join(','));
      downloadBlob(new Blob([[header, ...rows].join('\n')], { type: 'text/csv' }), `${session.name}.csv`);
    },
    async importData(file, mode = 'replace') {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.sessions && !data.solves) throw new Error('This file is not a Cubic backup.');
      if (data.sessions) {
        if (mode === 'merge') setSessions((list) => [...list, ...data.sessions]);
        else {
          setSessions(data.sessions);
          setCurrentSessionId(data.currentSessionId || data.sessions[0]?.id);
        }
      }
      if (data.settings && mode === 'replace') setSettings(mergeSettings(data.settings));
      if (data.eventId && mode === 'replace') setEventIdState(data.eventId);
      toast('Import complete', 'good');
    },
    async backups() { return listBackups(); },
    async backupNow() {
      const entry = await saveBackup({ settings, sessions, currentSessionId, eventId });
      if (entry.error) toast(entry.error, 'bad');
      else toast('Backup stored on this device', 'good');
    },
    restoreBackup(entry) {
      const data = entry.state;
      setSessions(data.sessions || []);
      setCurrentSessionId(data.currentSessionId);
      setEventIdState(data.eventId || '333');
      if (data.settings) setSettings(mergeSettings(data.settings));
      toast('Backup restored', 'good');
    },
    clearAll() {
      const created = freshSession('333');
      setSessions([created]);
      setCurrentSessionId(created.id);
      setSettings(DEFAULT_SETTINGS);
      setEventIdState('333');
      setStack([]);
      toast('All local data cleared');
    },
  }), [caseName, currentSessionId, eventId, scramble, session, sessions, settings, solves, stack, stackIndex, solveCount, toast, updateSession]);

  const stats = useMemo(() => summarize(solves, { customAo: settings.stats.customAo || 100 }), [solves, settings.stats.customAo]);

  const value = {
    ready,
    settings,
    sessions,
    session,
    solves,
    eventId,
    scramble,
    caseName,
    scrambleSource,
    canPrev: stackIndex > 0,
    canNext: true,
    view,
    drawer,
    modal,
    toasts,
    stats,
    actions,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store missing');
  return value;
}

function formatBest(solve) {
  const ms = effectiveMs(solve);
  if (ms == null) return 'DNF';
  return (ms / 1000).toFixed(2);
}

function csv(value) {
  const text = String(value ?? '').replaceAll('"', '""');
  return `"${text}"`;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
