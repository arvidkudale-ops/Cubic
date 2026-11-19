import { useEffect, useMemo, useState } from 'react';
import { BarChart3, History, Menu, Settings, Sparkles, Timer, Wrench } from 'lucide-react';
import { translate } from './i18n.js';
import { effectiveMs, formatTime, parseTypedTime, penaltyLabel } from './engine/time.js';
import { useStore } from './state/Store.jsx';
import { FeaturesPage } from './components/FeaturesPage.jsx';
import { SettingsPage } from './components/SettingsPage.jsx';
import { StatsPage } from './components/StatsPage.jsx';
import { TimerScreen } from './components/TimerScreen.jsx';
import { ToolsPanel } from './components/Tools.jsx';
import { VirtualCube } from './components/VirtualCube.jsx';
import { Field, Modal, TextButton } from './components/ui.jsx';

export default function App() {
  const store = useStore();
  const { ready, settings, actions, view, drawer, toasts } = store;
  useTheme(settings);
  useShortcuts(store);
  if (!ready) {
    return <div className="grid h-full place-items-center text-[var(--muted)]">Loading Cubic…</div>;
  }
  const t = (key) => translate(settings.general.language, key);
  return (
    <>
      <div className="app-bg" style={settings.appearance.background ? { backgroundImage: `linear-gradient(rgba(8,9,13,${1 - settings.appearance.backgroundOpacity}), rgba(8,9,13,${1 - settings.appearance.backgroundOpacity})), url(${settings.appearance.background})`, backgroundSize: 'cover' } : undefined} />
      <div className="shell">
        <aside className={`side panel chrome ${drawer === 'left' ? 'open' : ''}`}><Sidebar /></aside>
        <main className="stage">
          {view === 'timer' && <TimerScreen />}
          {view === 'stats' && <StatsPage />}
          {view === 'settings' && <SettingsPage />}
          {view === 'virtual' && <VirtualCube />}
          {view === 'features' && <FeaturesPage />}
        </main>
        <aside className={`side right panel chrome ${drawer === 'right' ? 'open' : ''}`}><ToolsPanel /></aside>
      </div>
      <nav className="mobile-nav chrome">
        <NavButton label={t('history')} onClick={() => actions.setDrawer(drawer === 'left' ? null : 'left')}><History size={18} /></NavButton>
        <NavButton label={t('timer')} onClick={() => { actions.setView('timer'); actions.setDrawer(null); }}><Timer size={18} /></NavButton>
        <NavButton label={t('tools')} onClick={() => actions.setDrawer(drawer === 'right' ? null : 'right')}><Wrench size={18} /></NavButton>
        <NavButton label={t('stats')} onClick={() => { actions.setView('stats'); actions.setDrawer(null); }}><BarChart3 size={18} /></NavButton>
        <NavButton label={t('settings')} onClick={() => { actions.setView(view === 'settings' ? 'timer' : 'settings'); actions.setDrawer(null); }}><Settings size={18} /></NavButton>
      </nav>
      {drawer && <button className="fixed inset-0 z-20 bg-black/45 md:hidden" aria-label="Close panel" onClick={() => actions.setDrawer(null)} />}
      <Dialogs />
      <div className="toast-wrap">
        {toasts.map((toast) => <div key={toast.id} className="toast" style={{ borderColor: toast.tone === 'good' ? 'var(--good)' : toast.tone === 'bad' ? 'var(--bad)' : undefined }}>{toast.message}</div>)}
      </div>
    </>
  );
}

function NavButton({ children, label, onClick }) {
  return <button className="nav-btn flex flex-1 flex-col items-center gap-1 py-1 text-[10px] text-[var(--muted)]" onClick={onClick}>{children}{label}</button>;
}

