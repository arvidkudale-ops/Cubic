const cubeListeners = new Set();
export function onCubeMove(listener) {
  cubeListeners.add(listener);
  return () => cubeListeners.delete(listener);
}
export function emitCubeMove(detail) {
  cubeListeners.forEach((listener) => listener(detail));
}

export function bluetoothAvailable() {
  return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
}

export async function connectCube() {
  if (!bluetoothAvailable()) {
    throw new Error('Web Bluetooth is not available in this browser. Chrome or Edge on desktop is required, and the page must be served over localhost or HTTPS.');
  }
  const { connectSmartPuzzle } = await import('cubing/bluetooth');
  const puzzle = await connectSmartPuzzle();
  let battery = null;
  if (typeof puzzle.getBattery === 'function') {
    try { battery = await puzzle.getBattery(); } catch { battery = null; }
  }
  return { puzzle, battery, name: puzzle.name?.() || puzzle.device?.name || 'Smart cube' };
}

export async function connectBluetoothTimer() {
  if (!bluetoothAvailable()) {
    throw new Error('Web Bluetooth is not available in this browser.');
  }
  const { connectSmartTimer } = await import('cubing/bluetooth');
  const timer = await connectSmartTimer();
  timer.startPolling();
  return timer;
}
