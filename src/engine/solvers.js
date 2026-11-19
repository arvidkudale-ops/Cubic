import {
  MOVE_NAMES,
  applyMoveName,
  cornerSlotsFacelets,
  edgeSlotsFacelets,
  simplifyAlg,
  solvedFacelets,
} from './cube.js';

const EDGES = edgeSlotsFacelets();
const CORNERS = cornerSlotsFacelets();
const SOLVED = solvedFacelets();

const FACE_OF = MOVE_NAMES.map((name) => name[0]);

const SLOT_BY_NAME = Object.fromEntries(EDGES.map((e) => [e.name, e.id]));

function normalFace(part) {
  if (part.ny === 1) return 'U';
  if (part.ny === -1) return 'D';
  if (part.nx === 1) return 'R';
  if (part.nx === -1) return 'L';
  if (part.nz === 1) return 'F';
  return 'B';
}

function edgeColors(state, slot) {
  return EDGES[slot].parts.map((part) => String.fromCharCode(state[part.id]));
}

function pieceSlot(state, colorA, colorB) {
  const key = [colorA, colorB].sort().join('');
  for (let slot = 0; slot < 12; slot += 1) {
    const colors = edgeColors(state, slot);
    if (colors.slice().sort().join('') === key) return { slot, colors };
  }
  return null;
}

const CROSS_PIECES = {
  U: [['U', 'F'], ['U', 'R'], ['U', 'B'], ['U', 'L']],
  D: [['D', 'F'], ['D', 'R'], ['D', 'B'], ['D', 'L']],
  F: [['F', 'U'], ['F', 'R'], ['F', 'D'], ['F', 'L']],
  B: [['B', 'U'], ['B', 'R'], ['B', 'D'], ['B', 'L']],
  R: [['R', 'U'], ['R', 'F'], ['R', 'D'], ['R', 'B']],
  L: [['L', 'U'], ['L', 'F'], ['L', 'D'], ['L', 'B']],
};

function goalSlot(target, other) {
  const name = [target, other].sort().join('');
  const alias = {
    DF: 'DF', DR: 'DR', DB: 'DB', DL: 'DL',
    UF: 'UF', UR: 'UR', UB: 'UB', UL: 'UL',
    FR: 'FR', FL: 'FL', BR: 'BR', BL: 'BL',
  };
  const sorted = name;
  const table = {
    DF: 'DF', FD: 'DF', DR: 'DR', RD: 'DR', DB: 'DB', BD: 'DB', DL: 'DL', LD: 'DL',
    UF: 'UF', FU: 'UF', UR: 'UR', RU: 'UR', UB: 'UB', BU: 'UB', UL: 'UL', LU: 'UL',
    FR: 'FR', RF: 'FR', FL: 'FL', LF: 'FL', BR: 'BR', RB: 'BR', BL: 'BL', LB: 'BL',
  };
  return SLOT_BY_NAME[table[sorted] || alias[sorted]];
}

function edgeHome(state, slot, target, color, other) {
  for (const part of EDGES[slot].parts) {
    const face = normalFace(part);
    const expected = face === target ? color : other;
    if (state[part.id] !== expected.charCodeAt(0)) return false;
  }
  return true;
}

export function isCrossSolved(state, color = 'U', target = 'D') {
  for (const [a, b] of CROSS_PIECES[color]) {
    const other = a === color ? b : a;
    const slot = goalSlot(target, other);
    if (!edgeHome(state, slot, target, color, other)) return false;
  }
  return true;
}

function crossKey(state, color) {
  let key = 0;
  for (const [a, b] of CROSS_PIECES[color]) {
    const found = pieceSlot(state, a, b);
    const ori = found.colors[0] === (a === color ? a : b) ? 0 : 1;
    key = (key << 5) | ((found.slot << 1) | ori);
  }
  return key;
}

function reconstruct(parent, key) {
  const moves = [];
  let cursor = key;
  while (parent.get(cursor)?.move) {
    moves.push(parent.get(cursor).move);
    cursor = parent.get(cursor).prev;
  }
  return moves.reverse();
}

