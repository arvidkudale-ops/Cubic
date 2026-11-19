import { CMLL_ALGS, OLL_ALGS, PLL_ALGS } from './algs.js';
import { invertAlg, simplifyAlg } from './cube.js';
import { eventScramble } from './puzzles.js';

const AUFS = ['', 'U', "U'", 'U2'];
const YAWS = ['', 'y', 'y2', "y'"];

function pick(rng, list, weights) {
  if (!weights) return list[Math.floor(rng() * list.length)];
  const total = list.reduce((sum, item) => sum + (weights[item[0]] || 1), 0);
  let cursor = rng() * total;
  for (const item of list) {
    cursor -= weights[item[0]] || 1;
    if (cursor <= 0) return item;
  }
  return list[list.length - 1];
}

export function trainingScramble(mode, rng, { cases = [], distribution = 'uniform', weights = {}, colorNeutral = false } = {}) {
  if (mode === 'cross' || mode === 'xcross' || mode === 'eoline') {
    const length = mode === 'cross' ? 12 : 20;
    return { scramble: eventScramble('333', rng, { length }), caseName: mode };
  }
  if (mode === 'f2l') {
    const faces = ['R', 'U'];
    const moves = [];
    let last = '';
    const count = 5 + Math.floor(rng() * 4);
    for (let i = 0; i < count; i += 1) {
      let face = faces[Math.floor(rng() * faces.length)];
      if (face === last) face = face === 'R' ? 'U' : 'R';
      last = face;
      moves.push(face + ['', "'", '2'][Math.floor(rng() * 3)]);
    }
    return { scramble: simplifyAlg(moves.join(' ')), caseName: 'FR slot' };
  }
  const library = mode === 'pll' ? PLL_ALGS : mode === 'oll' ? OLL_ALGS : mode === 'cmll' || mode === 'zbll' ? (mode === 'zbll' ? null : CMLL_ALGS) : PLL_ALGS;
  if (mode === 'zbll') {
    const oll = pick(rng, OLL_ALGS.filter(([name]) => ['Sune', 'Antisune', 'Pi', 'H', 'U headlights', 'U mirror', 'L', 'L mirror'].includes(name)));
    const pll = pick(rng, PLL_ALGS);
    const auf = AUFS[Math.floor(rng() * AUFS.length)];
    const scramble = simplifyAlg(invertAlg([pll[1], oll[1], auf].filter(Boolean).join(' ')));
    return { scramble, caseName: `${oll[0]} + ${pll[0]}` };
  }
  let pool = library;
  if (cases.length) {
    const filtered = library.filter(([name]) => cases.includes(name));
    if (filtered.length) pool = filtered;
  }
  const weightMap = distribution === 'weighted' ? weights : null;
  const [name, alg] = pick(rng, pool, weightMap);
  const prefix = [
    colorNeutral ? YAWS[Math.floor(rng() * YAWS.length)] : '',
    AUFS[Math.floor(rng() * AUFS.length)],
  ].filter(Boolean).join(' ');
  const scramble = simplifyAlg([prefix, invertAlg(alg)].filter(Boolean).join(' '));
  return { scramble, caseName: name };
}
