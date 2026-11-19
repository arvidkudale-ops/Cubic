/**
 * 3x3 model.
 * Coordinates: x right, y up, z front. Each sticker keeps its color while
 * face turns rotate position and normal together, so orientation is physical
 * rather than a separate lookup table.
 */

export const COLORS = ['U', 'R', 'F', 'D', 'L', 'B'];

const FACE_OF_NORMAL = {
  '0,1,0': 'U',
  '0,-1,0': 'D',
  '1,0,0': 'R',
  '-1,0,0': 'L',
  '0,0,1': 'F',
  '0,0,-1': 'B',
};

export function rotR(x, y, z) { return [x, z, -y]; }
export function rotL(x, y, z) { return [x, -z, y]; }
export function rotU(x, y, z) { return [-z, y, x]; }
export function rotD(x, y, z) { return [z, y, -x]; }
export function rotF(x, y, z) { return [y, -x, z]; }
export function rotB(x, y, z) { return [-y, x, z]; }

const ROT = { R: rotR, L: rotL, U: rotU, D: rotD, F: rotF, B: rotB };

function facePredicate(face, depth, x, y, z) {
  if (face === 'R') return x >= 2 - depth;
  if (face === 'L') return x <= depth - 2;
  if (face === 'U') return y >= 2 - depth;
  if (face === 'D') return y <= depth - 2;
  if (face === 'F') return z >= 2 - depth;
  if (face === 'B') return z <= depth - 2;
  return false;
}

export function solvedStickers() {
  const stickers = [];
  const pushFace = (color, nx, ny, nz, axis) => {
    for (let a = -1; a <= 1; a += 1) {
      for (let b = -1; b <= 1; b += 1) {
        const pos = [nx, ny, nz];
        if (axis === 'y') { pos[0] = a; pos[2] = -b; }
        else if (axis === 'x') { pos[2] = -a; pos[1] = -b; }
        else { pos[0] = a; pos[1] = -b; }
        stickers.push({ x: pos[0], y: pos[1], z: pos[2], nx, ny, nz, color });
      }
    }
  };
  pushFace('U', 0, 1, 0, 'y');
  pushFace('D', 0, -1, 0, 'y');
  pushFace('R', 1, 0, 0, 'x');
  pushFace('L', -1, 0, 0, 'x');
  pushFace('F', 0, 0, 1, 'z');
  pushFace('B', 0, 0, -1, 'z');
  return stickers;
}

function cloneStickers(stickers) {
  return stickers.map((s) => ({ ...s }));
}

export function applyQuarter(stickers, face) {
  const rot = ROT[face];
  return stickers.map((s) => {
    if (!facePredicate(face, 1, s.x, s.y, s.z)) return s;
    const [x, y, z] = rot(s.x, s.y, s.z);
    const [nx, ny, nz] = rot(s.nx, s.ny, s.nz);
    return { ...s, x, y, z, nx, ny, nz };
  });
}

export function applyMoveSpec(stickers, { face, depth = 1, turns = 1, slice = false, cube = false }) {
  let next = stickers;
  const n = ((turns % 4) + 4) % 4;
  if (cube) {
    const rot = ROT[face];
    for (let t = 0; t < n; t += 1) {
      next = next.map((s) => {
        const [x, y, z] = rot(s.x, s.y, s.z);
        const [nx, ny, nz] = rot(s.nx, s.ny, s.nz);
        return { ...s, x, y, z, nx, ny, nz };
      });
    }
    return next;
  }
  if (slice) {
    const rot = ROT[face];
    const pred = face === 'L'
      ? (s) => s.x === 0
      : face === 'D'
        ? (s) => s.y === 0
        : (s) => s.z === 0;
    for (let t = 0; t < n; t += 1) {
      next = next.map((s) => {
        if (!pred(s)) return s;
        const [x, y, z] = rot(s.x, s.y, s.z);
        const [nx, ny, nz] = rot(s.nx, s.ny, s.nz);
        return { ...s, x, y, z, nx, ny, nz };
      });
    }
    return next;
  }
  const rot = ROT[face];
  for (let t = 0; t < n; t += 1) {
    next = next.map((s) => {
      if (!facePredicate(face, depth, s.x, s.y, s.z)) return s;
      const [x, y, z] = rot(s.x, s.y, s.z);
      const [nx, ny, nz] = rot(s.nx, s.ny, s.nz);
      return { ...s, x, y, z, nx, ny, nz };
    });
  }
  return next;
}

const FACE_CHARS = new Set('URFDLB');

