import { useEffect, useMemo, useRef, useState } from 'react';
import { applyAlg, isSolved, newCube, phaseOf } from '../engine/cube.js';
import { formatTime } from '../engine/time.js';
import { useStore } from '../state/Store.jsx';
import { TextButton } from './ui.jsx';

const PALETTE = { U: '#f4f6f8', R: '#e23d3d', F: '#3cba5a', D: '#f5d000', L: '#ff8c1a', B: '#3a74ff' };
const CUBE_EVENTS = new Set(['222', '333', '333oh', '333bf', '333fm']);

function stamp(stickers) {
  const ids = new Map();
  let n = 0;
  return stickers.map((sticker) => {
    const key = `${sticker.x},${sticker.y},${sticker.z}`;
    if (!ids.has(key)) ids.set(key, n++);
    return { ...sticker, cubie: ids.get(key) };
  });
}

function groupCubies(stickers) {
  const map = new Map();
  stickers.forEach((sticker) => {
    if (!map.has(sticker.cubie)) map.set(sticker.cubie, { id: sticker.cubie, x: sticker.x, y: sticker.y, z: sticker.z, faces: [] });
    const cubie = map.get(sticker.cubie);
    cubie.x = sticker.x;
    cubie.y = sticker.y;
    cubie.z = sticker.z;
    cubie.faces.push(sticker);
  });
  return [...map.values()];
}

function onFace(cubie, face) {
  if (face === 'R') return cubie.x === 1;
  if (face === 'L') return cubie.x === -1;
  if (face === 'U') return cubie.y === 1;
  if (face === 'D') return cubie.y === -1;
  if (face === 'F') return cubie.z === 1;
  return cubie.z === -1;
}

function spinCss(spin) {
  const q = spin.turns;
  if (spin.face === 'R') return `rotateX(${-90 * q}deg)`;
  if (spin.face === 'L') return `rotateX(${90 * q}deg)`;
  if (spin.face === 'U') return `rotateY(${-90 * q}deg)`;
  if (spin.face === 'D') return `rotateY(${90 * q}deg)`;
  if (spin.face === 'F') return `rotateZ(${-90 * q}deg)`;
  return `rotateZ(${90 * q}deg)`;
}

function faceTransform(face) {
  if (face.ny === 1) return 'translateZ(34px) rotateX(90deg)';
  if (face.ny === -1) return 'translateZ(34px) rotateX(-90deg)';
  if (face.nx === 1) return 'translateZ(34px) rotateY(90deg)';
  if (face.nx === -1) return 'translateZ(34px) rotateY(-90deg)';
  if (face.nz === -1) return 'translateZ(34px) rotateY(180deg)';
  return 'translateZ(34px)';
}

