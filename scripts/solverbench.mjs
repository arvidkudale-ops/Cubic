import { applyAlg, applyAlgFacelets, faceletsFromStickers, newCube } from '../src/engine/cube.js';
import { eoLineDone, maskSolved, solve2x2x2, solveEOLine, solveRouxS1 } from '../src/engine/solvers.js';

const st = faceletsFromStickers(applyAlg(newCube(), "F R U B L D F' R2 U"));
const block = solve2x2x2(st, 'DBL');
let s = st;
for (const move of block.moves || []) s = applyAlgFacelets(s, move);
console.log('2x2', block.moves, block.moves ? maskSolved(s, [7, 6, 10], [6]) : block.reason, block.nodes);

const roux = solveRouxS1(st, 'L');
s = st;
for (const move of roux.moves || []) s = applyAlgFacelets(s, move);
console.log('roux', roux.moves, roux.moves ? maskSolved(s, [6, 9, 10], [5, 6]) : roux.reason, roux.nodes);

const eo = solveEOLine(st);
s = st;
for (const move of eo.moves || []) s = applyAlgFacelets(s, move);
console.log('eo', eo.moves, eo.moves ? eoLineDone(s) : eo.reason, eo.nodes);