export function tokenizeAlg(alg) {
  const src = String(alg || '').replace(/[’‘]/g, "'").replace(/\(/g, ' (').trim();
  const moves = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '/') {
      if (ch === '/') moves.push({ slash: true, raw: '/' });
      i += 1;
      continue;
    }
    if (ch === '(') {
      const end = src.indexOf(')', i);
      const raw = src.slice(i, end === -1 ? src.length : end + 1);
      moves.push({ sq1: raw, raw });
      i += raw.length;
      continue;
    }
    let depth = 1;
    if (ch >= '2' && ch <= '9') {
      const next = src[i + 1];
      if (next && FACE_CHARS.has(next.toUpperCase())) {
        depth = Number(ch);
        i += 1;
      }
    }
    const letter = src[i];
    if (!letter || !/[URFDLBMESxyzudlrfb]/.test(letter)) {
      i += 1;
      continue;
    }
    i += 1;
    const upper = letter.toUpperCase();
    let wide = false;
    if (src[i] === 'w') {
      wide = true;
      if (depth === 1) depth = 2;
      i += 1;
    } else if (letter !== upper && 'udlrfb'.includes(letter)) {
      wide = true;
      depth = 2;
    }
    let suffix = '';
    if (src[i] === '2') {
      suffix = '2';
      i += 1;
      if (src[i] === "'") i += 1;
    } else if (src[i] === "'") {
      suffix = "'";
      i += 1;
    }
    const turns = suffix === "'" ? 3 : suffix === '2' ? 2 : 1;
    moves.push({ face: upper, depth, turns, wide, suffix, letter, raw: `${depth > 1 && !wide ? depth : ''}${letter}${wide && letter === upper ? 'w' : ''}${suffix}` });
  }
  return moves;
}

export function moveToSpec(move) {
  if (move.slash || move.sq1) return null;
  if ('MES'.includes(move.face) && !move.wide) {
    const sliceFace = move.face === 'M' ? 'L' : move.face === 'E' ? 'D' : 'F';
    return { face: sliceFace, turns: move.turns, slice: true };
  }
  if ('XYZ'.includes(move.face)) {
    const face = move.face === 'X' ? 'R' : move.face === 'Y' ? 'U' : 'F';
    return { face, turns: move.turns, cube: true };
  }
  return { face: move.face, depth: move.depth, turns: move.turns };
}

export function applyAlg(stickers, alg) {
  let state = stickers;
  for (const move of tokenizeAlg(alg)) {
    const spec = moveToSpec(move);
    if (spec) state = applyMoveSpec(state, spec);
  }
  return state;
}

export function invertAlg(alg) {
  const moves = tokenizeAlg(alg).filter((m) => !m.slash && !m.sq1);
  return moves.reverse().map((m) => {
    const turns = m.turns === 1 ? 3 : m.turns === 3 ? 1 : 2;
    const suffix = turns === 2 ? '2' : turns === 3 ? "'" : '';
    const prefix = m.depth >= 3 ? `${m.depth}` : '';
    const body = m.wide && m.letter === m.letter.toUpperCase()
      ? `${m.face}w`
      : (m.wide ? m.face.toLowerCase() : m.face);
    if ('MES'.includes(m.face) && !m.wide) return `${m.face}${suffix}`;
    if ('XYZ'.includes(m.face)) return `${m.face.toLowerCase()}${suffix}`;
    return `${prefix}${body}${suffix}`;
  }).join(' ');
}

export function simplifyAlg(alg) {
  const moves = tokenizeAlg(alg).filter((m) => !m.slash && !m.sq1);
  const out = [];
  const sig = (m) => `${m.face}:${m.depth}:${m.wide ? 1 : 0}:${m.letter}`;
  for (const move of moves) {
    const prev = out[out.length - 1];
    if (prev && sig(prev) === sig(move)) {
      const turns = (prev.turns + move.turns) % 4;
      if (turns === 0) out.pop();
      else prev.turns = turns;
    } else out.push({ ...move });
  }
  return out.map((m) => {
    const suffix = m.turns === 2 ? '2' : m.turns === 3 ? "'" : '';
    if ('MES'.includes(m.face) && !m.wide) return `${m.face}${suffix}`;
    if ('XYZ'.includes(m.face)) return `${m.face.toLowerCase()}${suffix}`;
    const prefix = m.depth >= 3 ? `${m.depth}` : '';
    const body = m.wide && m.letter === m.letter.toUpperCase() ? `${m.face}w` : (m.wide ? m.face.toLowerCase() : m.face);
    return `${prefix}${body}${suffix}`;
  }).join(' ');
}

