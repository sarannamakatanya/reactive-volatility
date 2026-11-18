// storage.js — the only place that touches localStorage: the best result
// (contracts/coins, title screen) and the tutorial-done flag. localStorage
// may not exist (Node tests, private browsing) — every access goes through
// a live lookup of globalThis.localStorage and falls back to an in-memory
// map, so the game never throws. Tests inject a fake localStorage.

const memory = new Map();

function store() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function read(key) {
  const s = store();
  if (s) {
    try {
      const v = s.getItem(key);
      return v === null || v === undefined ? null : String(v);
    } catch {
      return memory.has(key) ? memory.get(key) : null;
    }
  }
  return memory.has(key) ? memory.get(key) : null;
}

function write(key, value) {
  const s = store();
  if (s) {
    try {
      s.setItem(key, value);
      return;
    } catch {
    }
  }
  memory.set(key, value);
}

const BEST_KEY = 'rv-best-v1';
const TUTORIAL_DONE_KEY = 'rv-tutorial-done-v1';

/** The best run so far, or null when no run has ended yet. */
export function loadBest() {
  const raw = read(BEST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.contracts === 'number' && typeof parsed?.coins === 'number') return parsed;
  } catch {
  }
  return null;
}

/** Record a finished run. */
export function saveBest(contracts, coins) {
  const prev = loadBest();
  const next = !prev || contracts > prev.contracts || (contracts === prev.contracts && coins > prev.coins)
    ? { contracts, coins }
    : prev;
  write(BEST_KEY, JSON.stringify(next));
  return next;
}

export function isTutorialDone() {
  return read(TUTORIAL_DONE_KEY) === '1';
}

export function setTutorialDone() {
  write(TUTORIAL_DONE_KEY, '1');
}
