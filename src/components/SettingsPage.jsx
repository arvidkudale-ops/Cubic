import { useEffect, useState } from 'react';
import { EVENTS } from '../data/events.js';
import { LANGUAGES } from '../i18n.js';
import { useStore } from '../state/Store.jsx';
import { DEFAULT_SHORTCUTS } from '../state/settings.js';
import { Field, Slider, Toggle } from './ui.jsx';

const CATEGORIES = [
  ['general', 'General'],
  ['timer', 'Timer'],
  ['inspection', 'Inspection'],
  ['scrambles', 'Scrambles'],
  ['appearance', 'Appearance'],
  ['sessions', 'Sessions'],
  ['statistics', 'Statistics'],
  ['shortcuts', 'Shortcuts'],
  ['tools', 'Tools'],
  ['virtual', 'Virtual cube'],
  ['bluetooth', 'Bluetooth'],
  ['stackmat', 'Stackmat'],
  ['data', 'Data'],
];

const MODES = [
  ['keyboard', 'Keyboard'],
  ['typing', 'Typing'],
  ['mouse', 'Mouse'],
  ['touch', 'Touch'],
  ['stackmat', 'Stackmat'],
  ['bluetooth', 'Bluetooth cube'],
  ['virtual', 'Virtual cube'],
  ['lastlayer', 'Last layer'],
  ['multiphase', 'Multi-phase'],
];

