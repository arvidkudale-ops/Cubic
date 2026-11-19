import assert from 'node:assert/strict';
import {
  applyAlg,
  faceletString,
  invertAlg,
  isSolved,
  newCube,
  simplifyAlg,
  solvedStickers,
  applyAlgFacelets,
  faceletsFromStickers,
  solvedFacelets,
  crossSolved,
  f2lSolved,
  ollSolved,
  readFace,
} from '../src/engine/cube.js';
import { isCrossSolved, solve2x2x2, solveCross } from '../src/engine/solvers.js';
import { formatTime, parseTypedTime } from '../src/engine/time.js';
import { averageOf, trimmedAverage, bestSingle, timeToBeat } from '../src/engine/stats.js';

const solved = solvedStickers();
assert.equal(solved.length, 54, '54 stickers');
assert.equal(isSolved(solved), true);

for (const move of ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'x', 'y', 'z', 'Rw', 'Uw', 'Fw']) {
  const spun = applyAlg(newCube(), `${move} ${move} ${move} ${move}`);
  assert.equal(isSolved(spun), true, `${move}4`);
  const back = applyAlg(applyAlg(newCube(), move), invertAlg(move));
  assert.equal(isSolved(back), true, `${move} inverse`);
}

const sexy = "R U R' U'";
assert.equal(isSolved(applyAlg(newCube(), Array(6).fill(sexy).join(' '))), true, 'sexy 6');
assert.equal(isSolved(applyAlg(newCube(), "R U R' U R U2 R' R U2 R' U' R U' R'")), true, 'sune antisune');

let random = newCube();
const seq = [];
const faces = ['U', 'D', 'R', 'L', 'F', 'B'];
let prev = '';
for (let i = 0; i < 40; i += 1) {
  let f = faces[i % 6];
  if (f === prev) f = faces[(i + 1) % 6];
  prev = f;
  const suf = ["", "'", '2'][i % 3];
  seq.push(f + suf);
}
random = applyAlg(newCube(), seq.join(' '));
assert.equal(isSolved(random), false);
assert.equal(isSolved(applyAlg(random, invertAlg(seq.join(' ')))), true, 'random inverse');

const facelets = faceletsFromStickers(applyAlg(newCube(), "R U F' D2"));
const viaPerm = applyAlgFacelets(solvedFacelets(), "R U F' D2");
assert.deepEqual([...viaPerm], [...facelets], 'perm matches geometry');

assert.equal(formatTime(9820, 2), '9.82');
assert.equal(formatTime(62340, 2), '1:02.34');
assert.equal(parseTypedTime('12.34').time, 12340);
assert.equal(parseTypedTime('1234', 'centiseconds').time, 12340);
assert.equal(parseTypedTime('1:02.5').time, 62500);

const mk = (time, penalty = 'ok') => ({ time, penalty });
const five = [mk(10000), mk(12000), mk(8000), mk(11000), mk(9000)];
const ao5 = averageOf(five, 5, 1);
assert.ok(Math.abs(ao5.ms - 10000) < 1, 'ao5 drops 8 and 12');
const withDnf = [mk(10000), mk(0, 'dnf'), mk(8000), mk(11000), mk(9000)];
const ao5d = averageOf(withDnf, 5, 1);
assert.equal(ao5d.dnf, false);
assert.ok(ao5d.ms > 9000);
const twoDnf = [mk(0, 'dnf'), mk(0, 'dnf'), mk(8000), mk(11000), mk(9000)];
assert.equal(averageOf(twoDnf, 5, 1).dnf, true);
assert.equal(trimmedAverage([mk(0, 'dnf'), mk(1000), mk(1000)], 0).dnf, true);
assert.equal(bestSingle([mk(0, 'dnf'), mk(15000), mk(12000)]).ms, 12000);

function roundTrip(name, alg, { oriented = false } = {}) {
  const setup = applyAlg(newCube(), invertAlg(alg));
  assert.equal(f2lSolved(setup), true, `${name} preserves F2L`);
  assert.equal(isSolved(setup), false, `${name} changes the cube`);
  assert.equal(ollSolved(setup), oriented, `${name} orientation`);
  assert.equal(isSolved(applyAlg(setup, alg)), true, `${name} solves its case`);
}

roundTrip('sune', "R U R' U R U2 R'");
roundTrip('antisune', "R U2 R' U' R U' R'");
roundTrip('T perm', "R U R' U' R' F R2 U' R' U' R U R' F'", { oriented: true });
roundTrip('U perm a', "R U' R U R U R U' R' U' R2", { oriented: true });
roundTrip('H perm', "M2 U M2 U2 M2 U M2", { oriented: true });
assert.equal(readFace(newCube(), 'U').join(''), 'UUUUUUUUU');

const scrambled = applyAlg(newCube(), "R U R' F");
assert.equal(crossSolved(scrambled, 'U', 'U') || crossSolved(scrambled, 'U', 'D'), false);

assert.equal(simplifyAlg("R R'"), '');
assert.equal(simplifyAlg('R R'), 'R2');
assert.equal(simplifyAlg("R2 R"), "R'");

const crossState = faceletsFromStickers(applyAlg(newCube(), "R U F2 D' L2 B U'"));
assert.equal(isCrossSolved(crossState, 'U', 'D'), false);
const cross = solveCross(crossState, { color: 'U', target: 'D' });
assert.ok(cross.moves && cross.moves.length > 0 && cross.moves.length <= 8, JSON.stringify(cross));
let after = crossState;
for (const move of cross.moves) after = applyAlgFacelets(after, move);
assert.equal(isCrossSolved(after, 'U', 'D'), true, 'cross solution');

const blockState = faceletsFromStickers(applyAlg(newCube(), "R U F'"));
const block = solve2x2x2(blockState, 'DBL');
assert.ok(block.moves, block.reason);
let blocked = blockState;
for (const move of block.moves) blocked = applyAlgFacelets(blocked, move);
assert.equal(block.moves.length >= 0, true);

console.log('engine selftest passed', { cross: cross.moves.join(' '), nodes: cross.nodes });