export function solveCross(state, { color = 'U', target = 'D', maxNodes = 250000 } = {}) {
  if (isCrossSolved(state, color, target)) return { moves: [], nodes: 0 };
  const startKey = `${crossKey(state, color)}`;
  const queue = [state];
  const keys = [startKey];
  const parent = new Map([[startKey, { prev: null, move: null }]]);
  let nodes = 0;
  let head = 0;
  while (head < queue.length && nodes < maxNodes) {
    const current = queue[head];
    const currentKey = keys[head];
    head += 1;
    const lastFace = parent.get(currentKey).move?.[0] || '';
    for (let m = 0; m < MOVE_NAMES.length; m += 1) {
      const move = MOVE_NAMES[m];
      if (move[0] === lastFace) continue;
      nodes += 1;
      const next = applyMoveName(current, move);
      if (isCrossSolved(next, color, target)) {
        return { moves: [...reconstruct(parent, currentKey), move], nodes };
      }
      const key = `${crossKey(next, color)}`;
      if (!parent.has(key)) {
        parent.set(key, { prev: currentKey, move });
        queue.push(next);
        keys.push(key);
      }
    }
  }
  return { moves: null, nodes, reason: 'No cross solution within the search limit.' };
}

function idsMatch(state, parts) {
  return parts.every((part) => state[part.id] === SOLVED[part.id]);
}

export function maskSolved(state, edgeIds, cornerIds) {
  return edgeIds.every((id) => idsMatch(state, EDGES[id].parts))
    && cornerIds.every((id) => idsMatch(state, CORNERS[id].parts));
}

function ida(start, goal, { maxDepth = 8, nodeLimit = 400000, heuristic = () => 0, order = null } = {}) {
  const rank = order || heuristic;
  let nodes = 0;
  let limited = false;
  let total = 0;
  const dfs = (state, depth, bound, lastFace, path) => {
    if (goal(state)) return path;
    const h = heuristic(state);
    if (depth + h > bound) return null;
    if (depth === bound) return null;
    const ranked = [];
    for (let m = 0; m < MOVE_NAMES.length; m += 1) {
      const move = MOVE_NAMES[m];
      if (move[0] === lastFace) continue;
      const next = applyMoveName(state, move);
      ranked.push({ move, next, h: rank(next) });
    }
    ranked.sort((a, b) => a.h - b.h);
    for (const choice of ranked) {
      nodes += 1;
      total += 1;
      if (nodes > nodeLimit) {
        limited = true;
        return null;
      }
      const found = dfs(choice.next, depth + 1, bound, choice.move[0], path.concat(choice.move));
      if (found) return found;
      if (limited) return null;
    }
    return null;
  };
  for (let bound = 0; bound <= maxDepth; bound += 1) {
    nodes = 0;
    limited = false;
    const found = dfs(start, 0, bound, '', []);
    if (found) return { moves: found, nodes: total };
    if (limited && bound === maxDepth) break;
  }
  return {
    moves: null,
    nodes: total,
    reason: limited
      ? 'Search stopped at the node limit before a solution was found.'
      : `No solution within ${maxDepth} moves.`,
  };
}

const F2L_SLOTS = [
  { name: 'FR', edge: 8, corner: 4 },
  { name: 'FL', edge: 9, corner: 5 },
  { name: 'BR', edge: 11, corner: 7 },
  { name: 'BL', edge: 10, corner: 6 },
];

const CROSS_EDGES = {
  D: [4, 5, 6, 7],
  U: [0, 1, 2, 3],
};

function unsolvedCount(state, edgeIds, cornerIds) {
  let bad = 0;
  edgeIds.forEach((id) => { if (!idsMatch(state, EDGES[id].parts)) bad += 1; });
  cornerIds.forEach((id) => { if (!idsMatch(state, CORNERS[id].parts)) bad += 1; });
  return bad;
}

