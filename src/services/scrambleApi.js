import { eventById } from '../data/events.js';
import { trainingScramble } from '../engine/training.js';
import { eventScramble, hashSeed, mulberry32 } from '../engine/puzzles.js';

let scrambleModule;

async function official(eventId) {
  if (!scrambleModule) scrambleModule = await import('cubing/scramble');
  const alg = await scrambleModule.randomScrambleForEvent(eventId);
  return alg.toString();
}

export async function createScramble(eventId, settings, rng = Math.random) {
  const training = settings?.scramble?.training;
  if (training?.mode && training.mode !== 'off' && eventId.startsWith('333') && eventId !== '333mbf') {
    const random = typeof rng === 'function' ? rng : Math.random;
    const result = trainingScramble(training.mode, random, training);
    const pre = settings.scramble.preMoves?.trim();
    return {
      scramble: pre ? `${pre}\n${result.scramble}` : result.scramble,
      caseName: result.caseName,
      source: 'training',
    };
  }
  if (eventId === '333mbf') {
    const count = settings?.scramble?.mbfCount || 5;
    try {
      const lines = [];
      for (let i = 0; i < count; i += 1) lines.push(`${i + 1}. ${await official('333')}`);
      return { scramble: lines.join('\n'), source: 'random-state' };
    } catch {
      return { scramble: eventScramble(eventId, Math.random, { mbfCount: count }), source: 'random-move' };
    }
  }
  const preferOfficial = settings?.scramble?.useRandomState !== false && eventId !== '333mbf';
  if (preferOfficial) {
    try {
      let text = await official(eventId);
      const pre = settings?.scramble?.preMoves?.trim();
      if (pre) text = `${pre}\n${text}`;
      return { scramble: text, source: 'random-state' };
    } catch {
      /* official worker unavailable; random-move fallback below */
    }
  }
  const random = typeof rng === 'function' ? { next: rng } : null;
  const fn = random ? () => random.next() : Math.random;
  const text = eventScramble(eventId, fn, {
    fast444: settings?.scramble?.fast444,
    mbfCount: settings?.scramble?.mbfCount || 5,
  });
  return { scramble: text, source: 'random-move' };
}

export function seededScramble(eventId, seed, count = 1) {
  const rng = mulberry32(hashSeed(`${seed}|${eventId}`));
  const list = [];
  for (let i = 0; i < count; i += 1) list.push(eventScramble(eventId, rng));
  return list;
}

export function puzzleOf(eventId) {
  return eventById(eventId).puzzle;
}