function Sidebar() {
  const { settings, sessions, session, solves, stats, actions, view } = useStore();
  const t = (key) => translate(settings.general.language, key);
  const [picking, setPicking] = useState(false);
  const rows = useMemo(() => {
    let best = Infinity;
    const marked = solves.map((solve, index) => {
      const ms = effectiveMs(solve);
      const pb = ms != null && ms < best;
      if (pb) best = ms;
      return { solve, index, pb, ms };
    });
    return settings.stats.reverseList ? [...marked].reverse() : marked;
  }, [solves, settings.stats.reverseList]);
  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex items-center gap-3">
        <Logo />
        <div>
          <div className="text-lg font-semibold tracking-tight">Cubic</div>
          <div className="text-xs text-[var(--muted)]">1.0.0</div>
        </div>
      </div>
      <button className="text-btn primary mb-3 flex items-center justify-center gap-2" onClick={() => actions.setView(view === 'settings' ? 'timer' : 'settings')}><Settings size={16} /> {t('settings')}</button>
      <div className="relative mb-3">
        <button className="field flex w-full items-center justify-between text-left" onClick={() => setPicking((value) => !value)}>
          <span>{session?.name}</span>
          <span className="text-xs text-[var(--muted)]">{solves.length}</span>
        </button>
        {picking && (
          <div className="card absolute z-10 mt-2 w-full p-2">
            {sessions.map((item) => (
              <button key={item.id} className="menu-item block w-full px-2 py-2 text-left text-sm" onClick={() => { actions.selectSession(item.id); setPicking(false); }}>{item.name}</button>
            ))}
            <button className="menu-item w-full px-2 py-2 text-left text-sm text-[var(--accent)]" onClick={() => { setPicking(false); actions.setModal({ type: 'sessions' }); }}>{t('sessions')}</button>
          </div>
        )}
      </div>
      {settings.sessions.showSummary && <div className="mb-3 text-xs text-[var(--muted)]">Mean {stats.mean == null ? '—' : formatTime(stats.mean, 2)} · Best {stats.single ? formatTime(stats.single.ms, 2) : '—'}</div>}
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
        <span>{t('history')}</span>
        <span className="flex gap-2 normal-case tracking-normal">
          <button onClick={() => actions.setView('stats')}>{t('stats')}</button>
          <button onClick={() => actions.setView('virtual')}>{t('virtual')}</button>
        </span>
      </div>
      <div className="scroll-y min-h-0 flex-1">
        {rows.map(({ solve, index, pb, ms }) => (
          <button key={solve.id} className="solve-row w-full text-left" onClick={() => actions.setModal({ type: 'solve', id: solve.id })}>
            <span className="text-xs text-[var(--muted)]">{index + 1}</span>
            <span className="timer-digits" style={{ color: solve.penalty === 'dnf' ? 'var(--bad)' : solve.penalty === 'plus2' ? 'var(--warn)' : pb ? 'var(--good)' : 'inherit' }}>{solve.penalty === 'dnf' ? 'DNF' : formatTime(ms, settings.timer.precision)}</span>
            <span className="text-xs text-[var(--muted)]">{penaltyLabel(solve.penalty)}{pb ? ' PB' : ''}{solve.comment ? ' •' : ''}</span>
          </button>
        ))}
        {!rows.length && <p className="px-2 py-6 text-sm text-[var(--muted)]">No solves in this session yet.</p>}
      </div>
      <div className="mt-3 hidden gap-2 md:flex">
        <button className={`text-btn flex-1 ${view === 'features' ? 'glow-ring' : ''}`} onClick={() => actions.setView('features')}><Sparkles size={14} className="mr-1 inline" />{t('features')}</button>
      </div>
      <button className="nav-btn mt-3 items-center gap-2 text-sm text-[var(--muted)] md:hidden" onClick={() => actions.setDrawer(null)}><Menu size={16} /> Close</button>
    </div>
  );
}

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" aria-label="Cubic">
      <path d="M16 3 L28 9.2 L16 15.4 L4 9.2 Z" fill="#8B7CFF" />
      <path d="M16 15.4 L28 9.2 L28 20.8 L16 27 Z" fill="#45D6C5" />
      <path d="M16 15.4 L4 9.2 L4 20.8 L16 27 Z" fill="#6d62d8" />
    </svg>
  );
}