export function SettingsPage() {
  const [category, setCategory] = useState('general');
  return (
    <div className="flex min-h-0 flex-1">
      <nav className="scroll-y hidden w-52 shrink-0 border-r border-[var(--line)] p-3 md:block">
        {CATEGORIES.map(([id, label]) => (
          <button key={id} className={`menu-item mb-1 w-full px-3 py-2 text-left text-sm ${category === id ? 'glow-ring text-[var(--text)]' : ''}`} onClick={() => setCategory(id)}>{label}</button>
        ))}
      </nav>
      <div className="scroll-y min-w-0 flex-1 p-4 md:p-8">
        <select className="field mb-4 md:hidden" value={category} onChange={(event) => setCategory(event.target.value)}>
          {CATEGORIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        {category === 'general' && <General />}
        {category === 'timer' && <TimerSettings />}
        {category === 'inspection' && <InspectionSettings />}
        {category === 'scrambles' && <ScrambleSettings />}
        {category === 'appearance' && <AppearanceSettings />}
        {category === 'sessions' && <SessionSettings />}
        {category === 'statistics' && <StatsSettings />}
        {category === 'shortcuts' && <ShortcutSettings />}
        {category === 'tools' && <ToolSettings />}
        {category === 'virtual' && <VirtualSettings />}
        {category === 'bluetooth' && <BluetoothSettings />}
        {category === 'stackmat' && <StackmatSettings />}
        {category === 'data' && <DataSettings />}
      </div>
    </div>
  );
}

function General() {
  const { settings, actions, eventId } = useStore();
  const set = (patch) => actions.setSettings({ general: patch });
  return (
    <section className="max-w-xl space-y-1">
      <h2 className="mb-3 text-xl font-semibold">General</h2>
      <label className="block py-2 text-sm">Language
        <select className="field mt-1" value={settings.general.language} onChange={(event) => set({ language: event.target.value })}>
          {LANGUAGES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <p className="text-xs text-[var(--muted)]">Navigation labels follow the language. The rest of the interface stays in English.</p>
      <label className="block py-2 text-sm">Default event
        <select className="field mt-1" value={settings.general.defaultEvent} onChange={(event) => set({ defaultEvent: event.target.value })}>
          {EVENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="block py-2 text-sm">Timer mode
        <select className="field mt-1" value={settings.general.timerMode} onChange={(event) => set({ timerMode: event.target.value })}>
          {MODES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label className="block py-2 text-sm">Bare numbers in typing mode
        <select className="field mt-1" value={settings.general.integerUnit} onChange={(event) => set({ integerUnit: event.target.value })}>
          <option value="seconds">Seconds</option>
          <option value="centiseconds">Centiseconds</option>
          <option value="milliseconds">Milliseconds</option>
        </select>
      </label>
      <Toggle label="Create a session when the event changes" checked={settings.general.autoSessionOnEvent} onChange={(value) => set({ autoSessionOnEvent: value })} />
      <Toggle label="Ask before deleting or clearing" checked={settings.general.confirmDestructive} onChange={(value) => set({ confirmDestructive: value })} />
      <p className="pt-2 text-sm text-[var(--muted)]">Current event is {eventId}. The default event is used when all data is cleared.</p>
    </section>
  );
}

function TimerSettings() {
  const { settings, actions } = useStore();
  const set = (patch) => actions.setSettings({ timer: patch });
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Timer</h2>
      <Slider label="Hold to start" min={0} max={1500} step={50} value={settings.timer.holdMs} suffix=" ms" onChange={(value) => set({ holdMs: value })} />
      <label className="block py-2 text-sm">Precision
        <select className="field mt-1" value={settings.timer.precision} onChange={(event) => set({ precision: Number(event.target.value) })}>
          <option value={2}>Hundredths</option>
          <option value={3}>Milliseconds</option>
        </select>
      </label>
      <Toggle label="Smaller decimal digits" checked={settings.timer.smallerDecimals} onChange={(value) => set({ smallerDecimals: value })} />
      <Slider label="Timer size" min={0.6} max={1.6} step={0.05} value={settings.timer.fontScale} onChange={(value) => set({ fontScale: value })} />
      <Slider label="Zoom" min={0.8} max={1.4} step={0.05} value={settings.timer.zoom} onChange={(value) => set({ zoom: value })} />
      <label className="block py-2 text-sm">Timer color <input type="color" value={settings.timer.color} onChange={(event) => set({ color: event.target.value })} /></label>
      <label className="block py-2 text-sm">Ready color <input type="color" value={settings.timer.readyColor} onChange={(event) => set({ readyColor: event.target.value })} /></label>
      <Toggle label="Keyboard timing" checked={settings.timer.keyboard} onChange={(value) => set({ keyboard: value })} />
      <Toggle label="Mouse timing" checked={settings.timer.mouse} onChange={(value) => set({ mouse: value })} />
      <Toggle label="Touch timing" checked={settings.timer.touch} onChange={(value) => set({ touch: value })} />
      <Toggle label="Hide the interface while timing" checked={settings.timer.hideWhileTiming} onChange={(value) => set({ hideWhileTiming: value })} />
      <p className="text-sm text-[var(--muted)]">Space starts and stops. The clock reads performance.now() and paints on animation frames, so it does not add up a drifting counter. Release before the hold finishes and the start is cancelled. Multi-phase uses Space for splits and Enter to stop.</p>
    </section>
  );
}

function InspectionSettings() {
  const { settings, actions } = useStore();
  const set = (patch) => actions.setSettings({ inspection: patch });
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Inspection</h2>
      <Toggle label="Inspection" checked={settings.inspection.enabled} onChange={(value) => set({ enabled: value })} />
      <Slider label="Inspection length" min={5} max={30} value={settings.inspection.duration} suffix=" s" onChange={(value) => set({ duration: value })} />
      <Slider label="+2 after" min={8} max={30} value={settings.inspection.plus2After} suffix=" s" onChange={(value) => set({ plus2After: value })} />
      <Slider label="DNF after" min={10} max={40} value={settings.inspection.dnfAfter} suffix=" s" onChange={(value) => set({ dnfAfter: value })} />
      <Toggle label="Voice warnings" checked={settings.inspection.voice} onChange={(value) => set({ voice: value })} />
      <Toggle label="Warning at 8 seconds" checked={settings.inspection.voice8} onChange={(value) => set({ voice8: value })} />
      <Toggle label="Warning at 12 seconds" checked={settings.inspection.voice12} onChange={(value) => set({ voice12: value })} />
      <Slider label="Warning volume" min={0} max={1} step={0.05} value={settings.inspection.volume} onChange={(value) => set({ volume: value })} />
      <p className="text-sm text-[var(--muted)]">After the ready hold, inspection counts down. A second hold, then release, starts the solve. Going past the +2 or DNF mark is stored on that solve.</p>
    </section>
  );
}

function ScrambleSettings() {
  const { settings, actions } = useStore();
  const training = settings.scramble.training;
  const set = (patch) => actions.setSettings({ scramble: patch });
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Scrambles</h2>
      <Slider label="Scramble size" min={0.7} max={1.8} step={0.05} value={settings.scramble.fontScale} onChange={(value) => set({ fontScale: value })} />
      <label className="block py-2 text-sm">Alignment
        <select className="field mt-1" value={settings.scramble.align} onChange={(event) => set({ align: event.target.value })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
      <Slider label="Image size" min={120} max={320} step={10} value={settings.scramble.imageSize} suffix=" px" onChange={(value) => set({ imageSize: value })} />
      <Toggle label="Show scramble image on the timer" checked={settings.scramble.showImage} onChange={(value) => set({ showImage: value })} />
      <Toggle label="New scramble after each solve" checked={settings.scramble.autoGenerate} onChange={(value) => set({ autoGenerate: value })} />
      <Toggle label="Official random-state scrambles" checked={settings.scramble.useRandomState} onChange={(value) => set({ useRandomState: value })} />
      <Toggle label="Shorter 4×4 when random-state is off" checked={settings.scramble.fast444} onChange={(value) => set({ fast444: value })} />
      <label className="block py-2 text-sm">Clicking the scramble
        <select className="field mt-1" value={settings.scramble.clickAction} onChange={(event) => set({ clickAction: event.target.value })}>
          <option value="copy">Copy</option>
          <option value="next">Next scramble</option>
        </select>
      </label>
      <label className="block py-2 text-sm">Pre-moves, applied before the scramble
        <Field className="mt-1" value={settings.scramble.preMoves} onChange={(event) => set({ preMoves: event.target.value })} />
      </label>
      <label className="block py-2 text-sm">Multi-blind cubes
        <Field className="mt-1" type="number" min="2" max="50" value={settings.scramble.mbfCount} onChange={(event) => set({ mbfCount: Number(event.target.value) })} />
      </label>
      <label className="block py-2 text-sm">Training
        <select className="field mt-1" value={training.mode} onChange={(event) => set({ training: { ...training, mode: event.target.value } })}>
          {['off', 'cross', 'xcross', 'eoline', 'f2l', 'oll', 'pll', 'cmll', 'zbll'].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
        </select>
      </label>
      <p className="text-xs text-[var(--muted)]">F2L training is an FR-slot R/U drill, not the 41 official cases. CMLL uses corner-orientation algorithms and does not preserve Roux blocks. ZBLL is a corner OLL followed by a PLL. Case filters use the names from the algorithm list, separated by commas.</p>
      <Field placeholder="Aa, T, Ua" value={training.cases.join(', ')} onChange={(event) => set({ training: { ...training, cases: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) } })} />
      <Toggle label="Color neutral yaws on OLL, PLL, and CMLL" checked={training.colorNeutral} onChange={(value) => set({ training: { ...training, colorNeutral: value } })} />
    </section>
  );
}

function AppearanceSettings() {
  const { settings, actions } = useStore();
  const set = (patch) => actions.setSettings({ appearance: patch });
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Appearance</h2>
      <label className="block py-2 text-sm">Theme
        <select className="field mt-1" value={settings.appearance.theme} onChange={(event) => set({ theme: event.target.value })}>
          <option value="dark">Dark</option>
          <option value="midnight">Midnight</option>
          <option value="light">Light</option>
          <option value="contrast">Contrast</option>
        </select>
      </label>
      <label className="block py-2 text-sm">Accent <input type="color" value={settings.appearance.accent} onChange={(event) => set({ accent: event.target.value })} /></label>
      <label className="block py-2 text-sm">Second accent <input type="color" value={settings.appearance.accent2} onChange={(event) => set({ accent2: event.target.value })} /></label>
      <Slider label="Glow" min={0} max={1.4} step={0.05} value={settings.appearance.glow} onChange={(value) => set({ glow: value })} />
      <Slider label="Corner radius" min={8} max={32} value={settings.appearance.radius} suffix=" px" onChange={(value) => set({ radius: value })} />
      <Slider label="Interface zoom" min={0.85} max={1.25} step={0.05} value={settings.appearance.uiZoom} onChange={(value) => set({ uiZoom: value })} />
      <Slider label="Background image opacity" min={0} max={1} step={0.05} value={settings.appearance.backgroundOpacity} onChange={(value) => set({ backgroundOpacity: value })} />
      <label className="block py-2 text-sm">Background image URL
        <Field className="mt-1" value={settings.appearance.background} placeholder="https://" onChange={(event) => set({ background: event.target.value })} />
      </label>
      <Toggle label="Animations" checked={settings.appearance.animations} onChange={(value) => set({ animations: value })} />
    </section>
  );
}

function SessionSettings() {
  const { settings, actions } = useStore();
  const set = (patch) => actions.setSettings({ sessions: patch });
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Sessions</h2>
      <Toggle label="Show the session mean in the sidebar" checked={settings.sessions.showSummary} onChange={(value) => set({ showSummary: value })} />
      <Toggle label="Allow clearing a session" checked={settings.sessions.allowClear} onChange={(value) => set({ allowClear: value })} />
      <p className="text-sm text-[var(--muted)]">Create, rename, delete, clear, split, and merge sessions from the session button in the sidebar. Each session keeps its own solves.</p>
    </section>
  );
}