export function isSolved(stickers) {
  return stickers.every((s) => FACE_OF_NORMAL[`${s.nx},${s.ny},${s.nz}`] === s.color);
}

export function faceNormal(face) {
  return {
    U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1],
  }[face];
}

function samePoint(a, b) {
  return a.x === b[0] && a.y === b[1] && a.z === b[2];
}

export function colorAt(stickers, pos, normal) {
  const found = stickers.find((s) => samePoint(s, pos) && s.nx === normal[0] && s.ny === normal[1] && s.nz === normal[2]);
  return found ? found.color : null;
}

/** 3x3 facelet net order, row-major, viewed from outside. Index 4 is the center. */
export function readFace(stickers, face) {
  const cells = [];
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      let pos;
      let normal;
      if (face === 'U') { pos = [col, 1, -row]; normal = [0, 1, 0]; }
      else if (face === 'D') { pos = [col, -1, row]; normal = [0, -1, 0]; }
      else if (face === 'F') { pos = [col, -row, 1]; normal = [0, 0, 1]; }
      else if (face === 'B') { pos = [-col, -row, -1]; normal = [0, 0, -1]; }
      else if (face === 'R') { pos = [1, -row, -col]; normal = [1, 0, 0]; }
      else { pos = [-1, -row, col]; normal = [-1, 0, 0]; }
      cells.push(colorAt(stickers, pos, normal));
    }
  }
  return cells;
}

export function faceletString(stickers) {
  return ['U', 'R', 'F', 'D', 'L', 'B'].map((f) => readFace(stickers, f).join('')).join('');
}

const EDGE_SLOTS = [
  { id: 0, name: 'UR', pos: [1, 1, 0], a: [0, 1, 0], b: [1, 0, 0] },
  { id: 1, name: 'UF', pos: [0, 1, 1], a: [0, 1, 0], b: [0, 0, 1] },
  { id: 2, name: 'UL', pos: [-1, 1, 0], a: [0, 1, 0], b: [-1, 0, 0] },
  { id: 3, name: 'UB', pos: [0, 1, -1], a: [0, 1, 0], b: [0, 0, -1] },
  { id: 4, name: 'DR', pos: [1, -1, 0], a: [0, -1, 0], b: [1, 0, 0] },
  { id: 5, name: 'DF', pos: [0, -1, 1], a: [0, -1, 0], b: [0, 0, 1] },
  { id: 6, name: 'DL', pos: [-1, -1, 0], a: [0, -1, 0], b: [-1, 0, 0] },
  { id: 7, name: 'DB', pos: [0, -1, -1], a: [0, -1, 0], b: [0, 0, -1] },
  { id: 8, name: 'FR', pos: [1, 0, 1], a: [0, 0, 1], b: [1, 0, 0] },
  { id: 9, name: 'FL', pos: [-1, 0, 1], a: [0, 0, 1], b: [-1, 0, 0] },
  { id: 10, name: 'BL', pos: [-1, 0, -1], a: [0, 0, -1], b: [-1, 0, 0] },
  { id: 11, name: 'BR', pos: [1, 0, -1], a: [0, 0, -1], b: [1, 0, 0] },
];

const CORNER_SLOTS = [
  { id: 0, name: 'UFR', pos: [1, 1, 1] },
  { id: 1, name: 'UFL', pos: [-1, 1, 1] },
  { id: 2, name: 'UBL', pos: [-1, 1, -1] },
  { id: 3, name: 'UBR', pos: [1, 1, -1] },
  { id: 4, name: 'DFR', pos: [1, -1, 1] },
  { id: 5, name: 'DFL', pos: [-1, -1, 1] },
  { id: 6, name: 'DBL', pos: [-1, -1, -1] },
  { id: 7, name: 'DBR', pos: [1, -1, -1] },
];

function stickerAt(stickers, x, y, z, nx, ny, nz) {
  return stickers.find((s) => s.x === x && s.y === y && s.z === z && s.nx === nx && s.ny === ny && s.nz === nz);
}

function cubieStickers(stickers, pos) {
  return stickers.filter((s) => s.x === pos[0] && s.y === pos[1] && s.z === pos[2]);
}

export function readCubies(stickers) {
  const edges = EDGE_SLOTS.map((slot) => ({
    slot: slot.id,
    parts: cubieStickers(stickers, slot.pos),
  }));
  const corners = CORNER_SLOTS.map((slot) => ({
    slot: slot.id,
    parts: cubieStickers(stickers, slot.pos),
  }));
  return { edges, corners };
}

function pieceKey(parts) {
  return parts.map((p) => p.color).sort().join('');
}

