import { useEffect, useMemo, useRef, useState } from 'react';
import * as icons from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EVENTS, TOOL_CATALOG } from '../data/events.js';
import { requestSolve } from '../engine/solverClient.js';
import { formatTime } from '../engine/time.js';
import { groupByDay, histogram, rollingSeries, summarize } from '../engine/stats.js';
import { seededScramble } from '../services/scrambleApi.js';
import { createMetronome } from '../services/audio.js';
import { bluetoothAvailable, connectBluetoothTimer, connectCube, emitCubeMove } from '../services/bluetooth.js';
import { describeStackmatStatus, emitStackmat, openStackmat } from '../services/stackmat.js';
import { applyAlg, isSolved, newCube, phaseOf } from '../engine/cube.js';
import { useStore } from '../state/Store.jsx';
import { ScramblePreview } from './TimerScreen.jsx';
import { Empty, Field, TextButton } from './ui.jsx';

const metronome = createMetronome();

export function ToolsPanel() {
  const { settings, actions } = useStore();
  const slots = settings.tools.slots || [];
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const available = TOOL_CATALOG.filter((tool) => tool.name.toLowerCase().includes(query.toLowerCase()) && !slots.includes(tool.id));
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide">Tools</h2>
        <TextButton onClick={() => setAdding((value) => !value)}>{adding ? 'Done' : 'Add'}</TextButton>
      </div>
      {adding && (
        <div className="card p-3">
          <Field placeholder="Search tools" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-2 max-h-56 space-y-1 overflow-auto">
            {available.map((tool) => (
              <button key={tool.id} className="menu-item flex w-full items-center justify-between px-2 py-2 text-left text-sm" onClick={() => { if (slots.length >= 4) { actions.toast('Four tools can be open at once'); return; } actions.setTools([...slots, tool.id]); }}>
                <span>{tool.name}</span><span className="text-xs text-[var(--muted)]">{tool.category}</span>
              </button>
            ))}
            {!available.length && <Empty>No matching tools.</Empty>}
          </div>
        </div>
      )}
      <div className="scroll-y flex min-h-0 flex-1 flex-col gap-3">
        {slots.map((id) => <ToolCard key={id} id={id} onClose={() => actions.setTools(slots.filter((item) => item !== id))} />)}
        {!slots.length && <Empty>Add a tool to keep scramble art, statistics, or a solver beside the timer.</Empty>}
      </div>
    </div>
  );
}

function ToolCard({ id, onClose }) {
  const meta = TOOL_CATALOG.find((tool) => tool.id === id);
  const Icon = icons[meta?.icon] || icons.Box;
  const [open, setOpen] = useState(true);
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-2 px-3 py-2">
        <Icon size={16} className="text-[var(--accent)]" />
        <h3 className="flex-1 text-sm font-medium">{meta?.name || id}</h3>
        <button className="text-xs text-[var(--muted)]" onClick={() => setOpen((value) => !value)}>{open ? 'Hide' : 'Show'}</button>
        <button className="text-xs text-[var(--muted)]" onClick={onClose}>Close</button>
      </header>
      {open && <div className="border-t border-[var(--line)] p-3"><ToolBody id={id} /></div>}
    </section>
  );
}

function ToolBody({ id }) {
  if (id === 'draw') return <DrawTool />;
  if (id === 'generator') return <GeneratorTool />;
  if (id === 'common') return <CommonTool />;
  if (id === 'stats') return <MiniStats />;
  if (id === 'crossSession') return <CrossSession />;
  if (id === 'trend') return <Trend />;
  if (id === 'distribution') return <Distribution />;
  if (id === 'daily') return <Daily />;
  if (id === 'confirm') return <Confirm />;
  if (['cross', 'xcross', 'block', 'roux', 'roux2', 'eoline', 'zz', 'f2l', 'petrus', 'sq1'].includes(id)) return <SolverTool kind={id} />;
  if (id === 'pyram' || id === 'skewb') return <PuzzleSolver kind={id} />;
  if (id === 'metronome') return <MetronomeTool />;
  if (id === 'stackmat') return <StackmatTool />;
  if (id === 'bluetooth') return <BluetoothTool />;
  return <Empty>This tool is not available.</Empty>;
}

