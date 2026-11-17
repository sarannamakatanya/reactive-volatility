// storage.js — the only place that touches localStorage: the best result
// (contracts fulfilled / coins, shown on the title screen, spec §10 step 1)
// and the tutorial-done flag (the tutorial runs by default on the first
// run and is skipped on later runs, spec §6).
//
// localStorage may not exist (Node tests, private browsing) — every
// access goes through a live lookup of globalThis.localStorage and falls
// back to an in-memory map, so the game never throws on storage. Tests
// inject a fake localStorage on globalThis to drive the real path.

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
      // fall through to the in-memory map
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
    // corrupted entry — treat as no best result
  }
  return null;
}

/**
 * Record a finished run's result. The best run is the one with the most
 * contracts fulfilled; ties go to the richer run. Returns the best.
 */
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
