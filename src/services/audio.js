let context;

function ctx() {
  if (!context) context = new AudioContext();
  if (context.state === 'suspended') context.resume();
  return context;
}

export function beep({ frequency = 880, duration = 0.08, volume = 0.2, type = 'sine' } = {}) {
  const audio = ctx();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.stop(audio.currentTime + duration);
}

export function speak(text, volume = 0.8) {
  if (!window.speechSynthesis) {
    beep({ frequency: 740, duration: 0.12, volume });
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.volume = volume;
  utter.rate = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function createMetronome() {
  let timer = null;
  let elapsedTimer = null;
  return {
    start({ bpm = 120, frequency = 880, volume = 0.25, elapsedMs = 0, onElapsed }) {
      this.stop();
      const interval = 60000 / Math.max(40, bpm);
      const tick = () => beep({ frequency, duration: 0.05, volume, type: 'square' });
      tick();
      timer = setInterval(tick, interval);
      if (elapsedMs > 0 && onElapsed) {
        elapsedTimer = setTimeout(() => {
          beep({ frequency: frequency * 1.5, duration: 0.12, volume });
          onElapsed();
        }, elapsedMs);
      }
    },
    stop() {
      if (timer) clearInterval(timer);
      if (elapsedTimer) clearTimeout(elapsedTimer);
      timer = null;
      elapsedTimer = null;
    },
  };
}