export function solveXCross(state, { color = 'U', target = 'D', pair = 'FR', maxDepth = 8, nodeLimit = 500000 } = {}) {
  const slot = F2L_SLOTS.find((s) => s.name === pair) || F2L_SLOTS[0];
  const crossEdges = CROSS_EDGES[target] || CROSS_EDGES.D;
  const goal = (next) => isCrossSolved(next, color, target) && maskSolved(next, [slot.edge], [slot.corner]);
  if (goal(state)) return { moves: [], nodes: 0, pair: slot.name };
  return {
    ...ida(state, goal, {
      maxDepth,
      nodeLimit,
      heuristic: (next) => Math.ceil(unsolvedCount(next, [...crossEdges, slot.edge], [slot.corner]) / 4),
    }),
    pair: slot.name,
  };
}

function placementKey(state, edgeIds, cornerIds) {
  let key = 0;
  for (const piece of edgeIds) {
    const wantA = SOLVED[EDGES[piece].parts[0].id];
    const wantB = SOLVED[EDGES[piece].parts[1].id];
    for (let slot = 0; slot < 12; slot += 1) {
      const a = state[EDGES[slot].parts[0].id];
      const b = state[EDGES[slot].parts[1].id];
      if ((a === wantA && b === wantB) || (a === wantB && b === wantA)) {
        key = key * 24 + slot * 2 + (a === wantA ? 0 : 1);
        break;
      }
    }
  }
  for (const piece of cornerIds) {
    const wants = CORNERS[piece].parts.map((part) => SOLVED[part.id]).sort().join(',');
    for (let slot = 0; slot < 8; slot += 1) {
      const gots = CORNERS[slot].parts.map((part) => state[part.id]);
      if (gots.slice().sort().join(',') !== wants) continue;
      const twist = gots.indexOf(CORNERS[piece].parts[0] ? SOLVED[CORNERS[piece].parts[0].id] : gots[0]);
      key = key * 32 + slot * 4 + (twist < 0 ? 0 : twist);
      break;
    }
  }
  return key;
}

function bfsPieces(start, edgeIds, cornerIds, maxNodes) {
  if (maskSolved(start, edgeIds, cornerIds)) return { moves: [], nodes: 0 };
  const startKey = placementKey(start, edgeIds, cornerIds);
  const queue = [start];
  const keys = [startKey];
  const parent = new Map([[startKey, { prev: null, move: null }]]);
  let head = 0;
  let nodes = 0;
  while (head < queue.length && nodes < maxNodes) {
    const current = queue[head];
    const currentKey = keys[head];
    head += 1;
    const lastFace = parent.get(currentKey).move?.[0] || '';
    for (let m = 0; m < MOVE_NAMES.length; m += 1) {
      const move = MOVE_NAMES[m];
      if (move[0] === lastFace) continue;
      nodes += 1;
      const next = applyMoveName(current, move);
      if (maskSolved(next, edgeIds, cornerIds)) {
        return { moves: [...reconstruct(parent, currentKey), move], nodes };
      }
      const key = placementKey(next, edgeIds, cornerIds);
      if (!parent.has(key)) {
        parent.set(key, { prev: currentKey, move });
        queue.push(next);
        keys.push(key);
      }
    }
  }
  return { moves: null, nodes, reason: 'Search stopped at the node limit before a solution was found.' };
}

export function solveBlock(state, edgeIds, cornerIds, options = {}) {
  return bfsPieces(state, edgeIds, cornerIds, options.nodeLimit ?? 400000);
}

export function solve2x2x2(state, which = 'DBL') {
  const blocks = {
    DBL: { edges: [7, 6, 10], corners: [6] },
    DBR: { edges: [7, 4, 11], corners: [7] },
    DFL: { edges: [5, 6, 9], corners: [5] },
    DFR: { edges: [5, 4, 8], corners: [4] },
  };
  const block = blocks[which] || blocks.DBL;
  return { ...solveBlock(state, block.edges, block.corners, { maxDepth: 7, nodeLimit: 400000 }), block: which };
}