const SOLVED_READ = readCubies(solvedStickers());
const SOLVED_EDGES = SOLVED_READ.edges.map((e) => pieceKey(e.parts));
const SOLVED_CORNERS = SOLVED_READ.corners.map((c) => pieceKey(c.parts));

function edgeOrientation(parts) {
  const ud = parts.find((p) => p.color === 'U' || p.color === 'D');
  if (ud) return ud.ny !== 0 ? 0 : 1;
  const fb = parts.find((p) => p.color === 'F' || p.color === 'B') || parts[0];
  return fb.nz !== 0 ? 0 : 1;
}

function cornerOrientation(parts) {
  const ud = parts.find((p) => p.color === 'U' || p.color === 'D');
  if (!ud || ud.ny !== 0) {
    if (ud?.ny) return 0;
  }
  if (ud && ud.ny !== 0) return 0;
  if (!ud) return 0;
  // 1 if the U/D sticker faces R or L on an up-layer corner in the
  // clockwise position, otherwise 2. The exact 1-vs-2 split is validated
  // against full-sticker replay in the move tables.
  const facesR = ud.nx !== 0;
  return facesR ? 1 : 2;
}

export function locatePieces(stickers) {
  const { edges, corners } = readCubies(stickers);
  const ep = new Uint8Array(12);
  const eo = new Uint8Array(12);
  edges.forEach((edge) => {
    const piece = SOLVED_EDGES.indexOf(pieceKey(edge.parts));
    ep[edge.slot] = piece;
    eo[edge.slot] = edgeOrientation(edge.parts);
  });
  const cp = new Uint8Array(8);
  const co = new Uint8Array(8);
  corners.forEach((corner) => {
    const piece = SOLVED_CORNERS.indexOf(pieceKey(corner.parts));
    cp[corner.slot] = piece;
    co[corner.slot] = cornerOrientation(corner.parts);
  });
  return { ep, eo, cp, co };
}

export function crossSolved(stickers, color = 'U', target = 'D') {
  const targetSlots = target === 'D' ? [4, 5, 6, 7] : target === 'U' ? [0, 1, 2, 3] : null;
  if (!targetSlots) return false;
  const { ep, eo } = locatePieces(stickers);
  const wanted = color === 'U' ? [0, 1, 2, 3] : [4, 5, 6, 7];
  const sideOf = { 0: 'R', 1: 'F', 2: 'L', 3: 'B', 4: 'R', 5: 'F', 6: 'L', 7: 'B' };
  for (let i = 0; i < 4; i += 1) {
    const piece = wanted[i];
    const slot = targetSlots[i];
    if (ep[slot] !== piece || eo[slot] !== 0) return false;
    const side = sideOf[piece];
    if (colorAt(stickers, EDGE_SLOTS[slot].pos, EDGE_SLOTS[slot].b) == null) return false;
    void side;
  }
  return true;
}

export function pieceSolvedAt(stickers, kind, piece, slot) {
  const loc = locatePieces(stickers);
  if (kind === 'edge') return loc.ep[slot] === piece && loc.eo[slot] === 0;
  return loc.cp[slot] === piece && loc.co[slot] === 0;
}

export function f2lSolved(stickers) {
  const { ep, eo, cp, co } = locatePieces(stickers);
  const edges = [4, 5, 6, 7, 8, 9];
  const corners = [4, 5];
  // DFR, DFL and a right/left pair are not a full F2L. Full F2L is both D corners
  // that are front plus the back corners, the D edges, and FL/FR/BL/BR.
  const allEdges = [4, 5, 6, 7, 8, 9, 10, 11];
  const allCorners = [4, 5, 6, 7];
  return allEdges.every((s) => ep[s] === s && eo[s] === 0)
    && allCorners.every((s) => cp[s] === s && co[s] === 0);
}

export function ollSolved(stickers) {
  return readFace(stickers, 'U').every((c) => c === 'U');
}

export function phaseOf(stickers) {
  return {
    solved: isSolved(stickers),
    cross: crossSolved(stickers, 'U', 'D') || crossSolved(stickers, 'U', 'U'),
    crossOnD: crossSolved(stickers, 'U', 'D'),
    f2l: f2lSolved(stickers),
    oll: ollSolved(stickers),
    pll: ollSolved(stickers) && f2lSolved(stickers) && !isSolved(stickers),
  };
}

export function newCube() {
  return solvedStickers();
}

export function keyFacelets(stickers) {
  return faceletString(stickers);
}

export { EDGE_SLOTS, CORNER_SLOTS, cloneStickers };

const FACELET_FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

