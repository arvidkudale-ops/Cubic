/** Format and parse solve times. Internal unit is milliseconds. */

export function formatTime(ms, precision = 2) {
  if (ms == null || Number.isNaN(ms)) return '—';
  const sign = ms < 0 ? '-' : '';
  const abs = Math.abs(ms);
  const decimals = precision === 3 ? 3 : 2;
  const factor = 10 ** decimals;
  const rounded = Math.round(abs * (factor / 1000)) / factor;
  const mins = Math.floor(rounded / 60);
  const secs = rounded - mins * 60;
  const secStr = secs.toFixed(decimals);
  const padded = mins > 0 && secs < 10 ? `0${secStr}` : secStr;
  return mins > 0 ? `${sign}${mins}:${padded}` : `${sign}${secStr}`;
}

export function formatClock(ms, precision = 2) {
  return formatTime(ms, precision);
}

/** Split a formatted time into main digits and the decimal tail. */
export function splitTime(ms, precision = 2) {
  const text = formatTime(ms, precision);
  const dot = text.lastIndexOf('.');
  if (dot < 0) return { main: text, frac: '' };
  return { main: text.slice(0, dot), frac: text.slice(dot) };
}

/**
 * Parse a typed time.
 * unit: how a bare integer is interpreted — seconds, centiseconds, or milliseconds.
 * "12.34" is always seconds. "1:02.34" is minutes.
 */
export function parseTypedTime(raw, unit = 'centiseconds') {
  const text = String(raw).trim().toLowerCase();
  if (!text || text === 'dnf') return { penalty: 'dnf', time: 0 };
  let penalty = 'ok';
  let body = text;
  if (body.endsWith('+2') || body.endsWith('+')) {
    penalty = 'plus2';
    body = body.replace(/\+2?$/, '').trim();
  }
  if (body.includes(':')) {
    const [m, rest] = body.split(':');
    const mins = Number(m);
    const secs = Number(rest);
    if (!Number.isFinite(mins) || !Number.isFinite(secs)) return null;
    return { penalty, time: Math.round((mins * 60 + secs) * 1000) };
  }
  if (body.includes('.')) {
    const secs = Number(body);
    if (!Number.isFinite(secs)) return null;
    return { penalty, time: Math.round(secs * 1000) };
  }
  const n = Number(body);
  if (!Number.isFinite(n)) return null;
  if (unit === 'seconds') return { penalty, time: Math.round(n * 1000) };
  if (unit === 'milliseconds') return { penalty, time: Math.round(n) };
  return { penalty, time: Math.round(n * 10) };
}

export function penaltyLabel(penalty) {
  if (penalty === 'plus2') return '+2';
  if (penalty === 'dnf') return 'DNF';
  return '';
}

export function effectiveMs(solve) {
  if (!solve || solve.penalty === 'dnf') return null;
  return solve.time + (solve.penalty === 'plus2' ? 2000 : 0);
}