function solveStaged(state, stages, nodeLimit = 250000) {
  let current = state;
  const moves = [];
  let nodes = 0;
  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i];
    const found = bfsPieces(current, stage.edges, stage.corners, nodeLimit);
    nodes += found.nodes || 0;
    if (!found.moves) {
      return {
        moves: moves.length ? moves : null,
        partial: moves.length > 0,
        nodes,
        reason: found.reason || `No solution for stage ${i + 1}.`,
      };
    }
    found.moves.forEach((move) => { current = applyMoveName(current, move); });
    moves.push(...found.moves);
  }
  return { moves, nodes };
}

export function solveRouxS1(state, side = 'L') {
  const stages = side === 'R'
    ? [
      { edges: [4], corners: [] },
      { edges: [4, 11], corners: [7] },
      { edges: [4, 11, 8], corners: [7, 4] },
    ]
    : [
      { edges: [6], corners: [] },
      { edges: [6, 10], corners: [6] },
      { edges: [6, 10, 9], corners: [6, 5] },
    ];
  return { ...solveStaged(state, stages, 300000), side };
}

export function solveRouxBlocks(state) {
  const first = solveRouxS1(state, 'L');
  if (!first.moves) return { moves: null, reason: first.reason, stage: 'S1' };
  let mid = state;
  first.moves.forEach((move) => { mid = applyMoveName(mid, move); });
  const second = solveRouxS1(mid, 'R');
  if (!second.moves) return { moves: first.moves, partial: true, reason: `First block solved. Second block: ${second.reason}`, stage: 'S2' };
  return { moves: [...first.moves, ...second.moves], nodes: first.nodes + second.nodes };
}

function edgeFlipCount(state) {
  let bad = 0;
  for (let slot = 0; slot < 12; slot += 1) {
    const parts = EDGES[slot].parts;
    const colors = parts.map((part) => String.fromCharCode(state[part.id]));
    const ud = colors.findIndex((c) => c === 'U' || c === 'D');
    if (ud >= 0) {
      if (parts[ud].ny === 0) bad += 1;
    } else {
      const fb = colors.findIndex((c) => c === 'F' || c === 'B');
      if (fb >= 0 && parts[fb].nz === 0) bad += 1;
    }
  }
  return bad;
}

function edgesOriented(state) {
  return edgeFlipCount(state) === 0;
}

const EO_SAFE = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F2', 'B2'];

function bfsUntil(start, goal, moves, maxNodes) {
  if (goal(start)) return { moves: [], nodes: 0, state: start };
  const queue = [start];
  const parent = new Map([[faceKey(start), { prev: null, move: null }]]);
  let head = 0;
  let nodes = 0;
  while (head < queue.length && nodes < maxNodes) {
    const current = queue[head];
    head += 1;
    const currentKey = faceKey(current);
    const lastFace = parent.get(currentKey).move?.[0] || '';
    for (const move of moves) {
      if (move[0] === lastFace) continue;
      nodes += 1;
      const next = applyMoveName(current, move);
      const key = faceKey(next);
      if (parent.has(key)) continue;
      parent.set(key, { prev: currentKey, move });
      if (goal(next)) {
        const list = [...reconstruct(parent, currentKey), move];
        return { moves: list, nodes, state: next };
      }
      queue.push(next);
    }
  }
  return { moves: null, nodes, reason: 'Search stopped at the node limit before a solution was found.' };
}

function faceKey(state) {
  return String.fromCharCode(...state);
}

export function solveEOLine(state) {
  let current = state;
  const moves = [];
  let nodes = 0;
  let guard = 0;
  while (edgeFlipCount(current) > 0 && guard < 10) {
    guard += 1;
    const before = edgeFlipCount(current);
    const step = bfsUntil(current, (next) => edgeFlipCount(next) < before, MOVE_NAMES, 80000);
    nodes += step.nodes || 0;
    if (!step.moves) return { moves: moves.length ? moves : null, partial: moves.length > 0, nodes, reason: step.reason };
    step.moves.forEach((move) => { current = applyMoveName(current, move); });
    moves.push(...step.moves);
  }
  const line = bfsUntil(current, (next) => maskSolved(next, [5, 7], []), EO_SAFE, 200000);
  nodes += line.nodes || 0;
  if (!line.moves) {
    return { moves, partial: true, nodes, reason: `Edges oriented. DF/DB line: ${line.reason}` };
  }
  return { moves: [...moves, ...line.moves], nodes };
}

