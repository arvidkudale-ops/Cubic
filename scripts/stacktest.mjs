import { decodeStackmatSamples, encodeStackmat, parseStackmatBytes } from '../src/services/stackmat.js';

const packet = encodeStackmat('S', 25270, 3);
const parsed = parseStackmatBytes(packet);
if (parsed.ms !== 25270 || parsed.status !== 'S') throw new Error(JSON.stringify(parsed));
const gen4 = encodeStackmat('A', 12258, 4);
const parsed4 = parseStackmatBytes(gen4);
if (parsed4.ms !== 12258 || parsed4.generation !== 4) throw new Error(JSON.stringify(parsed4));

function synth(bytes, sampleRate = 44100) {
  const bitLen = sampleRate / 1200;
  const bits = [1, 1, 1, 1, 1, 1, 1, 1];
  bytes.forEach((byte) => {
    bits.push(0);
    for (let i = 0; i < 8; i += 1) bits.push((byte >> i) & 1);
    bits.push(1);
  });
  const samples = [];
  bits.forEach((bit) => {
    const count = Math.round(bitLen);
    for (let i = 0; i < count; i += 1) samples.push(bit ? 0.4 : -0.4);
  });
  return Float32Array.from(samples);
}

const heard = decodeStackmatSamples(synth(packet), 44100);
if (!heard || heard.ms !== 25270) throw new Error(`decode ${JSON.stringify(heard)}`);
console.log('stackmat codec ok', heard);
