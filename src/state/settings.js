export const DEFAULT_SHORTCUTS = {
  'event-sq1': 'Alt+Digit1',
  'event-222': 'Alt+Digit2',
  'event-333': 'Alt+Digit3',
  'event-444': 'Alt+Digit4',
  'event-555': 'Alt+Digit5',
  'event-666': 'Alt+Digit6',
  'event-777': 'Alt+Digit7',
  'event-pyram': 'Alt+KeyP',
  'event-minx': 'Alt+KeyM',
  'event-clock': 'Alt+KeyC',
  'event-skewb': 'Alt+KeyS',
  'input-scramble': 'Alt+KeyI',
  'delete-session': 'Alt+KeyD',
  'delete-last': 'Alt+KeyZ',
  'prev-session': 'Alt+ArrowUp',
  'next-session': 'Alt+ArrowDown',
  'prev-scramble': 'Alt+ArrowLeft',
  'next-scramble': 'Alt+ArrowRight',
  'penalty-ok': 'Ctrl+Digit1',
  'penalty-plus2': 'Ctrl+Digit2',
  'penalty-dnf': 'Ctrl+Digit3',
  'mode-keyboard': 'Ctrl+Alt+KeyT',
  'mode-typing': 'Ctrl+Alt+KeyI',
  'mode-stackmat': 'Ctrl+Alt+KeyS',
  'mode-virtual': 'Ctrl+Alt+KeyV',
  'mode-bluetooth': 'Ctrl+Alt+KeyG',
  'mode-lastlayer': 'Ctrl+Alt+KeyL',
  'mode-multiphase': 'Ctrl+Alt+KeyM',
};

export const DEFAULT_SETTINGS = {
  version: 1,
  general: {
    language: 'en',
    defaultEvent: '333',
    autoSessionOnEvent: true,
    confirmDestructive: true,
    timerMode: 'keyboard',
    integerUnit: 'centiseconds',
  },
  timer: {
    holdMs: 500,
    precision: 2,
    smallerDecimals: true,
    fontScale: 1,
    color: '#F3F4F6',
    readyColor: '#38D98B',
    hideWhileTiming: false,
    zoom: 1,
    keyboard: true,
    mouse: true,
    touch: true,
    updateHz: 60,
  },
  inspection: {
    enabled: false,
    duration: 15,
    plus2After: 15,
    dnfAfter: 17,
    voice: true,
    volume: 0.8,
    voice8: true,
    voice12: true,
  },
  scramble: {
    fontScale: 1,
    align: 'center',
    mono: true,
    autoSize: true,
    maxHeight: 168,
    autoGenerate: true,
    preMoves: '',
    clickAction: 'copy',
    imageSize: 190,
    showImage: false,
    useRandomState: true,
    fast444: false,
    mbfCount: 5,
    training: {
      mode: 'off',
      cases: [],
      distribution: 'uniform',
      weights: {},
      colorNeutral: false,
    },
  },
  appearance: {
    theme: 'dark',
    accent: '#8B7CFF',
    accent2: '#45D6C5',
    background: '',
    backgroundOpacity: 0.45,
    glow: 0.7,
    radius: 22,
    animations: true,
    uiZoom: 1,
    shadows: true,
  },
  sessions: { autoRename: true, allowClear: true, showSummary: true },
  stats: {
    indicators: ['single', 'ao5', 'ao12', 'best', 'bestAo5'],
    customAo: 100,
    showTarget: true,
    reverseList: false,
    multiDelete: true,
    distBin: 1,
  },
  shortcuts: { enabled: true, bindings: DEFAULT_SHORTCUTS },
  gestures: {
    enabled: true,
    up: 'plus2',
    upLeft: 'dnf',
    upRight: 'ok',
    left: 'prev-scramble',
    right: 'next-scramble',
    down: 'delete-last',
    downLeft: 'comment',
    downRight: 'details',
  },
  tools: { slots: ['draw', 'stats'] },
  virtual: { turnMs: 160, tps: 2, multiPhase: true },
  bluetooth: {
    mode: 'normal',
    markScrambled: 'space',
    beepOnScramble: true,
    showVirtual: true,
    phaseTracking: true,
  },
  stackmat: { useSensorStatus: true },
  data: { autoBackupEvery: 100 },
};

export function mergeSettings(saved) {
  const base = structuredClone(DEFAULT_SETTINGS);
  if (!saved) return base;
  const walk = (target, source) => {
    if (!source || typeof source !== 'object') return target;
    Object.keys(source).forEach((key) => {
      if (Array.isArray(source[key])) target[key] = source[key];
      else if (source[key] && typeof source[key] === 'object') {
        target[key] = walk(target[key] && typeof target[key] === 'object' ? target[key] : {}, source[key]);
      } else if (source[key] !== undefined) target[key] = source[key];
    });
    return target;
  };
  return walk(base, saved);
}