function StatsSettings() {
  const { settings, actions } = useStore();
  const indicators = settings.stats.indicators;
  const toggle = (id) => {
    const next = indicators.includes(id) ? indicators.filter((item) => item !== id) : [...indicators, id];
    actions.setSettings({ stats: { indicators: next } });
  };
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Statistics</h2>
      {['single', 'ao5', 'ao12', 'best', 'bestAo5'].map((id) => (
        <Toggle key={id} label={id} checked={indicators.includes(id)} onChange={() => toggle(id)} />
      ))}
      <Toggle label="Show time-to-beat" checked={settings.stats.showTarget} onChange={(value) => actions.setSettings({ stats: { showTarget: value } })} />
      <Toggle label="Newest solve at the top" checked={settings.stats.reverseList} onChange={(value) => actions.setSettings({ stats: { reverseList: value } })} />
      <Slider label="Distribution bin" min={0.2} max={5} step={0.2} value={settings.stats.distBin} suffix=" s" onChange={(value) => actions.setSettings({ stats: { distBin: value } })} />
      <label className="block py-2 text-sm">Custom average length
        <Field className="mt-1" type="number" min={5} max={1000} value={settings.stats.customAo} onChange={(event) => actions.setSettings({ stats: { customAo: Number(event.target.value) } })} />
      </label>
    </section>
  );
}