function DrawTool() {
  const { scramble, eventId, settings } = useStore();
  return <ScramblePreview scramble={scramble} eventId={eventId} size={settings.scramble.imageSize} />;
}

function GeneratorTool() {
  const { eventId } = useStore();
  const [count, setCount] = useState(12);
  const [event, setEvent] = useState(eventId);
  const [lines, setLines] = useState([]);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex gap-2">
        <select className="field" value={event} onChange={(e) => setEvent(e.target.value)}>{EVENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        <Field type="number" min="1" max="100" value={count} onChange={(e) => setCount(Number(e.target.value))} />
      </div>
      <TextButton tone="primary" onClick={async () => {
        const { createScramble } = await import('../services/scrambleApi.js');
        const next = [];
        for (let i = 0; i < Math.min(100, Math.max(1, count)); i += 1) next.push((await createScramble(event, { scramble: { useRandomState: true } })).scramble);
        setLines(next);
      }}>Generate</TextButton>
      <div className="max-h-48 space-y-1 overflow-auto">
        {lines.map((line, index) => <button key={index} className="scramble-text block w-full rounded-xl px-2 py-1 text-left text-xs hover:bg-white/5" onClick={() => navigator.clipboard.writeText(line)}>{index + 1}. {line}</button>)}
      </div>
      {!!lines.length && <TextButton onClick={() => navigator.clipboard.writeText(lines.join('\n'))}>Copy all</TextButton>}
    </div>
  );
}

function CommonTool() {
  const { eventId } = useStore();
  const [seed, setSeed] = useState('weekly');
  const [count, setCount] = useState(5);
  const lines = useMemo(() => seededScramble(eventId, seed, count), [eventId, seed, count]);
  return (
    <div className="space-y-2 text-sm">
      <p className="text-[var(--muted)]">Same seed and event always produce the same random-move sequence. Official random-state scrambles are not seedable.</p>
      <Field value={seed} onChange={(e) => setSeed(e.target.value)} />
      <Field type="number" min="1" max="50" value={count} onChange={(e) => setCount(Number(e.target.value))} />
      {lines.map((line, index) => <div key={index} className="scramble-text text-xs">{index + 1}. {line}</div>)}
      <TextButton onClick={() => navigator.clipboard.writeText(`${seed}\n${lines.join('\n')}`)}>Copy seed and scrambles</TextButton>
    </div>
  );
}

function MiniStats() {
  const { stats, solves } = useStore();
  return <StatList stats={stats} solves={solves} />;
}

export function StatList({ stats, solves }) {
  const rows = [
    ['Solves', solves.length],
    ['Mean', fmt(stats.mean)],
    ['Single', fmt(stats.current)],
    ['Best', fmt(stats.single?.ms)],
    ['Ao5', fmt(stats.ao5)],
    ['Ao12', fmt(stats.ao12)],
    ['Mo3', fmt(stats.mo3)],
    ['Best Ao5', fmt(stats.bestAo5?.ms)],
    ['Best Ao12', fmt(stats.bestAo12?.ms)],
    ['Ao100', fmt(stats.aoN)],
    ['σ', fmt(stats.sd)],
    ['DNF', stats.count.dnf],
    ['+2', stats.count.plus2],
  ];
  return <div className="grid grid-cols-2 gap-2 text-sm">{rows.map(([label, value]) => <div key={label}><div className="text-[var(--muted)]">{label}</div><div className="timer-digits">{value ?? '—'}</div></div>)}</div>;
}

function fmt(value) {
  if (value == null) return '—';
  if (typeof value === 'number') return formatTime(value, 2);
  if (value.dnf) return 'DNF';
  if (value.ms != null) return formatTime(value.ms, 2);
  return '—';
}