export function VirtualCube() {
  const { scramble, eventId, settings, actions } = useStore();
  const [stickers, setStickers] = useState(() => stamp(newCube()));
  const [spin, setSpin] = useState(null);
  const [orbit, setOrbit] = useState({ x: -24, y: -32 });
  const [label, setLabel] = useState('Solved');
  const [tps, setTps] = useState(null);
  const stickersRef = useRef(stickers);
  const spinRef = useRef(null);
  const armed = useRef(false);
  const running = useRef(false);
  const startRef = useRef(0);
  const movesRef = useRef([]);
  const splitsRef = useRef([]);
  const phaseRef = useRef(phaseOf(stamp(newCube())));
  const clockRef = useRef(null);
  const rafRef = useRef(0);
  const drag = useRef(null);
  stickersRef.current = stickers;

  const cubies = useMemo(() => groupCubies(stickers), [stickers]);
  const moving = spin ? cubies.filter((cubie) => onFace(cubie, spin.face)) : [];
  const still = spin ? cubies.filter((cubie) => !onFace(cubie, spin.face)) : cubies;
  const timing = settings.general.timerMode === 'virtual';

  const paint = (ms) => {
    if (clockRef.current) clockRef.current.textContent = formatTime(ms, settings.timer.precision);
  };

  const stopClock = () => {
    cancelAnimationFrame(rafRef.current);
    running.current = false;
  };

  useEffect(() => () => stopClock(), []);

  const commit = (notation, turns) => {
    const next = applyAlg(stickersRef.current, notation);
    stickersRef.current = next;
    setStickers(next);
    setSpin(null);
    spinRef.current = null;
    const phase = phaseOf(next);
    const names = { crossOnD: 'Cross', f2l: 'F2L', oll: 'OLL', solved: 'Solved' };
    if (running.current) {
      const at = performance.now() - startRef.current;
      movesRef.current = [...movesRef.current, { move: notation, time: at }];
      if (settings.virtual.multiPhase) {
        Object.keys(names).forEach((key) => {
          if (phase[key] && !phaseRef.current[key]) splitsRef.current = [...splitsRef.current, { name: names[key], time: at }];
        });
      }
      const seconds = at / 1000;
      setTps(seconds > 0 ? movesRef.current.length / seconds : null);
      if (phase.solved) {
        stopClock();
        paint(at);
        actions.addSolve({
          time: Math.round(at),
          penalty: 'ok',
          scramble,
          reconstruction: movesRef.current.map((item) => item.move).join(' '),
          moves: movesRef.current,
          phases: splitsRef.current,
          comment: 'Virtual cube',
        });
        armed.current = false;
        setLabel('Solved');
      }
    } else if (armed.current && timing && !phaseRef.current.solved) {
      running.current = true;
      startRef.current = performance.now();
      movesRef.current = [{ move: notation, time: 0 }];
      splitsRef.current = [];
      const tick = () => {
        paint(performance.now() - startRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setLabel('Solving');
    }
    phaseRef.current = phase;
    if (!running.current) setLabel(phase.solved ? 'Solved' : phase.f2l ? 'Last layer' : phase.crossOnD ? 'F2L' : 'Scrambled');
    void turns;
  };

  const turn = (face, turns) => {
    if (spinRef.current) return;
    const suffix = turns === 3 ? "'" : turns === 2 ? '2' : '';
    const notation = `${face}${suffix}`;
    const motion = { face, turns };
    spinRef.current = motion;
    setSpin(motion);
    window.setTimeout(() => commit(notation, turns), settings.virtual.turnMs);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') return;
      const face = { KeyU: 'U', KeyD: 'D', KeyL: 'L', KeyR: 'R', KeyF: 'F', KeyB: 'B' }[event.code];
      if (!face || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      turn(face, event.shiftKey ? 3 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const applyScramble = () => {
    if (!CUBE_EVENTS.has(eventId)) {
      actions.toast('The interactive cube is a 3×3. This event uses a different move set.', 'bad');
      return;
    }
    stopClock();
    const next = applyAlg(stamp(newCube()), scramble.replaceAll('\n', ' '));
    stickersRef.current = next;
    phaseRef.current = phaseOf(next);
    setStickers(next);
    armed.current = !isSolved(next);
    movesRef.current = [];
    splitsRef.current = [];
    setTps(null);
    paint(0);
    setLabel(armed.current ? 'Scrambled' : 'Solved');
  };

  const reset = () => {
    stopClock();
    const next = stamp(newCube());
    stickersRef.current = next;
    phaseRef.current = phaseOf(next);
    setStickers(next);
    armed.current = false;
    setTps(null);
    paint(0);
    setLabel('Solved');
  };

  return (
    <div className="scroll-y flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Virtual cube</h2>
          <p className="text-sm text-[var(--muted)]">U D L R F B turn a face. Shift turns it the other way. Drag to orbit. Times are saved only in Virtual cube timer mode, and only after you apply a scramble.</p>
        </div>
        <div className="timer-digits text-5xl" ref={clockRef}>0.00</div>
      </div>
      <div
        className="cube-scene card"
        onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY, ox: orbit.x, oy: orbit.y }; }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setOrbit({ x: drag.current.ox + (event.clientY - drag.current.y) * 0.4, y: drag.current.oy + (event.clientX - drag.current.x) * 0.45 });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerLeave={() => { drag.current = null; }}
      >
        <div className="cube" style={{ transform: `rotateX(${orbit.x}deg) rotateY(${orbit.y}deg)` }}>
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: spin ? spinCss(spin) : 'none', transition: spin ? `transform ${settings.virtual.turnMs}ms linear` : 'none' }}>
            {moving.map((cubie) => <CubieView key={cubie.id} cubie={cubie} />)}
          </div>
          {still.map((cubie) => <CubieView key={cubie.id} cubie={cubie} />)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[var(--muted)]">{label}{tps != null ? ` · ${tps.toFixed(2)} TPS` : ''}</span>
        <TextButton tone="primary" onClick={applyScramble}>Apply scramble</TextButton>
        <TextButton onClick={reset}>Reset</TextButton>
        {settings.general.timerMode !== 'virtual' && <TextButton onClick={() => actions.setSettings({ general: { timerMode: 'virtual' } })}>Time solves from this cube</TextButton>}
      </div>
      <div className="flex flex-wrap gap-2">
        {['U', 'D', 'L', 'R', 'F', 'B'].map((face) => (
          <span key={face} className="flex gap-1">
            <TextButton onClick={() => turn(face, 1)}>{face}</TextButton>
            <TextButton onClick={() => turn(face, 3)}>{face}'</TextButton>
          </span>
        ))}
      </div>
      {!timing && <p className="text-sm text-[var(--muted)]">Timer mode is {settings.general.timerMode}. Turns update the cube state, and they are not written into the session until virtual timing is on.</p>}
    </div>
  );
}

function CubieView({ cubie }) {
  return (
    <div className="cubie" style={{ left: '50%', top: '50%', marginLeft: -34, marginTop: -34, transform: `translate3d(${cubie.x * 70}px, ${-cubie.y * 70}px, ${cubie.z * 70}px)` }}>
      {cubie.faces.map((face) => (
        <div key={`${face.nx},${face.ny},${face.nz}`} className="face" style={{ transform: faceTransform(face) }}>
          <div className="sticker" style={{ background: PALETTE[face.color] }} />
        </div>
      ))}
    </div>
  );
}