const SHORTCUT_LABELS = {
  'event-sq1': 'Square-1',
  'event-222': '2×2',
  'event-333': '3×3',
  'event-444': '4×4',
  'event-555': '5×5',
  'event-666': '6×6',
  'event-777': '7×7',
  'event-pyram': 'Pyraminx',
  'event-minx': 'Megaminx',
  'event-clock': 'Clock',
  'event-skewb': 'Skewb',
  'input-scramble': 'Enter scramble',
  'delete-session': 'Delete session',
  'delete-last': 'Delete latest solve',
  'prev-session': 'Previous session',
  'next-session': 'Next session',
  'prev-scramble': 'Previous scramble',
  'next-scramble': 'Next scramble',
  'penalty-ok': 'Latest solve OK',
  'penalty-plus2': 'Latest solve +2',
  'penalty-dnf': 'Latest solve DNF',
  'mode-keyboard': 'Keyboard mode',
  'mode-typing': 'Typing mode',
  'mode-stackmat': 'Stackmat mode',
  'mode-virtual': 'Virtual cube mode',
  'mode-bluetooth': 'Bluetooth mode',
  'mode-lastlayer': 'Last layer mode',
  'mode-multiphase': 'Multi-phase mode',
};

function ShortcutSettings() {
  const { settings, actions } = useStore();
  const [recording, setRecording] = useState(null);
  useEffect(() => {
    if (!recording) return undefined;
    const onKey = (event) => {
      event.preventDefault();
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
      if (event.code === 'Space') {
        actions.toast('Space stays reserved for the timer');
        return;
      }
      const parts = [];
      if (event.ctrlKey) parts.push('Ctrl');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');
      parts.push(event.code);
      actions.setSettings({ shortcuts: { bindings: { ...settings.shortcuts.bindings, [recording]: parts.join('+') } } });
      setRecording(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [recording, settings.shortcuts.bindings, actions]);
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Shortcuts</h2>
      <Toggle label="Shortcuts" checked={settings.shortcuts.enabled} onChange={(value) => actions.setSettings({ shortcuts: { enabled: value } })} />
      <div className="mt-3 space-y-2">
        {Object.keys(DEFAULT_SHORTCUTS).map((id) => (
          <div key={id} className="flex items-center justify-between gap-3 text-sm">
            <span>{SHORTCUT_LABELS[id] || id}</span>
            <button className="field w-auto" onClick={() => setRecording(id)}>{recording === id ? 'Press keys' : pretty(settings.shortcuts.bindings[id] || '')}</button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">Gestures on the timer: up +2, up-left DNF, up-right OK, left and right change scramble, down deletes the latest solve.</p>
    </section>
  );
}

function pretty(binding) {
  return binding.replaceAll('Digit', '').replaceAll('Key', '').replaceAll('Arrow', '');
}

function ToolSettings() {
  const { actions } = useStore();
  return (
    <section className="max-w-xl text-sm">
      <h2 className="mb-3 text-xl font-semibold">Tools</h2>
      <p className="text-[var(--muted)]">Up to four tools stay open in the right panel. Solvers that cannot find a sequence say so. Pyraminx and Skewb run a full puzzle solution, not a partial V or a single face.</p>
      <button className="text-btn mt-3" onClick={() => actions.setTools(['draw', 'stats'])}>Reset tools</button>
    </section>
  );
}

function VirtualSettings() {
  const { settings, actions } = useStore();
  return (
    <section className="max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Virtual cube</h2>
      <Slider label="Turn animation" min={40} max={400} step={10} value={settings.virtual.turnMs} suffix=" ms" onChange={(value) => actions.setSettings({ virtual: { turnMs: value } })} />
      <Toggle label="Record cross, F2L, and last-layer splits" checked={settings.virtual.multiPhase} onChange={(value) => actions.setSettings({ virtual: { multiPhase: value } })} />
      <p className="text-sm text-[var(--muted)]">The cube is a 3×3 sticker model. Turns update that model, and a solved cube stops the virtual timer. TPS is calculated from the recorded turns.</p>
    </section>
  );
}

function BluetoothSettings() {
  const { settings, actions } = useStore();
  const set = (patch) => actions.setSettings({ bluetooth: patch });
  return (
    <section className="max-w-xl text-sm">
      <h2 className="mb-3 text-xl font-semibold">Bluetooth cube</h2>
      <label className="block py-2">Start timing
        <select className="field mt-1" value={settings.bluetooth.markScrambled} onChange={(event) => set({ markScrambled: event.target.value })}>
          <option value="space">After Mark scrambled</option>
          <option value="first-move">On the first move</option>
        </select>
      </label>
      <Toggle label="Beep when the cube is marked scrambled" checked={settings.bluetooth.beepOnScramble} onChange={(value) => set({ beepOnScramble: value })} />
      <p className="text-[var(--muted)]">Connection status comes from the browser prompt and later disconnect events. Battery is shown only when the cube reports it. Reconstruction assumes the software cube started solved.</p>
    </section>
  );
}

function StackmatSettings() {
  return (
    <section className="max-w-xl text-sm text-[var(--muted)]">
      <h2 className="mb-3 text-xl font-semibold text-[var(--text)]">Stackmat</h2>
      <p>Open the Stackmat tool and allow microphone access. The timer mode switches to Stackmat when a signal is being decoded. A time is stored only after a packet with a valid checksum changes to stopped. The display stays disconnected until that happens. Signal level is the microphone amplitude, not a Stackmat battery reading.</p>
    </section>
  );
}

function DataSettings() {
  const { settings, actions } = useStore();
  const [mode, setMode] = useState('replace');
  const [backups, setBackups] = useState([]);
  const refresh = () => actions.backups().then(setBackups);
  useEffect(() => { refresh(); }, []);
  return (
    <section className="max-w-xl space-y-3 text-sm">
      <h2 className="text-xl font-semibold">Data</h2>
      <p className="text-[var(--muted)]">Solves, sessions, and settings are stored in IndexedDB on this device. There is no account and no cloud copy.</p>
      <div className="flex flex-wrap gap-2">
        <button className="text-btn primary" onClick={actions.exportData}>Export JSON</button>
        <button className="text-btn" onClick={actions.exportSessionCsv}>Export session CSV</button>
        <button className="text-btn" onClick={async () => { await actions.backupNow(); refresh(); }}>Backup now</button>
      </div>
      <label className="block">Import mode
        <select className="field mt-1" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="replace">Replace</option>
          <option value="merge">Merge sessions</option>
        </select>
      </label>
      <input className="text-sm" type="file" accept="application/json" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try { await actions.importData(file, mode); } catch (error) { actions.toast(error.message, 'bad'); }
      }} />
      <Slider label="Automatic local backup every" min={0} max={500} step={10} value={settings.data.autoBackupEvery} suffix=" solves" onChange={(value) => actions.setSettings({ data: { autoBackupEvery: value } })} />
      <div className="space-y-2">
        {backups.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-3 py-2">
            <span>{new Date(entry.savedAt).toLocaleString()}</span>
            <button className="text-btn" onClick={() => actions.restoreBackup(entry)}>Restore</button>
          </div>
        ))}
        {!backups.length && <p className="text-[var(--muted)]">No local backups yet.</p>}
      </div>
      <button className="text-btn" onClick={() => actions.setModal({ type: 'confirm', message: 'Clear every session, solve, and setting on this device?', run: 'clear-all' })}>Clear all data</button>
    </section>
  );
}
