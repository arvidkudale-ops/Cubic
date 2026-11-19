/** Scramble generators and small puzzle models whose moves are always legal. */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text) {
  let h = 2166136261;
  const str = String(text ?? '');
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function randomCubeMoves(rng, count, { faces = FACES, layers = 1 } = {}) {
  const moves = [];
  let last = '';
  for (let i = 0; i < count; i += 1) {
    let face = pick(rng, faces);
    while (face === last) face = pick(rng, faces);
    last = face;
    const dir = ['', "'", '2'][Math.floor(rng() * 3)];
    const depth = 1 + Math.floor(rng() * layers);
    if (depth === 1) moves.push(`${face}${dir}`);
    else if (depth === 2) moves.push(`${face}w${dir}`);
    else moves.push(`${depth}${face}w${dir}`);
  }
  return moves.join(' ');
}

export function pyraminxScramble(rng) {
  const axes = ['U', 'L', 'R', 'B'];
  const tips = ['u', 'l', 'r', 'b'];
  const moves = [];
  let last = '';
  const length = 8 + Math.floor(rng() * 4);
  for (let i = 0; i < length; i += 1) {
    let face = pick(rng, axes);
    while (face === last) face = pick(rng, axes);
    last = face;
    moves.push(face + (rng() < 0.5 ? '' : "'"));
  }
  tips.forEach((tip) => {
    const turn = Math.floor(rng() * 3);
    if (turn === 1) moves.push(tip);
    if (turn === 2) moves.push(`${tip}'`);
  });
  return moves.join(' ');
}

export function skewbScramble(rng) {
  const faces = ['R', 'L', 'U', 'B'];
  const moves = [];
  let last = '';
  for (let i = 0; i < 11; i += 1) {
    let face = pick(rng, faces);
    while (face === last) face = pick(rng, faces);
    last = face;
    moves.push(face + (rng() < 0.5 ? '' : "'"));
  }
  return moves.join(' ');
}

export function megaminxScramble(rng) {
  const lines = [];
  for (let line = 0; line < 7; line += 1) {
    const moves = [];
    for (let i = 0; i < 10; i += 1) {
      const face = i % 2 === 0 ? 'R' : 'D';
      moves.push(face + (rng() < 0.5 ? '++' : '--'));
    }
    moves.push(rng() < 0.5 ? 'U' : "U'");
    lines.push(moves.join(' '));
  }
  return lines.join('\n');
}

function clockAmount(rng) {
  const n = Math.floor(rng() * 7);
  if (n === 0) return '0+';
  return `${n}${rng() < 0.5 ? '+' : '-'}`;
}

export function clockScramble(rng) {
  const front = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'].map((name) => name + clockAmount(rng));
  const back = ['U', 'R', 'D', 'L', 'ALL'].map((name) => name + clockAmount(rng));
  return `${front.join(' ')} y2 ${back.join(' ')}`;
}

function solvedLayer(prefix) {
  const layer = [];
  for (let i = 0; i < 4; i += 1) layer.push(`${prefix}c${i}`, `${prefix}c${i}`, `${prefix}e${i}`);
  return layer;
}

function rotateLayer(layer, amount) {
  const n = ((amount % 12) + 12) % 12;
  return layer.slice(n).concat(layer.slice(0, n));
}

export function sq1CanSlice(top, bottom) {
  return top[5] !== top[6] && top[11] !== top[0] && bottom[5] !== bottom[6] && bottom[11] !== bottom[0];
}

function sliceLayers(top, bottom) {
  return [top.slice(0, 6).concat(bottom.slice(6)), bottom.slice(0, 6).concat(top.slice(6))];
}

function randomSq1Turn(rng) {
  const value = Math.floor(rng() * 11) - 5;
  return value === 0 ? (rng() < 0.5 ? 1 : -1) : value;
}

function norm12(n) {
  let value = ((n % 12) + 12) % 12;
  if (value > 6) value -= 12;
  return value;
}

export function invertSq1(scramble) {
  const tokens = [];
  String(scramble).split(/\s+/).filter(Boolean).reverse().forEach((token) => {
    if (token === '/') {
      tokens.push('/');
      return;
    }
    const match = token.match(/^\((-?\d+),(-?\d+)\)$/);
    if (!match) return;
    const turn = `(${norm12(-Number(match[1]))},${norm12(-Number(match[2]))})`;
    if (tokens[tokens.length - 1]?.startsWith('(')) {
      const prev = tokens.pop().match(/^\((-?\d+),(-?\d+)\)$/);
      const a = norm12(Number(prev[1]) + norm12(-Number(match[1])));
      const b = norm12(Number(prev[2]) + norm12(-Number(match[2])));
      if (a !== 0 || b !== 0) tokens.push(`(${a},${b})`);
      return;
    }
    if (turn !== '(0,0)') tokens.push(turn);
  });
  return tokens.join(' ');
}

export function sq1Trace(moves) {
  let top = solvedLayer('U');
  let bottom = solvedLayer('D');
  const log = [];
  for (const token of String(moves).split(/\s+/).filter(Boolean)) {
    const next = applySq1Token(top, bottom, token);
    log.push(next ? token : `FAIL ${token} top ${top[11]}|${top[0]} ${top[5]}|${top[6]} bot ${bottom[11]}|${bottom[0]} ${bottom[5]}|${bottom[6]}`);
    if (!next) return log;
    [top, bottom] = next;
  }
  log.push(sq1Solved.length ? 'end' : 'end');
  return log;
}

export function sq1Solved(moves) {
  let top = solvedLayer('U');
  let bottom = solvedLayer('D');
  const start = `${top.join(',')}|${bottom.join(',')}`;
  for (const token of String(moves).split(/\s+/).filter(Boolean)) {
    const next = applySq1Token(top, bottom, token);
    if (!next) return false;
    [top, bottom] = next;
  }
  return `${top.join(',')}|${bottom.join(',')}` === start;
}

export function sq1ShapeAfter(moves) {
  let top = solvedLayer('U');
  let bottom = solvedLayer('D');
  for (const token of String(moves).split(/\s+/).filter(Boolean)) {
    if (token === '/') {
      if (!sq1CanSlice(top, bottom)) return false;
      [top, bottom] = sliceLayers(top, bottom);
      continue;
    }
    const match = token.match(/^\((-?\d+),(-?\d+)\)$/);
    if (!match) continue;
    top = rotateLayer(top, Number(match[1]));
    bottom = rotateLayer(bottom, Number(match[2]));
  }
  return sq1ShapeSolved(top, bottom);
}

export function sq1Scramble(rng, length = 16) {
  let top = solvedLayer('U');
  let bottom = solvedLayer('D');
  const moves = [];
  let slashed = false;
  for (let i = 0; i < length; i += 1) {
    if (!slashed && sq1CanSlice(top, bottom) && rng() < 0.45) {
      [top, bottom] = sliceLayers(top, bottom);
      moves.push('/');
      slashed = true;
      continue;
    }
    const a = randomSq1Turn(rng);
    const b = randomSq1Turn(rng);
    top = rotateLayer(top, a);
    bottom = rotateLayer(bottom, b);
    moves.push(`(${a},${b})`);
    slashed = false;
  }
  return moves.join(' ');
}

export function sq1ShapeSolved(top, bottom) {
  const square = 'Aa eAa eAa eAa e'.replace(/ /g, '');
  const marked = (layer) => (layer[0] === 'A' || layer[0] === 'a' || layer[0] === 'e'
    ? layer.join('')
    : shapeLayer(layer).join(''));
  return marked(top) === square && marked(bottom) === square;
}

function shapeLayer(layer) {
  return layer.map((cell, index) => {
    if (String(cell).includes('e')) return 'e';
    const prev = layer[(index + 11) % 12];
    return prev === cell ? 'a' : 'A';
  });
}

function shapeCanSlice(top, bottom) {
  const cut = (layer) => !((layer[5] === 'A' && layer[6] === 'a') || (layer[11] === 'A' && layer[0] === 'a'));
  return cut(top) && cut(bottom);
}

function applySq1Token(top, bottom, token) {
  if (token === '/') {
    if (!sq1CanSlice(top, bottom)) return null;
    const [nt, nb] = sliceLayers(top, bottom);
    return [nt, nb];
  }
  const match = String(token).match(/^\((-?\d+),(-?\d+)\)$/);
  if (!match) return [top, bottom];
  return [rotateLayer(top, Number(match[1])), rotateLayer(bottom, Number(match[2]))];
}

/** Breadth-first search back to cube shape on the real piece model. */
export function solveSq1Shape(scramble) {
  let top = solvedLayer('U');
  let bottom = solvedLayer('D');
  for (const token of String(scramble).split(/\s+/).filter(Boolean)) {
    const next = applySq1Token(top, bottom, token);
    if (!next) return { moves: null, reason: 'The scramble contains a slice that this shape cannot turn.' };
    [top, bottom] = next;
  }
  const keyOf = (t, b) => `${shapeLayer(t).join('')}|${shapeLayer(b).join('')}`;
  if (sq1ShapeSolved(top, bottom)) return { moves: [], shape: 'square' };
  const start = keyOf(top, bottom);
  const queue = [{ top, bottom, key: start }];
  const parent = new Map([[start, null]]);
  let head = 0;
  while (head < queue.length && parent.size < 8000) {
    const current = queue[head];
    head += 1;
    const last = parent.get(current.key);
    if (sq1CanSlice(current.top, current.bottom) && last?.move !== '/') {
      const [nt, nb] = sliceLayers(current.top, current.bottom);
      const nextKey = keyOf(nt, nb);
      if (!parent.has(nextKey)) {
        parent.set(nextKey, { prev: current.key, move: '/' });
        if (sq1ShapeSolved(nt, nb)) {
          const moves = trace(parent, nextKey);
          if (sq1ShapeAfter(`${scramble} ${moves.join(' ')}`)) return { moves, nodes: parent.size };
        }
        queue.push({ top: nt, bottom: nb, key: nextKey });
      }
    }
    if (last?.move?.startsWith('(')) continue;
    for (let a = -5; a <= 6; a += 1) {
      if (a === 0) continue;
      for (let b = -5; b <= 6; b += 1) {
        if (b === 0) continue;
        const nt = rotateLayer(current.top, a);
        const nb = rotateLayer(current.bottom, b);
        const nextKey = keyOf(nt, nb);
        if (parent.has(nextKey)) continue;
        const move = `(${a},${b})`;
        parent.set(nextKey, { prev: current.key, move });
        if (sq1ShapeSolved(nt, nb)) {
          const moves = trace(parent, nextKey);
          if (sq1ShapeAfter(`${scramble} ${moves.join(' ')}`)) return { moves, nodes: parent.size };
        }
        queue.push({ top: nt, bottom: nb, key: nextKey });
      }
    }
  }
  return { moves: null, nodes: parent.size, reason: 'No cube-shape solution within the search limit.' };
}

function trace(parent, key) {
  const moves = [];
  let cursor = key;
  while (parent.get(cursor)) {
    moves.push(parent.get(cursor).move);
    cursor = parent.get(cursor).prev;
  }
  return moves.reverse();
}

export function eventScramble(eventId, rng, { length, mbfCount = 5, fast444 = false } = {}) {
  if (eventId === '333mbf') {
    return Array.from({ length: mbfCount }, (_, i) => `${i + 1}. ${randomCubeMoves(rng, length || 20)}`).join('\n');
  }
  if (eventId === 'pyram') return pyraminxScramble(rng);
  if (eventId === 'skewb') return skewbScramble(rng);
  if (eventId === 'minx') return megaminxScramble(rng);
  if (eventId === 'clock') return clockScramble(rng);
  if (eventId === 'sq1') return sq1Scramble(rng, length || 16);
  if (eventId === '222') return randomCubeMoves(rng, length || 11, { faces: ['U', 'R', 'F'] });
  if (eventId === '444' || eventId === '444bf') {
    return randomCubeMoves(rng, length || (fast444 ? 30 : 40), { layers: fast444 ? 1 : 2 });
  }
  if (eventId === '555' || eventId === '555bf') return randomCubeMoves(rng, length || 60, { layers: 2 });
  if (eventId === '666') return randomCubeMoves(rng, length || 80, { layers: 3 });
  if (eventId === '777') return randomCubeMoves(rng, length || 100, { layers: 3 });
  const base = randomCubeMoves(rng, length || 20);
  if (eventId === '333fm') return `R' U' F ${base} R' U' F`;
  return base;
}