function cellAddress(face, row, col) {
  if (face === 'U') return { pos: [col, 1, -row], n: [0, 1, 0] };
  if (face === 'D') return { pos: [col, -1, row], n: [0, -1, 0] };
  if (face === 'F') return { pos: [col, -row, 1], n: [0, 0, 1] };
  if (face === 'B') return { pos: [-col, -row, -1], n: [0, 0, -1] };
  if (face === 'R') return { pos: [1, -row, -col], n: [1, 0, 0] };
  return { pos: [-1, -row, col], n: [-1, 0, 0] };
}

export function labeledSolved() {
  const stickers = solvedStickers();
  let id = 0;
  for (const face of FACELET_FACES) {
    for (let row = -1; row <= 1; row += 1) {
      for (let col = -1; col <= 1; col += 1) {
        const { pos, n } = cellAddress(face, row, col);
        const sticker = stickers.find((s) => s.x === pos[0] && s.y === pos[1] && s.z === pos[2] && s.nx === n[0] && s.ny === n[1] && s.nz === n[2]);
        sticker.id = id;
        id += 1;
      }
    }
  }
  return stickers;
}

/** perm[i] is the facelet index whose sticker moves into i. */
export function faceletPermutation(alg) {
  const stickers = applyAlg(labeledSolved(), alg);
  const perm = new Uint8Array(54);
  let id = 0;
  for (const face of FACELET_FACES) {
    for (let row = -1; row <= 1; row += 1) {
      for (let col = -1; col <= 1; col += 1) {
        const { pos, n } = cellAddress(face, row, col);
        const sticker = stickers.find((s) => s.x === pos[0] && s.y === pos[1] && s.z === pos[2] && s.nx === n[0] && s.ny === n[1] && s.nz === n[2]);
        perm[id] = sticker.id;
        id += 1;
      }
    }
  }
  return perm;
}

export function applyPerm(state, perm) {
  const next = new Uint8Array(state.length);
  for (let i = 0; i < state.length; i += 1) next[i] = state[perm[i]];
  return next;
}

export function solvedFacelets() {
  const state = new Uint8Array(54);
  let i = 0;
  for (const face of FACELET_FACES) {
    for (let n = 0; n < 9; n += 1) state[i++] = face.charCodeAt(0);
  }
  return state;
}

export function faceletsFromStickers(stickers) {
  return Uint8Array.from(faceletString(stickers), (ch) => ch.charCodeAt(0));
}

const BASIC = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2', 'M', "M'", 'M2', 'E', "E'", 'E2', 'S', "S'", 'S2', 'x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2', 'Rw', "Rw'", 'Rw2', 'Uw', "Uw'", 'Fw', "Fw'", 'Lw', "Lw'", 'Dw', "Dw'", 'Bw', "Bw'"];

const PERMS = new Map(BASIC.map((move) => [move, faceletPermutation(move)]));

export function applyMoveName(state, move) {
  const perm = PERMS.get(move) || faceletPermutation(move);
  return applyPerm(state, perm);
}

export function applyAlgFacelets(state, alg) {
  let next = state;
  for (const move of tokenizeAlg(alg)) {
    if (move.slash || move.sq1) continue;
    const name = moveTokenName(move);
    next = applyMoveName(next, name);
  }
  return next;
}

export function moveTokenName(move) {
  const suffix = move.turns === 2 ? '2' : move.turns === 3 ? "'" : '';
  if ('MES'.includes(move.face) && !move.wide) return `${move.face}${suffix}`;
  if ('XYZ'.includes(move.face)) return `${move.face.toLowerCase()}${suffix}`;
  if (move.depth >= 3) return `${move.depth}${move.face}w${suffix}`;
  if (move.wide) return `${move.face}w${suffix}`;
  return `${move.face}${suffix}`;
}

export const MOVE_NAMES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];

export function edgeSlotsFacelets() {
  const stickers = labeledSolved();
  return EDGE_SLOTS.map((slot) => {
    const parts = cubieStickers(stickers, slot.pos).map((s) => ({
      id: s.id,
      color: s.color,
      nx: s.nx,
      ny: s.ny,
      nz: s.nz,
    }));
    return { id: slot.id, name: slot.name, parts };
  });
}

export function cornerSlotsFacelets() {
  const stickers = labeledSolved();
  return CORNER_SLOTS.map((slot) => ({
    id: slot.id,
    name: slot.name,
    parts: cubieStickers(stickers, slot.pos).map((s) => ({ id: s.id, color: s.color, nx: s.nx, ny: s.ny, nz: s.nz })),
  }));
}