function Dialogs() {
  const { modal, actions, solves, session } = useStore();
  if (!modal) return null;
  if (modal.type === 'confirm') {
    return (
      <Modal title="Confirm" onClose={() => actions.setModal(null)}>
        <p className="mb-4 text-sm">{modal.message}</p>
        <div className="flex justify-end gap-2">
          <TextButton onClick={() => actions.setModal(null)}>Cancel</TextButton>
          <TextButton tone="primary" onClick={() => { actions.setModal(null); if (modal.run === 'clear-all') actions.clearAll();
            if (modal.run === 'delete-session') actions.deleteSession(session.id);
            if (modal.run === 'clear-session') actions.clearSession(session.id);
          }}>{modal.confirm || 'Continue'}</TextButton>
        </div>
      </Modal>
    );
  }
  if (modal.type === 'sessions') return <SessionDialog />;
  if (modal.type === 'scramble-input') return <ScrambleDialog />;
  if (modal.type === 'latest' || modal.type === 'latest-comment' || modal.type === 'solve') {
    const solve = modal.id ? solves.find((item) => item.id === modal.id) : solves[solves.length - 1];
    if (!solve) return <Modal title="Solve" onClose={() => actions.setModal(null)}><p className="text-sm text-[var(--muted)]">This session has no solves.</p></Modal>;
    return <SolveDialog solve={solve} focusComment={modal.type === 'latest-comment'} />;
  }
  return null;
}

