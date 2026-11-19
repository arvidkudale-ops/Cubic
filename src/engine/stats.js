import { effectiveMs } from './time.js';

function byWorst(a, b) {
  const av = a.dnf ? Infinity : a.ms;
  const bv = b.dnf ? Infinity : b.ms;
  return av - bv;
}

/**
 * WCA-style average. `trim` results are removed from each end.
 * More DNFs than `trim` makes the average a DNF.
 */
export function trimmedAverage(solves, trim = 1) {
  if (!solves.length) return null;
  const rows = solves.map((solve, index) => {
    const ms = effectiveMs(solve);
    return { ms: ms ?? Infinity, dnf: ms == null, index };
  });
  const dnfCount = rows.filter((r) => r.dnf).length;
  if (dnfCount > trim) return { dnf: true };
  if (trim === 0) {
    if (dnfCount > 0) return { dnf: true };
    const sum = rows.reduce((s, r) => s + r.ms, 0);
    return { ms: sum / rows.length, dnf: false };
  }
  if (rows.length <= trim * 2) return null;
  const sorted = [...rows].sort(byWorst);
  const kept = sorted.slice(trim, sorted.length - trim);
  if (kept.some((r) => r.dnf)) return { dnf: true };
  const sum = kept.reduce((s, r) => s + r.ms, 0);
  return { ms: sum / kept.length, dnf: false };
}

export function averageOf(solves, size, trim) {
  if (solves.length < size) return null;
  const usedTrim = trim == null ? (size >= 5 ? 1 : 0) : trim;
  return trimmedAverage(solves.slice(-size), usedTrim);
}

export function meanOf(solves, size) {
  if (size && solves.length < size) return null;
  const window = size ? solves.slice(-size) : solves;
  return trimmedAverage(window, 0);
}

export function bestRolling(solves, size, trim) {
  if (solves.length < size) return null;
  let best = null;
  let bestIndex = -1;
  for (let i = size; i <= solves.length; i += 1) {
    const window = solves.slice(i - size, i);
    const avg = trimmedAverage(window, trim);
    if (!avg || avg.dnf) continue;
    if (!best || avg.ms < best.ms) {
      best = avg;
      bestIndex = i - 1;
    }
  }
  return best ? { ...best, index: bestIndex } : null;
}

export function bestSingle(solves) {
  let best = null;
  let index = -1;
  solves.forEach((solve, i) => {
    const ms = effectiveMs(solve);
    if (ms == null) return;
    if (best == null || ms < best) {
      best = ms;
      index = i;
    }
  });
  return best == null ? null : { ms: best, index };
}

export function sessionMean(solves) {
  const ok = solves.map(effectiveMs).filter((ms) => ms != null);
  if (!ok.length) return null;
  return ok.reduce((s, n) => s + n, 0) / ok.length;
}

export function standardDeviation(solves) {
  const ok = solves.map(effectiveMs).filter((ms) => ms != null);
  if (ok.length < 2) return null;
  const mean = ok.reduce((s, n) => s + n, 0) / ok.length;
  const variance = ok.reduce((s, n) => s + (n - mean) ** 2, 0) / (ok.length - 1);
  return Math.sqrt(variance);
}

export function countPenalties(solves) {
  return {
    total: solves.length,
    ok: solves.filter((s) => s.penalty !== 'plus2' && s.penalty !== 'dnf').length,
    plus2: solves.filter((s) => s.penalty === 'plus2').length,
    dnf: solves.filter((s) => s.penalty === 'dnf').length,
  };
}

/** Largest successful time that still beats `targetMs` for the next rolling average. */
export function timeToBeat(previous, size, trim, targetMs) {
  if (targetMs == null || previous.length < size - 1) return null;
  const base = previous.slice(-(size - 1));
  let lo = 0;
  let hi = Math.max(targetMs * 3, 120000);
  let best = null;
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2;
    const probe = [...base, { time: mid, penalty: 'ok' }];
    const avg = trimmedAverage(probe, trim);
    if (avg && !avg.dnf && avg.ms < targetMs) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

export function histogram(solves, binSeconds = 1) {
  const bin = Math.max(0.1, binSeconds) * 1000;
  const buckets = new Map();
  solves.forEach((solve) => {
    const ms = effectiveMs(solve);
    if (ms == null) return;
    const key = Math.floor(ms / bin) * bin;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([start, count]) => ({
      start,
      label: (start / 1000).toFixed(bin >= 1000 ? 0 : 1),
      count,
    }));
}

export function groupByDay(solves) {
  const days = new Map();
  solves.forEach((solve) => {
    const d = new Date(solve.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(solve);
  });
  return [...days.entries()].map(([date, list]) => ({
    date,
    count: list.length,
    mean: sessionMean(list),
    best: bestSingle(list)?.ms ?? null,
  }));
}

export function rollingSeries(solves, size, trim) {
  const points = [];
  for (let i = 0; i < solves.length; i += 1) {
    const ms = effectiveMs(solves[i]);
    let avg = null;
    if (i + 1 >= size) {
      const window = trimmedAverage(solves.slice(i + 1 - size, i + 1), trim);
      if (window && !window.dnf) avg = window.ms;
    }
    points.push({
      index: i + 1,
      time: ms,
      avg,
      date: solves[i].date,
    });
  }
  return points;
}

export function summarize(solves, { trim = 1, customAo = 100 } = {}) {
  const single = bestSingle(solves);
  const ao5 = averageOf(solves, 5, 1);
  const ao12 = averageOf(solves, 12, 1);
  const mo3 = meanOf(solves, 3);
  const bestAo5 = bestRolling(solves, 5, 1);
  const bestAo12 = bestRolling(solves, 12, 1);
  const aoN = averageOf(solves, customAo, Math.max(1, Math.round(customAo * 0.05)));
  const bestAoN = bestRolling(solves, customAo, Math.max(1, Math.round(customAo * 0.05)));
  const current = solves.length ? effectiveMs(solves[solves.length - 1]) : null;
  return {
    count: countPenalties(solves),
    current,
    mean: sessionMean(solves),
    sd: standardDeviation(solves),
    single,
    ao5,
    ao12,
    mo3,
    bestAo5,
    bestAo12,
    aoN,
    bestAoN,
    timeToBeatAo5: bestAo5 ? timeToBeat(solves, 5, 1, bestAo5.ms) : null,
    timeToBeatAo12: bestAo12 ? timeToBeat(solves, 12, 1, bestAo12.ms) : null,
  };
}

export function isPersonalBestSingle(solves, index) {
  const ms = effectiveMs(solves[index]);
  if (ms == null) return false;
  for (let i = 0; i < index; i += 1) {
    const prev = effectiveMs(solves[i]);
    if (prev != null && prev <= ms) return false;
  }
  return true;
}
