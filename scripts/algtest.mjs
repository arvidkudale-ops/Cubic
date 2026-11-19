import { applyAlg, f2lSolved, invertAlg, isSolved, newCube, ollSolved } from '../src/engine/cube.js';
import { OLL_ALGS, PLL_ALGS } from '../src/engine/algs.js';

function check(name, alg, pll) {
  const setup = applyAlg(newCube(), invertAlg(alg));
  if (!f2lSolved(setup)) return `${name} breaks F2L`;
  if (isSolved(setup)) return `${name} is identity`;
  if (pll && !ollSolved(setup)) return `${name} disturbs orientation`;
  if (!pll && ollSolved(setup)) return `${name} is a PLL, not an OLL`;
  if (!isSolved(applyAlg(setup, alg))) return `${name} does not solve`;
  return null;
}

let failed = 0;
for (const [name, alg] of PLL_ALGS) {
  const err = check(name, alg, true);
  if (err) { failed += 1; console.log('PLL', err); }
}
for (const [name, alg] of OLL_ALGS) {
  const err = check(name, alg, false);
  if (err) { failed += 1; console.log('OLL', err); }
}
if (failed) {
  console.log(`${failed} algs failed`);
  process.exit(1);
}
console.log(`algs ok: ${PLL_ALGS.length} PLL, ${OLL_ALGS.length} OLL`);
