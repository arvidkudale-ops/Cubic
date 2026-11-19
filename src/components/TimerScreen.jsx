import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../state/Store.jsx';
import { eventById, EVENTS, EVENT_GROUPS } from '../data/events.js';
import { formatTime, parseTypedTime, splitTime } from '../engine/time.js';
import { beep, speak } from '../services/audio.js';
import { onCubeMove } from '../services/bluetooth.js';
import { onStackmat } from '../services/stackmat.js';
import { IconButton, TextButton } from './ui.jsx';

const typingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

export function TimerScreen() {
  const { settings, eventId, scramble, caseName, scrambleSource, canPrev, stats, actions, view } = useStore();
  const [phase, setPhase] = useState('idle');
  const [finalMs, setFinalMs] = useState(0);
  const [typed, setTyped] = useState('');
  const [splits, setSplits] = useState([]);
  const [showImage, setShowImage] = useState(settings.scramble.showImage);
  const mainRef = useRef(null);
  const fracRef = useRef(null);
  const phaseRef = useRef('idle');
  const penaltyRef = useRef('ok');
  const splitsRef = useRef([]);
  const startRef = useRef(0);
  const inspRef = useRef(0);
  const rafRef = useRef(0);
  const holdRef = useRef(0);
  const saidRef = useRef({ eight: false, twelve: false });
  const mode = settings.general.timerMode;

  const paint = (ms, precision = settings.timer.precision) => {
    const parts = splitTime(Math.max(0, ms), precision);
    if (mainRef.current) mainRef.current.textContent = parts.main;
    if (fracRef.current) fracRef.current.textContent = parts.frac;
  };

  const setPhaseBoth = (next) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const stopLoops = () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(holdRef.current);
  };

  const finish = (ms, penalty = penaltyRef.current) => {
    stopLoops();
    setPhaseBoth('stopped');
    setFinalMs(ms);
    paint(penalty === 'dnf' ? 0 : ms + (penalty === 'plus2' ? 2000 : 0));
    if (penalty === 'dnf' && mainRef.current) {
      mainRef.current.textContent = 'DNF';
      if (fracRef.current) fracRef.current.textContent = '';
    }
    actions.addSolve({
      time: Math.max(0, Math.round(ms)),
      penalty,
      scramble,
      phases: splitsRef.current,
      comment: mode === 'lastlayer' ? 'Last layer' : '',
    });
    splitsRef.current = [];
    setSplits([]);
    penaltyRef.current = 'ok';
  };

  const runLoop = () => {
    const tick = () => {
      paint(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const beginRun = () => {
    stopLoops();
    startRef.current = performance.now();
    setPhaseBoth('running');
    paint(0);
    runLoop();
  };

  const inspectionLoop = () => {
    const tick = () => {
      const elapsed = (performance.now() - inspRef.current) / 1000;
      const remain = settings.inspection.duration - elapsed;
      if (mainRef.current) mainRef.current.textContent = String(Math.max(0, Math.ceil(remain)));
      if (fracRef.current) fracRef.current.textContent = elapsed > settings.inspection.plus2After ? '+2' : '';
      if (elapsed >= 8 && settings.inspection.voice8 && !saidRef.current.eight) {
        saidRef.current.eight = true;
        if (settings.inspection.voice) speak('eight', settings.inspection.volume);
        else beep({ volume: settings.inspection.volume });
      }
      if (elapsed >= 12 && settings.inspection.voice12 && !saidRef.current.twelve) {
        saidRef.current.twelve = true;
        if (settings.inspection.voice) speak('twelve', settings.inspection.volume);
        else beep({ frequency: 520, volume: settings.inspection.volume });
      }
      if (elapsed >= settings.inspection.dnfAfter) penaltyRef.current = 'dnf';
      else if (elapsed >= settings.inspection.plus2After) penaltyRef.current = 'plus2';
      if (phaseRef.current === 'inspection-ready' && mainRef.current) mainRef.current.textContent = '0';
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const beginInspection = () => {
    saidRef.current = { eight: false, twelve: false };
    penaltyRef.current = 'ok';
    inspRef.current = performance.now();
    setPhaseBoth('inspection');
    inspectionLoop();
  };

  const down = () => {
    if (view !== 'timer') return;
    if (mode === 'typing' || mode === 'stackmat' || mode === 'bluetooth' || mode === 'virtual') return;
    const current = phaseRef.current;
    if (current === 'running') {
      if (mode === 'multiphase') {
        const at = performance.now() - startRef.current;
        const mark = { name: `Split ${splitsRef.current.length + 1}`, time: at };
        splitsRef.current = [...splitsRef.current, mark];
        setSplits(splitsRef.current);
        return;
      }
      finish(performance.now() - startRef.current);
      return;
    }
    if (current === 'inspection') {
      setPhaseBoth('inspection-hold');
      holdRef.current = setTimeout(() => setPhaseBoth('inspection-ready'), settings.timer.holdMs);
      return;
    }
    if (current === 'inspection-hold' || current === 'inspection-ready') return;
    if (current !== 'idle' && current !== 'stopped') return;
    setPhaseBoth('holding');
    holdRef.current = setTimeout(() => setPhaseBoth('ready'), settings.timer.holdMs);
  };

  const finishPrep = () => {
    stopLoops();
    if (settings.inspection.enabled && phaseRef.current !== 'inspection') beginInspection();
    else beginRun();
  };

  const up = () => {
    if (phaseRef.current === 'holding') {
      clearTimeout(holdRef.current);
      setPhaseBoth('idle');
      paint(finalMs);
      return;
    }
    if (phaseRef.current === 'inspection-hold') {
      clearTimeout(holdRef.current);
      setPhaseBoth('inspection');
      return;
    }
    if (phaseRef.current === 'ready') finishPrep();
    if (phaseRef.current === 'inspection-ready') beginRun();
  };

  const downRef = useRef(() => {});
  const upRef = useRef(() => {});
  const finishRef = useRef(() => {});
  downRef.current = down;
  upRef.current = up;
  finishRef.current = finish;
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat || typingTarget(event.target)) return;
      if (event.code === 'Enter' && settings.general.timerMode === 'multiphase' && phaseRef.current === 'running') {
        finishRef.current(performance.now() - startRef.current);
        return;
      }
      if (event.code !== 'Space' || !settings.timer.keyboard) return;
      event.preventDefault();
      downRef.current();
    };
    const onKeyUp = (event) => {
      if (event.code !== 'Space' || typingTarget(event.target) || !settings.timer.keyboard) return;
      event.preventDefault();
      upRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [settings.timer.keyboard, settings.general.timerMode]);

  useEffect(() => {
    let previous = '';
    return onStackmat((packet) => {
      if (settings.general.timerMode !== 'stackmat') return;
      paint(packet.ms);
      if (packet.status === ' ') setPhaseBoth('running');
      if (packet.status === 'S' && previous !== 'S') {
        setPhaseBoth('stopped');
        actions.addSolve({ time: packet.ms, penalty: 'ok', scramble });
      }
      if (packet.status === 'I' || packet.status === 'A') setPhaseBoth(packet.status === 'A' ? 'ready' : 'idle');
      previous = packet.status;
    });
  }, [settings.general.timerMode, scramble, actions]);

  useEffect(() => onCubeMove((detail) => {
    if (settings.general.timerMode !== 'bluetooth') return;
    if (detail.type === 'start') beginRun();
    if (detail.type === 'move' && phaseRef.current === 'running') {
      splitsRef.current = [...splitsRef.current, { name: detail.move, time: performance.now() - startRef.current }];
    }
    if (detail.type === 'solved' && phaseRef.current === 'running') {
      const ms = performance.now() - startRef.current;
      stopLoops();
      setPhaseBoth('stopped');
      actions.addSolve({ time: Math.round(ms), penalty: 'ok', scramble, reconstruction: detail.reconstruction || '', moves: detail.moves || null, phases: detail.phases || splitsRef.current });
    }
  }), [settings.general.timerMode, scramble, actions]);

  useEffect(() => () => stopLoops(), []);
  useEffect(() => { paint(0); }, [settings.timer.precision]);
  useEffect(() => {
    const hide = settings.timer.hideWhileTiming && (phase === 'running' || phase === 'inspection' || phase === 'inspection-hold' || phase === 'inspection-ready');
    document.body.classList.toggle('timing', hide);
    return () => document.body.classList.remove('timing');
  }, [phase, settings.timer.hideWhileTiming]);

  const preparing = phase === 'ready' || phase === 'inspection-ready';
  const color = preparing ? settings.timer.readyColor : phase === 'holding' || phase === 'inspection-hold' ? 'var(--warn)' : phase === 'inspection' ? (penaltyRef.current === 'dnf' ? 'var(--bad)' : 'var(--warn)') : settings.timer.color;
  const size = 108 * settings.timer.fontScale * settings.timer.zoom;

  const submitTyped = () => {
    const parsed = parseTypedTime(typed, settings.general.integerUnit);
    if (!parsed) return;
    actions.addSolve({ time: parsed.time, penalty: parsed.penalty, scramble });
    setTyped('');
  };

  const gesture = useRef(null);
  const timingPointer = (event) => (event.pointerType === 'mouse' ? settings.timer.mouse : settings.timer.touch);
  const onPointerDown = (event) => {
    gesture.current = { x: event.clientX, y: event.clientY, t: performance.now() };
    if (!timingPointer(event)) return;
    if (mode === 'keyboard' || mode === 'mouse' || mode === 'touch' || mode === 'multiphase' || mode === 'lastlayer') down();
  };
  const onPointerUp = (event) => {
    const start = gesture.current;
    gesture.current = null;
    if (start && settings.gestures.enabled && phaseRef.current !== 'running') {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) > 70) {
        const action = gestureAction(dx, dy, settings.gestures);
        runGesture(action, actions);
        setPhaseBoth('idle');
        return;
      }
    }
    if (mode === 'keyboard' || mode === 'mouse' || mode === 'touch' || mode === 'multiphase' || mode === 'lastlayer') up();
  };

  return (
    <div className="timer-stage relative flex min-h-0 flex-1 flex-col px-4 pb-24 pt-4 md:px-8 md:pb-8">
      <div className="chrome mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm text-[var(--muted)]">
          Event
          <select className="field ml-2 w-auto" value={eventId} onChange={(event) => actions.setEvent(event.target.value)}>
            {EVENT_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {EVENTS.filter((item) => item.group === group).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{eventById(eventId).label} · {mode}</div>
      </div>
      <div className="chrome card mb-4 px-4 py-3" style={{ textAlign: settings.scramble.align, maxHeight: settings.scramble.maxHeight, overflow: 'auto' }}>
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span>{caseName ? `Case ${caseName}` : scrambleSource === 'random-state' ? 'Random-state scramble' : scrambleSource === 'training' ? 'Training scramble' : 'Scramble'}</span>
          <span className="flex gap-1">
            <IconButton label="Previous scramble" onClick={actions.prevScramble} disabled={!canPrev}><ChevronLeft size={16} /></IconButton>
            <IconButton label="Next scramble" onClick={actions.nextScramble}><ChevronRight size={16} /></IconButton>
            <IconButton label="Copy scramble" onClick={() => navigator.clipboard.writeText(scramble)}><Copy size={16} /></IconButton>
            <IconButton label="Toggle scramble image" onClick={() => setShowImage((value) => !value)}>{showImage ? <EyeOff size={16} /> : <Eye size={16} />}</IconButton>
          </span>
        </div>
        <button className="scramble-text w-full bg-transparent text-left" style={{ fontSize: `${16 * settings.scramble.fontScale}px`, textAlign: settings.scramble.align }} onClick={() => {
          if (settings.scramble.clickAction === 'next') actions.nextScramble();
          else navigator.clipboard.writeText(scramble).then(() => actions.toast('Scramble copied'));
        }}>{scramble || 'Generating scramble…'}</button>
        {showImage && <ScramblePreview scramble={scramble} eventId={eventId} size={settings.scramble.imageSize} />}
      </div>
      <div
        className="relative flex flex-1 flex-col items-center justify-center"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { clearTimeout(holdRef.current); if (phaseRef.current === 'holding' || phaseRef.current === 'ready') setPhaseBoth('idle'); }}
        style={{ touchAction: 'none' }}
      >
        <div className="timer-halo" style={{ opacity: preparing ? 1 : 0.75, background: preparing ? 'radial-gradient(circle, color-mix(in srgb, var(--good) 45%, transparent), transparent 68%)' : undefined }} />
        {mode === 'typing' ? (
          <form className="z-10 flex w-full max-w-md flex-col items-center gap-3" onSubmit={(event) => { event.preventDefault(); submitTyped(); }}>
            <input className="field timer-digits text-center text-5xl" value={typed} autoFocus placeholder="12.34" onChange={(event) => setTyped(event.target.value)} />
            <TextButton tone="primary" type="submit">Add solve</TextButton>
            <p className="text-center text-sm text-[var(--muted)]">A bare number is read as {settings.general.integerUnit}. Use a decimal or 1:02.34 for an exact time.</p>
          </form>
        ) : (
          <div className="z-10 text-center">
            <div className="timer-digits" style={{ fontSize: size, color, textShadow: preparing ? '0 0 30px color-mix(in srgb, var(--good) 70%, transparent)' : 'none' }}>
              <span ref={mainRef}>0.00</span>
              {settings.timer.smallerDecimals && <span className="frac" ref={fracRef} />}
              {!settings.timer.smallerDecimals && <span ref={fracRef} />}
            </div>
            <div className="mt-3 text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
              {(phase === 'holding' || phase === 'inspection-hold') && 'Hold'}
              {(phase === 'ready' || phase === 'inspection-ready') && 'Ready'}
              {phase === 'inspection' && 'Inspection'}
              {phase === 'running' && (mode === 'multiphase' ? 'Space splits · Enter stops' : mode === 'lastlayer' ? 'Last layer' : 'Solving')}
              {(phase === 'idle' || phase === 'stopped') && (mode === 'stackmat' ? 'Waiting for Stackmat' : mode === 'bluetooth' ? 'Waiting for cube moves' : 'Space to start')}
            </div>
            {!!splits.length && <div className="mt-3 text-sm text-[var(--muted)]">{splits.map((split) => `${split.name} ${formatTime(split.time, 2)}`).join(' · ')}</div>}
          </div>
        )}
      </div>
      <StatsStrip stats={stats} settings={settings} />
    </div>
  );
}

function StatsStrip({ stats, settings }) {
  const items = [
    ['single', 'Single', stats.current],
    ['ao5', 'Ao5', stats.ao5?.dnf ? 'DNF' : stats.ao5?.ms],
    ['ao12', 'Ao12', stats.ao12?.dnf ? 'DNF' : stats.ao12?.ms],
    ['best', 'Best', stats.single?.ms],
    ['bestAo5', 'Best Ao5', stats.bestAo5?.ms],
  ].filter(([id]) => settings.stats.indicators.includes(id));
  return (
    <div className="chrome z-10 mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
      {items.map(([id, label, value]) => (
        <div key={id} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3 py-2">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
          <div className="timer-digits text-xl">{value == null ? '—' : value === 'DNF' ? 'DNF' : formatTime(value, settings.timer.precision)}</div>
        </div>
      ))}
      {settings.stats.showTarget && stats.timeToBeatAo5 != null && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 md:col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">To beat Ao5</div>
          <div className="timer-digits text-xl">{formatTime(stats.timeToBeatAo5, 2)}</div>
        </div>
      )}
    </div>
  );
}