export function solveCrossF2L(state, { color = 'U', target = 'D' } = {}) {
  const cross = solveCross(state, { color, target });
  if (!cross.moves) return cross;
  let current = state;
  const moves = [...cross.moves];
  let nodes = cross.nodes;
  cross.moves.forEach((move) => { current = applyMoveName(current, move); });
  const order = ['FR', 'FL', 'BR', 'BL'];
  for (const name of order) {
    const slot = F2L_SLOTS.find((s) => s.name === name);
    const preservedEdges = [...(CROSS_EDGES[target] || CROSS_EDGES.D)];
    const preservedCorners = [];
    for (const done of order) {
      if (done === name) break;
      const prev = F2L_SLOTS.find((s) => s.name === done);
      preservedEdges.push(prev.edge);
      preservedCorners.push(prev.corner);
    }
    const goal = (next) => maskSolved(next, [...preservedEdges, slot.edge], [...preservedCorners, slot.corner]);
    if (goal(current)) continue;
    const found = ida(current, goal, {
      maxDepth: 8,
      nodeLimit: 250000,
      heuristic: (next) => Math.ceil(unsolvedCount(next, [slot.edge], [slot.corner]) / 2),
    });
    nodes += found.nodes;
    if (!found.moves) {
      return {
        moves,
        partial: true,
        nodes,
        reason: `Cross solved. ${name} pair was not found within the search limit.`,
      };
    }
    found.moves.forEach((move) => { current = applyMoveName(current, move); });
    moves.push(...found.moves);
  }
  return { moves, nodes };
}

export function solvePetrus(state) {
  const first = solve2x2x2(state, 'DBL');
  if (!first.moves) return first;
  let mid = state;
  first.moves.forEach((move) => { mid = applyMoveName(mid, move); });
  const extended = solveBlock(mid, [7, 6, 10, 5, 9], [6, 5], { maxDepth: 7, nodeLimit: 400000 });
  if (!extended.moves) {
    return { moves: first.moves, partial: true, reason: `2x2x2 solved. 2x2x3 extension: ${extended.reason}` };
  }
  return { moves: [...first.moves, ...extended.moves], nodes: (first.nodes || 0) + extended.nodes };
}

export function solveZZF2L(state) {
  const line = solveEOLine(state, { maxDepth: 6, nodeLimit: 400000 });
  if (!line.moves) return { ...line, stage: 'EOLine' };
  let mid = state;
  line.moves.forEach((move) => { mid = applyMoveName(mid, move); });
  const rest = solveCrossF2L(mid, { color: 'U', target: 'D' });
  if (!rest.moves) return { moves: line.moves, partial: true, reason: rest.reason, stage: 'F2L' };
  return { moves: [...line.moves, ...rest.moves], partial: Boolean(rest.partial), reason: rest.reason, nodes: (line.nodes || 0) + (rest.nodes || 0) };
}

export function eoLineDone(state) {
  return edgeFlipCount(state) === 0 && maskSolved(state, [5, 7], []);
}

export function describeSolution(result) {
  if (!result) return { status: 'empty', text: 'No scramble loaded.' };
  if (!result.moves) return { status: 'unsolved', text: result.reason || 'No solution found.' };
  const cleaned = simplifyAlg(result.moves.join(' ')).split(/\s+/).filter(Boolean);
  if (!cleaned.length) return { status: 'solved', text: 'Already solved.', moves: [] };
  return {
    status: result.partial ? 'partial' : 'solved',
    text: result.partial ? result.reason : `${cleaned.length} moves`,
    moves: cleaned,
    partial: Boolean(result.partial),
  };
}
