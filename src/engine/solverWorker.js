import { applyAlgFacelets, solvedFacelets } from './cube.js';
import { invertSq1 } from './puzzles.js';
import {
  describeSolution,
  solve2x2x2,
  solveCross,
  solveCrossF2L,
  solveEOLine,
  solvePetrus,
  solveRouxBlocks,
  solveRouxS1,
  solveXCross,
  solveZZF2L,
} from './solvers.js';

const kinds = {
  cross: (state, options) => solveCross(state, options),
  xcross: (state, options) => solveXCross(state, options),
  block: (state, options) => solve2x2x2(state, options?.block || 'DBL'),
  roux: (state, options) => solveRouxS1(state, options?.side || 'L'),
  roux2: (state) => solveRouxBlocks(state),
  eoline: (state) => solveEOLine(state),
  f2l: (state, options) => solveCrossF2L(state, options),
  petrus: (state) => solvePetrus(state),
  zz: (state) => solveZZF2L(state),
};

self.onmessage = (event) => {
  const { id, kind, scramble, options } = event.data;
  try {
    if (kind === 'sq1') {
      const inverse = invertSq1(scramble);
      self.postMessage({ id, described: { status: 'solved', text: 'Inverse of the scramble. It restores both shape and pieces; it is not claimed to be move-optimal.', moves: inverse.split(/\s+/).filter(Boolean) } });
      return;
    }
    const state = applyAlgFacelets(solvedFacelets(), scramble);
    const result = kinds[kind](state, options || {});
    self.postMessage({ id, described: describeSolution(result) });
  } catch (error) {
    self.postMessage({ id, error: error.message || String(error) });
  }
};