function gestureAction(dx, dy, gestures) {
  const horizontal = Math.abs(dx) > Math.abs(dy);
  if (horizontal && dx < 0) return gestures.left;
  if (horizontal && dx > 0) return gestures.right;
  if (dy < 0 && dx < -40) return gestures.upLeft;
  if (dy < 0 && dx > 40) return gestures.upRight;
  if (dy < 0) return gestures.up;
  if (dy > 0 && dx < -40) return gestures.downLeft;
  if (dy > 0 && dx > 40) return gestures.downRight;
  return gestures.down;
}

function runGesture(action, actions) {
  if (action === 'plus2') actions.penaltyLast('plus2');
  if (action === 'dnf') actions.penaltyLast('dnf');
  if (action === 'ok') actions.penaltyLast('ok');
  if (action === 'prev-scramble') actions.prevScramble();
  if (action === 'next-scramble') actions.nextScramble();
  if (action === 'delete-last') actions.deleteLast();
  if (action === 'comment') actions.setModal({ type: 'latest-comment' });
  if (action === 'details') actions.setModal({ type: 'latest' });
}

function ScramblePreview({ scramble, eventId, size }) {
  const host = useRef(null);
  const puzzle = eventById(eventId).puzzle;
  useEffect(() => {
    const node = host.current;
    if (!node || !scramble) return undefined;
    let player;
    let cancel = false;
    import('cubing/twisty').then(({ TwistyPlayer }) => {
      if (cancel) return;
      player = new TwistyPlayer({
        puzzle,
        experimentalSetupAlg: scramble,
        alg: '',
        background: 'none',
        controlPanel: 'none',
        hintFacelets: 'none',
        cameraLatitude: 28,
        cameraLongitude: 24,
      });
      player.style.width = `${size}px`;
      player.style.height = `${size * 0.78}px`;
      player.style.pointerEvents = 'none';
      player.style.display = 'block';
      node.replaceChildren(player);
    }).catch((error) => {
      node.textContent = error.message;
    });
    return () => { cancel = true; player?.remove(); };
  }, [scramble, puzzle, size]);
  return <div ref={host} className="mt-3 flex justify-center" />;
}

export { ScramblePreview };