function SolveDialog({ solve, focusComment }) {
  const { actions, settings } = useStore();
  const [time, setTime] = useState(solve.penalty === 'dnf' ? 'DNF' : (solve.time / 1000).toFixed(settings.timer.precision));
  const [comment, setComment] = useState(solve.comment || '');
  const saveTime = () => {
    const parsed = parseTypedTime(time, 'seconds');
    if (!parsed) { actions.toast('Could not read that time', 'bad'); return; }
    actions.updateSolve(solve.id, { time: parsed.time, penalty: parsed.penalty, comment });
    actions.toast('Solve updated', 'good');
  };
  return (
    <Modal title={`Solve ${formatTime(effectiveMs(solve), settings.timer.precision)}`} onClose={() => actions.setModal(null)}>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <label>Time <Field value={time} onChange={(event) => setTime(event.target.value)} /></label>
        <label>Comment <Field autoFocus={focusComment} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">{new Date(solve.date).toLocaleString()} · {solve.eventId}</p>
      <p className="scramble-text mt-3 text-sm">{solve.scramble}</p>
      {solve.reconstruction && <p className="mt-3 text-sm"><span className="text-[var(--muted)]">Reconstruction </span><span className="scramble-text">{solve.reconstruction}</span></p>}
      {!!solve.phases?.length && <p className="mt-2 text-sm text-[var(--muted)]">{solve.phases.map((phase) => `${phase.name}${phase.time != null ? ` ${formatTime(phase.time, 2)}` : ''}`).join(' · ')}</p>}
      {Array.isArray(solve.moves) && solve.moves.length > 0 && effectiveMs(solve) != null && (
        <p className="mt-2 text-sm">TPS {(solve.moves.length / (effectiveMs(solve) / 1000)).toFixed(2)} from {solve.moves.length} recorded turns</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <TextButton onClick={() => actions.setPenalty(solve.id, 'ok')}>OK</TextButton>
        <TextButton onClick={() => actions.setPenalty(solve.id, 'plus2')}>+2</TextButton>
        <TextButton onClick={() => actions.setPenalty(solve.id, 'dnf')}>DNF</TextButton>
        <TextButton onClick={() => navigator.clipboard.writeText(solve.scramble)}>Copy scramble</TextButton>
        <TextButton tone="primary" onClick={saveTime}>Save</TextButton>
        <TextButton onClick={() => { actions.deleteSolve(solve.id); actions.setModal(null); }}>Delete</TextButton>
      </div>
    </Modal>
  );
}

function ScrambleDialog() {
  const { actions, scramble } = useStore();
  const [text, setText] = useState(scramble);
  return (
    <Modal title="Scramble" onClose={() => actions.setModal(null)}>
      <textarea className="field scramble-text min-h-28" value={text} onChange={(event) => setText(event.target.value)} />
      <div className="mt-3 flex justify-end gap-2">
        <TextButton onClick={() => actions.setModal(null)}>Cancel</TextButton>
        <TextButton tone="primary" onClick={() => { actions.inputScramble(text); actions.setModal(null); }}>Use scramble</TextButton>
      </div>
    </Modal>
  );
}

function SessionDialog() {
  const { sessions, session, actions, settings } = useStore();
  const [name, setName] = useState('');
  const [splitAt, setSplitAt] = useState(1);
  const [mergeInto, setMergeInto] = useState(sessions.find((item) => item.id !== session.id)?.id || '');
  const ask = (message, run, confirm) => {
    if (!settings.general.confirmDestructive) {
      if (run === 'delete-session') actions.deleteSession(session.id);
      if (run === 'clear-session') actions.clearSession(session.id);
      return;
    }
    actions.setModal({ type: 'confirm', message, run, confirm });
  };
  return (
    <Modal title="Sessions" onClose={() => actions.setModal(null)}>
      <div className="space-y-4 text-sm">
        <div className="flex gap-2">
          <Field placeholder="New session name" value={name} onChange={(event) => setName(event.target.value)} />
          <TextButton tone="primary" onClick={() => { if (name.trim()) { actions.createSession(name.trim()); setName(''); } }}>Create</TextButton>
        </div>
        <label className="block">Rename current
          <Field className="mt-1" defaultValue={session.name} onBlur={(event) => actions.renameSession(session.id, event.target.value.trim() || session.name)} />
        </label>
        <div className="flex flex-wrap gap-2">
          {settings.sessions.allowClear && <TextButton onClick={() => ask('Clear every solve in this session?', 'clear-session', 'Clear')}>Clear</TextButton>}
          <TextButton onClick={() => ask(`Delete ${session.name}?`, 'delete-session', 'Delete')}>Delete</TextButton>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span>Split after solve</span>
          <Field className="w-24" type="number" min="1" max={Math.max(1, session.solves.length - 1)} value={splitAt} onChange={(event) => setSplitAt(Number(event.target.value))} />
          <TextButton onClick={() => actions.splitSession(session.id, splitAt)}>Split</TextButton>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span>Merge this session into</span>
          <select className="field w-auto" value={mergeInto} onChange={(event) => setMergeInto(event.target.value)}>
            {sessions.filter((item) => item.id !== session.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <TextButton onClick={() => mergeInto && actions.mergeSession(session.id, mergeInto)}>Merge</TextButton>
        </div>
      </div>
    </Modal>
  );
}

function useTheme(settings) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.appearance.theme;
    root.style.setProperty('--accent', settings.appearance.accent);
    root.style.setProperty('--accent-2', settings.appearance.accent2);
    root.style.setProperty('--glow', String(settings.appearance.glow));
    root.style.setProperty('--radius', `${settings.appearance.radius}px`);
    root.style.fontSize = `${16 * (settings.appearance.uiZoom || 1)}px`;
    document.body.classList.toggle('reduce-motion', settings.appearance.animations === false);
  }, [settings.appearance]);
}

function useShortcuts(store) {
  const { settings, actions, sessions, session, view } = store;
  useEffect(() => {
    if (!settings.shortcuts.enabled) return undefined;
    const onKey = (event) => {
      if (event.repeat) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
      if (event.code === 'Space') return;
      if (view === 'virtual' && !event.altKey && !event.ctrlKey && !event.metaKey) return;
      const parts = [];
      if (event.ctrlKey) parts.push('Ctrl');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');
      parts.push(event.code);
      const binding = parts.join('+');
      const action = Object.entries(settings.shortcuts.bindings).find(([, value]) => value === binding)?.[0];
      if (!action) return;
      event.preventDefault();
      if (action.startsWith('event-')) actions.setEvent(action.slice(6));
      if (action === 'next-scramble') actions.nextScramble();
      if (action === 'prev-scramble') actions.prevScramble();
      if (action === 'input-scramble') actions.setModal({ type: 'scramble-input' });
      if (action === 'delete-last') actions.deleteLast();
      if (action === 'penalty-ok') actions.penaltyLast('ok');
      if (action === 'penalty-plus2') actions.penaltyLast('plus2');
      if (action === 'penalty-dnf') actions.penaltyLast('dnf');
      if (action.startsWith('mode-')) actions.setSettings({ general: { timerMode: action.slice(5) } });
      if (action === 'prev-session' || action === 'next-session') {
        const index = sessions.findIndex((item) => item.id === session?.id);
        const step = action === 'next-session' ? 1 : -1;
        const next = sessions[(index + step + sessions.length) % sessions.length];
        if (next) actions.selectSession(next.id);
      }
      if (action === 'delete-session') {
        if (settings.general.confirmDestructive) actions.setModal({ type: 'confirm', message: `Delete ${session.name}?`, run: 'delete-session', confirm: 'Delete' });
        else actions.deleteSession(session.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings, actions, sessions, session, view]);
}
