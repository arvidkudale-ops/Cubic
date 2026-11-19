/** Stackmat Gen2/Gen3 (9-byte) and Gen4 (10-byte) packet parser plus a 1200 baud decoder. */

const STATUS = {
  I: 'Idle',
  A: 'Ready',
  ' ': 'Running',
  S: 'Stopped',
  L: 'Left hand',
  R: 'Right hand',
  C: 'Both hands',
};

export function describeStackmatStatus(code) {
  return STATUS[code] || 'Unknown';
}

export function handsFromStatus(code) {
  return {
    left: code === 'L' || code === 'C' || code === 'A',
    right: code === 'R' || code === 'C' || code === 'A',
    both: code === 'C' || code === 'A',
  };
}

function digitsOf(chars) {
  if (![...chars].every((ch) => ch >= '0' && ch <= '9')) return null;
  return [...chars].map((ch) => ch.charCodeAt(0) - 48);
}

/** Parse one packet. Returns null when the checksum or framing is wrong. */
export function parseStackmatBytes(bytes) {
  const chars = bytes.map((b) => String.fromCharCode(b));
  if (chars.length < 9) return null;
  const cr = chars.indexOf('\r');
  const slice = cr >= 7 ? chars.slice(0, cr) : chars.slice(0, chars[chars.length - 1] === '\n' ? -1 : chars.length);
  const body = slice[slice.length - 1] === '\n' ? slice.slice(0, -1) : slice;
  if (body.length !== 7 && body.length !== 8) return null;
  const status = body[0];
  if (!STATUS[status] && status !== ' ') return null;
  const digitChars = body.slice(1, body.length - 1);
  const digits = digitsOf(digitChars);
  if (!digits) return null;
  const checksum = body[body.length - 1].charCodeAt(0);
  const expected = 64 + digits.reduce((sum, n) => sum + n, 0);
  if (checksum !== expected) return null;
  let ms;
  if (digits.length === 5) {
    const minutes = digits[0];
    const seconds = digits[1] * 10 + digits[2];
    const centis = digits[3] * 10 + digits[4];
    ms = (minutes * 60 + seconds) * 1000 + centis * 10;
  } else {
    const minutes = digits[0];
    const seconds = digits[1] * 10 + digits[2];
    const millis = digits[3] * 100 + digits[4] * 10 + digits[5];
    ms = (minutes * 60 + seconds) * 1000 + millis;
  }
  return { status, ms, generation: digits.length === 6 ? 4 : 3, hands: handsFromStatus(status) };
}

export function encodeStackmat(status, ms, generation = 3) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor(ms / 1000) % 60;
  const digits = generation === 4
    ? [minutes, Math.floor(seconds / 10), seconds % 10, Math.floor((ms % 1000) / 100), Math.floor((ms % 100) / 10), ms % 10]
    : [minutes, Math.floor(seconds / 10), seconds % 10, Math.floor((ms % 1000) / 100), Math.floor((ms % 100) / 10)];
  const checksum = 64 + digits.reduce((sum, n) => sum + n, 0);
  return [status.charCodeAt(0), ...digits.map((n) => 48 + n), checksum, 13, 10];
}

/**
 * Decode 8N1 serial bits from a microphone buffer.
 * Stackmat timers present the RS-232 line as an audio waveform. Both polarities are tried.
 */
export function decodeStackmatSamples(samples, sampleRate) {
  const bitLen = sampleRate / 1200;
  const packets = [];
  for (const sign of [1, -1]) {
    let i = 0;
    const bytes = [];
    while (i < samples.length - bitLen * 10) {
      const level = samples[i] * sign;
      const next = samples[Math.min(samples.length - 1, Math.floor(i + 1))] * sign;
      if (!(level > 0 && next <= 0)) {
        i += 1;
        continue;
      }
      const start = i;
      const bits = [];
      let ok = true;
      for (let b = 0; b < 10; b += 1) {
        const at = Math.floor(start + (b + 0.5) * bitLen);
        if (at >= samples.length) { ok = false; break; }
        bits.push(samples[at] * sign > 0 ? 1 : 0);
      }
      if (!ok || bits[0] !== 0 || bits[9] !== 1) {
        i += 1;
        continue;
      }
      let byte = 0;
      for (let b = 0; b < 8; b += 1) byte |= bits[b + 1] << b;
      bytes.push(byte);
      i = Math.floor(start + 10 * bitLen);
    }
    for (let n = 0; n + 8 < bytes.length; n += 1) {
      const parsed = parseStackmatBytes(bytes.slice(n, n + 10));
      if (parsed) {
        packets.push(parsed);
        break;
      }
    }
    if (packets.length) break;
  }
  return packets[0] || null;
}

export function stackmatSignalLevel(samples) {
  if (!samples?.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

const stackmatListeners = new Set();
export function onStackmat(listener) {
  stackmatListeners.add(listener);
  return () => stackmatListeners.delete(listener);
}
export function emitStackmat(packet) {
  stackmatListeners.forEach((listener) => listener(packet));
}

export async function openStackmat(onPacket, onLevel) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser cannot access a microphone for Stackmat audio.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const gain = context.createGain();
  gain.gain.value = 0;
  const node = context.createScriptProcessor(4096, 1, 1);
  let leftover = new Float32Array(0);
  node.onaudioprocess = (event) => {
    const chunk = event.inputBuffer.getChannelData(0);
    onLevel?.(stackmatSignalLevel(chunk));
    const merged = new Float32Array(leftover.length + chunk.length);
    merged.set(leftover);
    merged.set(chunk, leftover.length);
    const packet = decodeStackmatSamples(merged, context.sampleRate);
    if (packet) onPacket(packet);
    const keep = Math.floor(context.sampleRate * 0.08);
    leftover = merged.slice(Math.max(0, merged.length - keep));
  };
  source.connect(node);
  node.connect(gain);
  gain.connect(context.destination);
  return {
    context,
    async close() {
      node.disconnect();
      source.disconnect();
      gain.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      await context.close();
    },
  };
}
