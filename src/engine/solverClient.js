let worker;
let nextId = 1;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./solverWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const { id, described, error } = event.data;
      const resolve = pending.get(id);
      pending.delete(id);
      resolve?.({ described, error });
    };
    worker.onerror = (event) => {
      const message = event.message || 'The solver could not start.';
      pending.forEach((resolve) => resolve({ error: message }));
      pending.clear();
    };
  }
  return worker;
}

export function requestSolve(kind, scramble, options) {
  const id = nextId;
  nextId += 1;
  getWorker().postMessage({ id, kind, scramble, options });
  return new Promise((resolve) => pending.set(id, resolve));
}