function CrossSession() {
  const { sessions } = useStore();
  const [picked, setPicked] = useState(sessions.slice(0, 2).map((session) => session.id));
  const toggle = (id) => setPicked((list) => list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  return (
    <div className="space-y-2 text-sm">
      {sessions.map((session) => <label key={session.id} className="flex items-center gap-2"><input type="checkbox" checked={picked.includes(session.id)} onChange={() => toggle(session.id)} />{session.name}</label>)}
      {sessions.filter((session) => picked.includes(session.id)).map((session) => {
        const stats = summarize(session.solves);
        return <div key={session.id} className="rounded-xl border border-[var(--line)] p-2"><div className="mb-1 font-medium">{session.name}</div><StatList stats={stats} solves={session.solves} /></div>;
      })}
    </div>
  );
}

function Trend() {
  const { solves } = useStore();
  const ao12 = rollingSeries(solves, 12, 1);
  const data = rollingSeries(solves, 5, 1).map((point, index) => ({
    index: point.index,
    time: point.time,
    ao5: point.avg,
    ao12: ao12[index]?.avg,
  }));
  if (solves.length < 2) return <Empty>Need at least two solves.</Empty>;
  return <Chart data={data} lines={[['time', 'var(--accent)'], ['ao5', 'var(--accent-2)'], ['ao12', 'var(--warn)']]} />;
}

function Distribution() {
  const { solves, settings, actions } = useStore();
  const data = histogram(solves, settings.stats.distBin);
  if (!data.length) return <Empty>No successful solves yet.</Empty>;
  return (
    <div>
      <label className="text-xs text-[var(--muted)]">Bin {settings.stats.distBin}s
        <input className="ml-2" type="range" min="0.2" max="5" step="0.2" value={settings.stats.distBin} onChange={(event) => actions.setSettings({ stats: { distBin: Number(event.target.value) } })} />
      </label>
      <div className="h-40">
        <ResponsiveContainer>
          <BarChart data={data}><CartesianGrid stroke="rgba(255,255,255,.06)" /><XAxis dataKey="label" stroke="#9299A8" /><YAxis stroke="#9299A8" allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="var(--accent)" radius={6} /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Daily() {
  const { solves } = useStore();
  const data = groupByDay(solves);
  if (!data.length) return <Empty>No solves in this session.</Empty>;
  return <div className="h-40"><ResponsiveContainer><BarChart data={data}><XAxis dataKey="date" hide /><YAxis allowDecimals={false} stroke="#9299A8" /><Tooltip /><Bar dataKey="count" fill="var(--accent-2)" radius={6} /></BarChart></ResponsiveContainer></div>;
}

function Chart({ data, lines }) {
  return (
    <div className="h-44">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" />
          <XAxis dataKey="index" stroke="#9299A8" />
          <YAxis stroke="#9299A8" tickFormatter={(value) => value ? (value / 1000).toFixed(1) : ''} />
          <Tooltip formatter={(value) => value ? formatTime(value, 2) : '—'} />
          {lines.map(([key, color]) => <Line key={key} type="monotone" dataKey={key} stroke={color} dot={false} connectNulls strokeWidth={2} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Confirm() {
  const { solves, actions } = useStore();
  const recent = [...solves].slice(-8).reverse();
  if (!recent.length) return <Empty>No solves to confirm.</Empty>;
  return (
    <div className="space-y-2">
      {recent.map((solve, index) => (
        <div key={solve.id} className="rounded-xl border border-[var(--line)] p-2 text-sm">
          <div className="flex items-center justify-between"><b>{formatTime(solve.penalty === 'dnf' ? null : solve.time + (solve.penalty === 'plus2' ? 2000 : 0))}</b><span className="text-[var(--muted)]">{solve.penalty === 'plus2' ? '+2' : solve.penalty === 'dnf' ? 'DNF' : 'OK'}</span></div>
          <div className="mt-2 flex gap-1">
            <TextButton onClick={() => actions.setPenalty(solve.id, 'ok')}>OK</TextButton>
            <TextButton onClick={() => actions.setPenalty(solve.id, 'plus2')}>+2</TextButton>
            <TextButton onClick={() => actions.setPenalty(solve.id, 'dnf')}>DNF</TextButton>
            <TextButton onClick={() => navigator.clipboard.writeText(solve.scramble)}>Copy</TextButton>
          </div>
          <Field className="mt-2" placeholder="Comment" defaultValue={solve.comment} onBlur={(event) => actions.updateSolve(solve.id, { comment: event.target.value })} />
          {index === 0 && <div className="scramble-text mt-2 text-xs text-[var(--muted)]">{solve.scramble}</div>}
        </div>
      ))}
    </div>
  );
}

const SOLVER_NOTES = {
  cross: 'Optimal search for the four cross edges on D.',
  xcross: 'Searches for cross plus one F2L pair. Deep cases can hit the node limit.',
  block: 'Builds a 2×2×2 block on DBL.',
  roux: 'Builds the left 1×2×3 Roux block in stages.',
  roux2: 'Builds the left block, then the right block.',
  eoline: 'Orients all edges, then places DF and DB with EO-safe moves.',
  zz: 'EOLine, then a staged cross and F2L. Later stages can stop early.',
  f2l: 'Solves the cross, then each F2L pair. A pair can remain unsolved if the search limit is reached.',
  petrus: 'Builds a 2×2×2 block, then extends it toward a 2×2×3.',
  sq1: 'Inverts the Square-1 scramble, which restores shape and pieces. It is not a shortest-solution search.',
};

function SolverTool({ kind }) {
  const { scramble, eventId } = useStore();
  const [result, setResult] = useState(null);
  const [shown, setShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [color, setColor] = useState('U');
  const [pair, setPair] = useState('FR');
  const cubeEvent = eventId.startsWith('333') || eventId === '222';
  const run = async () => {
    if (kind !== 'sq1' && !cubeEvent) {
      setResult({ status: 'unsolved', text: 'This solver reads 3×3 move notation. Switch to a 3×3 event or paste a 3×3 scramble.' });
      return;
    }
    if (kind === 'sq1' && eventId !== 'sq1') {
      setResult({ status: 'unsolved', text: 'Switch the event to Square-1. This tool inverts Square-1 notation and does not search for a shortest solution.' });
      return;
    }
    const opposite = { U: 'D', D: 'U', F: 'B', B: 'F', R: 'L', L: 'R' };
    setBusy(true);
    const response = await requestSolve(kind, scramble, { color, target: opposite[color], pair, side: 'L' });
    setBusy(false);
    setShown(response.described?.moves?.length || 0);
    setResult(response.error ? { status: 'unsolved', text: response.error } : response.described);
  };
  const moves = result?.moves || [];
  return (
    <div className="space-y-2 text-sm">
      <p className="text-[var(--muted)]">{SOLVER_NOTES[kind]}</p>
      {kind === 'cross' && <select className="field" value={color} onChange={(event) => setColor(event.target.value)}>{['U', 'D', 'F', 'B', 'R', 'L'].map((face) => <option key={face}>{face}</option>)}</select>}
      {kind === 'xcross' && <select className="field" value={pair} onChange={(event) => setPair(event.target.value)}>{['FR', 'FL', 'BR', 'BL'].map((slot) => <option key={slot}>{slot}</option>)}</select>}
      <TextButton tone="primary" onClick={run} disabled={busy}>{busy ? 'Searching…' : 'Solve'}</TextButton>
      {result && <div className={result.status === 'unsolved' ? 'text-[var(--bad)]' : result.partial ? 'text-[var(--warn)]' : 'text-[var(--good)]'}>{result.text}</div>}
      {!!moves.length && (
        <>
          <input type="range" min="0" max={moves.length} value={shown} onChange={(event) => setShown(Number(event.target.value))} className="w-full" />
          <div className="scramble-text text-base">{moves.slice(0, shown).join(' ') || 'Reveal the first move'}</div>
          <div className="flex gap-2">
            <TextButton onClick={() => setShown(moves.length)}>Show all · {moves.length}</TextButton>
            <TextButton onClick={() => navigator.clipboard.writeText(moves.join(' '))}>Copy</TextButton>
          </div>
        </>
      )}
    </div>
  );
}

function PuzzleSolver({ kind }) {
  const { scramble, actions } = useStore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setText('');
    try {
      const { Alg } = await import('cubing/alg');
      const puzzles = await import('cubing/puzzles');
      const search = await import('cubing/search');
      const loader = kind === 'pyram' ? puzzles.pyraminx : puzzles.skewb;
      const kpuzzle = await loader.kpuzzle();
      const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble.replaceAll('\n', ' ')));
      const solution = kind === 'pyram' ? await search.solvePyraminx(pattern) : await search.solveSkewb(pattern);
      setText(solution.toString());
    } catch (error) {
      setText(error.message || 'The solver could not read this scramble.');
      actions.toast('Solver did not finish', 'bad');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2 text-sm">
      <p className="text-[var(--muted)]">{kind === 'pyram' ? 'Solves the full Pyraminx from the current scramble, which includes the V and the rest of the last layer. It does not stop at the V by itself.' : 'Solves the full Skewb, so every face — including the one you are practicing — is included.'}</p>
      <TextButton tone="primary" onClick={run} disabled={busy}>{busy ? 'Solving…' : 'Solve'}</TextButton>
      {text && <div className="scramble-text">{text}</div>}
    </div>
  );
}

function MetronomeTool() {
  const [bpm, setBpm] = useState(120);
  const [frequency, setFrequency] = useState(880);
  const [elapsed, setElapsed] = useState(0);
  const [on, setOn] = useState(false);
  useEffect(() => () => metronome.stop(), []);
  return (
    <div className="space-y-2 text-sm">
      <label className="block text-[var(--muted)]">BPM {bpm}<input className="w-full" type="range" min="40" max="240" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /></label>
      <label className="block text-[var(--muted)]">Frequency {frequency} Hz<input className="w-full" type="range" min="220" max="1600" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} /></label>
      <label className="block text-[var(--muted)]">Beep at elapsed seconds<input className="field" type="number" min="0" step="0.1" value={elapsed} onChange={(event) => setElapsed(Number(event.target.value))} /></label>
      <TextButton tone="primary" onClick={() => { if (on) { metronome.stop(); setOn(false); } else { metronome.start({ bpm, frequency, elapsedMs: elapsed * 1000, onElapsed: () => {} }); setOn(true); } }}>{on ? 'Stop' : 'Start'}</TextButton>
    </div>
  );
}

function StackmatTool() {
  const [status, setStatus] = useState('Disconnected');
  const [level, setLevel] = useState(0);
  const [packet, setPacket] = useState(null);
  const [error, setError] = useState('');
  const link = useRef(null);
  const connect = async () => {
    setError('');
    try {
      link.current = await openStackmat((next) => { setPacket(next); setStatus(`Packet · ${describeStackmatStatus(next.status)}`); emitStackmat(next); }, setLevel);
      setStatus('Microphone open — waiting for a valid packet');
    } catch (err) {
      setError(err.message);
      setStatus('Disconnected');
    }
  };
  useEffect(() => () => link.current?.close(), []);
  return (
    <div className="space-y-2 text-sm">
      <p className="text-[var(--muted)]">Plug the Stackmat into the microphone jack. Cubic only reports a connection after a valid checksum packet arrives. Power level is not part of the audio protocol.</p>
      <div>Status: {status}</div>
      <div>Signal: {(level * 100).toFixed(1)}%</div>
      <div>Left: {packet?.hands.left ? 'down' : 'up'} · Right: {packet?.hands.right ? 'down' : 'up'}</div>
      <div className="timer-digits text-2xl">{packet ? formatTime(packet.ms, packet.generation === 4 ? 3 : 2) : '—'}</div>
      {error && <div className="text-[var(--bad)]">{error}</div>}
      <TextButton tone="primary" onClick={connect}>Listen</TextButton>
    </div>
  );
}

function BluetoothTool() {
  const { settings, actions } = useStore();
  const [info, setInfo] = useState('Not connected');
  const [battery, setBattery] = useState(null);
  const [moves, setMoves] = useState([]);
  const [error, setError] = useState('');
  const puzzleRef = useRef(null);
  const armed = useRef(false);
  const stateRef = useRef(newCube());
  const movesRef = useRef([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const connect = async () => {
    setError('');
    try {
      const { puzzle, battery: level, name } = await connectCube();
      puzzleRef.current = puzzle;
      setBattery(level);
      setInfo(name || 'Connected');
      actions.setSettings({ general: { timerMode: 'bluetooth' } });
      try {
        const pattern = await puzzle.getPattern?.();
        if (pattern) setInfo(`${name} · state received`);
      } catch { /* pattern is optional */ }
      puzzle.addAlgLeafListener((event) => {
        const move = event.latestAlgLeaf?.toString?.() || String(event.latestAlgLeaf || '');
        if (!move || move === 'undefined') return;
        movesRef.current = [...movesRef.current.slice(-80), move];
        setMoves(movesRef.current);
        try { stateRef.current = applyAlg(stateRef.current, move); } catch { return; }
        const phases = phaseOf(stateRef.current);
        if (!armed.current && settingsRef.current.bluetooth.markScrambled !== 'first-move') return;
        if (!armed.current) {
          armed.current = true;
          movesRef.current = [move];
          emitCubeMove({ type: 'start' });
        }
        emitCubeMove({ type: 'move', move, phases });
        if (isSolved(stateRef.current)) {
          emitCubeMove({
            type: 'solved',
            reconstruction: movesRef.current.join(' '),
            moves: movesRef.current.map((name) => ({ move: name, time: null })),
            phases: phaseSnapshot(stateRef.current),
          });
          armed.current = false;
          stateRef.current = newCube();
          movesRef.current = [];
        }
      });
      puzzle.addEventListener?.('disconnect', () => { setInfo('Disconnected'); puzzleRef.current = null; });
    } catch (err) {
      setError(err.message || 'The cube did not connect.');
      setInfo('Not connected');
    }
  };
  return (
    <div className="space-y-2 text-sm">
      <p className="text-[var(--muted)]">{bluetoothAvailable() ? 'Uses the browser Bluetooth prompt. Gan, Giiker, GoCube, QiYi and similar cubes are supported only when cubing.js recognizes them.' : 'Web Bluetooth is unavailable in this browser.'}</p>
      <div>Status: {info}</div>
      <div>Battery: {battery == null ? 'Not reported by this cube' : `${battery}%`}</div>
      <div className="scramble-text min-h-8 text-xs">{moves.join(' ') || 'Moves appear here after a turn.'}</div>
      <div className="text-xs text-[var(--muted)]">Solved check uses the moves received this connection. If the cube was not solved when you connected, reset it before trusting reconstruction.</div>
      {error && <div className="text-[var(--bad)]">{error}</div>}
      <div className="flex gap-2">
        <TextButton tone="primary" onClick={connect}>Connect cube</TextButton>
        <TextButton onClick={() => { armed.current = true; if (settings.bluetooth.beepOnScramble) import('../services/audio.js').then(({ beep }) => beep()); actions.toast('Cube marked scrambled'); }}>Mark scrambled</TextButton>
      </div>
      <TextButton onClick={async () => {
        try {
          const timer = await connectBluetoothTimer();
          setInfo('Bluetooth timer connected');
          actions.setSettings({ general: { timerMode: 'stackmat' } });
          timer.addEventListener('update', (event) => emitStackmat({ status: ' ', ms: event.detail.currentTime, hands: { left: false, right: false } }));
          timer.addEventListener('stop', (event) => emitStackmat({ status: 'S', ms: event.detail.currentTime, hands: { left: false, right: false } }));
          timer.addEventListener('disconnect', () => setInfo('Timer disconnected'));
        } catch (err) {
          setError(err.message);
        }
      }}>Connect Bluetooth timer</TextButton>
    </div>
  );
}

function phaseSnapshot(stickers) {
  const phase = phaseOf(stickers);
  return [phase.crossOnD && 'cross', phase.f2l && 'f2l', phase.oll && 'oll', phase.solved && 'solved'].filter(Boolean).map((name) => ({ name, time: null }));
}
