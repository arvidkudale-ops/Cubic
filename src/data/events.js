export const EVENTS = [
  { id: '222', label: '2x2', puzzle: '2x2x2', group: 'NxN' },
  { id: '333', label: '3x3', puzzle: '3x3x3', group: 'NxN' },
  { id: '444', label: '4x4', puzzle: '4x4x4', group: 'NxN' },
  { id: '555', label: '5x5', puzzle: '5x5x5', group: 'NxN' },
  { id: '666', label: '6x6', puzzle: '6x6x6', group: 'NxN' },
  { id: '777', label: '7x7', puzzle: '7x7x7', group: 'NxN' },
  { id: '333oh', label: '3x3 OH', puzzle: '3x3x3', group: '3x3' },
  { id: '333bf', label: '3x3 BLD', puzzle: '3x3x3', group: '3x3' },
  { id: '333fm', label: '3x3 FMC', puzzle: '3x3x3', group: '3x3' },
  { id: '333mbf', label: '3x3 MBLD', puzzle: '3x3x3', group: '3x3', multi: true },
  { id: '444bf', label: '4x4 BLD', puzzle: '4x4x4', group: 'Blind' },
  { id: '555bf', label: '5x5 BLD', puzzle: '5x5x5', group: 'Blind' },
  { id: 'pyram', label: 'Pyraminx', puzzle: 'pyraminx', group: 'Other' },
  { id: 'minx', label: 'Megaminx', puzzle: 'megaminx', group: 'Other' },
  { id: 'skewb', label: 'Skewb', puzzle: 'skewb', group: 'Other' },
  { id: 'sq1', label: 'Square-1', puzzle: 'square1', group: 'Other' },
  { id: 'clock', label: 'Clock', puzzle: 'clock', group: 'Other' },
];

export function eventById(id) {
  return EVENTS.find((event) => event.id === id) || EVENTS[1];
}

export const EVENT_GROUPS = ['NxN', '3x3', 'Blind', 'Other'];

export const TOOL_CATALOG = [
  { id: 'draw', name: 'Draw scramble', category: 'Scramble', icon: 'Box' },
  { id: 'generator', name: 'Scramble generator', category: 'Scramble', icon: 'List' },
  { id: 'common', name: 'Common scramble', category: 'Scramble', icon: 'Share2' },
  { id: 'stats', name: 'Statistics', category: 'Statistics', icon: 'Sigma' },
  { id: 'crossSession', name: 'Cross-session stats', category: 'Statistics', icon: 'Columns2' },
  { id: 'trend', name: 'Time trend', category: 'Statistics', icon: 'LineChart' },
  { id: 'distribution', name: 'Time distribution', category: 'Statistics', icon: 'BarChart3' },
  { id: 'daily', name: 'Daily statistics', category: 'Statistics', icon: 'Calendar' },
  { id: 'confirm', name: 'Confirm time', category: 'Solves', icon: 'CheckCheck' },
  { id: 'cross', name: 'Cross solver', category: 'Solvers', icon: 'Plus' },
  { id: 'xcross', name: 'X-cross solver', category: 'Solvers', icon: 'Puzzle' },
  { id: 'block', name: '2x2x2 block', category: 'Solvers', icon: 'Square' },
  { id: 'roux', name: 'Roux S1', category: 'Solvers', icon: 'Layers' },
  { id: 'roux2', name: 'Roux S1 + S2', category: 'Solvers', icon: 'Layers' },
  { id: 'eoline', name: 'EOLine', category: 'Solvers', icon: 'Minus' },
  { id: 'zz', name: 'EOLine + ZZF2L', category: 'Solvers', icon: 'Workflow' },
  { id: 'f2l', name: 'Cross + F2L', category: 'Solvers', icon: 'Component' },
  { id: 'petrus', name: 'Petrus', category: 'Solvers', icon: 'Boxes' },
  { id: 'sq1', name: 'Square-1', category: 'Solvers', icon: 'Circle' },
  { id: 'pyram', name: 'Pyraminx', category: 'Solvers', icon: 'Triangle' },
  { id: 'skewb', name: 'Skewb', category: 'Solvers', icon: 'Diamond' },
  { id: 'metronome', name: 'Metronome', category: 'Other', icon: 'AudioLines' },
  { id: 'stackmat', name: 'Stackmat', category: 'Other', icon: 'Timer' },
  { id: 'bluetooth', name: 'Bluetooth cube', category: 'Other', icon: 'Bluetooth' },
];
