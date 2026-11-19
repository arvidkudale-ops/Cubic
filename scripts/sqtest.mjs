import { hashSeed, invertSq1, mulberry32, sq1Scramble, sq1Solved, sq1Trace } from '../src/engine/puzzles.js';

for (const sample of ['(1,0)', '(1,2) / (-3,4)', '/ (2,-2) /']) {
  const inverse = invertSq1(sample);
  console.log(sample, '=>', inverse, sq1Solved(`${sample} ${inverse}`), sq1Trace(`${sample} ${inverse}`).join(' | '));
}
const rng = mulberry32(hashSeed('cubic-sq1'));
for (let i = 0; i < 8; i += 1) {
  const scramble = sq1Scramble(rng);
  const inverse = invertSq1(scramble);
  const check = sq1Solved(`${scramble} ${inverse}`);
  console.log(scramble);
  console.log(inverse, check);
  if (!check) {
    console.log(sq1Trace(`${scramble} ${inverse}`).join(' | '));
    process.exit(1);
  }
}
console.log('sq1 shape solver ok');
