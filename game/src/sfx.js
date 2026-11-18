// sfx.js — synthesized SFX, no audio files (M3 + rework dialogue/arrival).
// Recipes are data; one player unlocks AudioContext on first gesture,
// routes all through one compressed master bus, mutes via master gain.

/** Sound recipes: s, Hz, gain 0..1. */
export const RECIPES = {
  // Short square blip for every button press / key action (cap 2, gap 80 ms).
  click: {
    layers: [{ src: 'square', freq: [1200, 900], dur: 0.06, attack: 0.002, gain: 0.15 }],
  },
  brew: {
    layers: [
      { src: 'noise', dur: 0.5, attack: 0.01, gain: 0.25, filter: { type: 'lowpass', freq: [400, 1200] } },
      { src: 'sine', freq: [180, 180], dur: 0.5, attack: 0.01, gain: 0.2 },
    ],
  },
  // Coin chime: two sine notes (E5 -> B5) + a short noise clink. Fulfilment only.
  fulfil: {
    layers: [
      { src: 'sine', notes: [0, 7], base: 659.25, step: 0.15, dur: 0.4, attack: 0.002, gain: 0.3 },
      { src: 'noise', dur: 0.05, attack: 0.001, gain: 0.15, filter: { type: 'highpass', freq: [3000, 3000] } },
    ],
  },
  runaway: {
    layers: [
      { src: 'noise', dur: 0.8, attack: 0.004, gain: 0.35, filter: { type: 'lowpass', freq: [2000, 200], q: 0.7 } },
      { src: 'sawtooth', freq: [300, 80], dur: 0.8, attack: 0.004, gain: 0.25 },
    ],
  },
  win: {
    layers: [{ src: 'sine', notes: [0, 4, 7], base: 523.25, step: 0.15, dur: 0.9, attack: 0.003, gain: 0.3 }],
  },
  lose: {
    layers: [{ src: 'triangle', notes: [0, -4, -7], base: 440, step: 0.15, dur: 0.9, attack: 0.003, gain: 0.3 }],
  },
  dialogue: {
    layers: [{ src: 'square', freq: [1000, 750], dur: 0.05, attack: 0.002, gain: 0.08 }],
  },
  arrival: {
    layers: [{ src: 'sine', notes: [0, 7], base: 523.25, step: 0.12, dur: 0.35, attack: 0.003, gain: 0.12 }],
  },
};

export const LIMITS = {
  default: { max: 4, gap: 0.03 },
  click: { max: 2, gap: 0.08 },
};

const SOURCES = new Set(['sine', 'square', 'sawtooth', 'triangle', 'noise']);

/** Validate one recipe (errors, empty = valid). */
export function validateRecipe(name, r) {
  const errors = [];
  if (!r || !Array.isArray(r.layers) || r.layers.length === 0) return [`${name}: needs layers`];
  r.layers.forEach((l, i) => {
    const at = `${name}.layers[${i}]`;
    if (!SOURCES.has(l.src)) errors.push(`${at}: unknown src ${l.src}`);
    if (!(l.dur > 0 && l.dur <= 5)) errors.push(`${at}: dur must be in (0, 5] s`);
    if (!(l.attack > 0 && l.attack < l.dur)) errors.push(`${at}: attack must be > 0 and shorter than dur`);
    if (!(l.gain > 0 && l.gain <= 1)) errors.push(`${at}: gain must be in (0, 1]`);
    if (l.src !== 'noise' && !l.freq && !l.notes) errors.push(`${at}: oscillator needs freq or notes`);
    if (l.notes && !(l.base > 0 && l.step > 0)) errors.push(`${at}: notes need base and step`);
    if (l.notes && l.notes.length * l.step > l.dur) errors.push(`${at}: notes run past dur`);
    for (const f of [...(l.freq || []), ...(l.filter?.freq || [])]) {
      if (!(f >= 20 && f <= 20000)) errors.push(`${at}: frequency ${f} outside 20..20000 Hz`);
    }
  });
  const sum = r.layers.reduce((s, l) => s + l.gain, 0);
  if (sum > 1.4) errors.push(`${name}: layer gains add up to ${sum.toFixed(2)} (> 1.4 clips easily)`);
  return errors;
}

export function validateAllRecipes(recipes) {
  const errors = [];
  for (const [name, r] of Object.entries(recipes)) errors.push(...validateRecipe(name, r));
  return errors;
}

/** Attack then cubic decay to silence at dur (offline envelope model). Returns 0..1. */
export function envelopeAt(t, layer) {
  if (t <= 0 || t >= layer.dur) return 0;
  if (t < layer.attack) return t / layer.attack;
  const k = (t - layer.attack) / (layer.dur - layer.attack);
  return (1 - k) ** 3;
}

export const semitone = (f, n) => f * 2 ** (n / 12);
export const dbToGain = (db) => 10 ** (db / 20);

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vary pitch/level. */
export function vary(recipe, rand, { cents = 60, db = 1.5 } = {}) {
  const p = 2 ** (((rand() * 2 - 1) * cents) / 1200);
  const g = dbToGain((rand() * 2 - 1) * db);
  return {
    layers: recipe.layers.map((l) => ({
      ...l,
      gain: Math.min(1, l.gain * g),
      freq: l.freq && l.freq.map((f) => f * p),
      base: l.base && l.base * p,
    })),
  };
}

export class VoiceLimiter {
  constructor(limits = LIMITS, globalMax = 24) {
    this.limits = limits;
    this.globalMax = globalMax;
    this.voices = [];
  }
  /** Returns { ok, steal } where steal is the voice to stop, or ok=false to skip this sound. */
  request(name, now, dur) {
    const lim = this.limits[name] || this.limits.default;
    this.voices = this.voices.filter((v) => v.end > now);
    const same = this.voices.filter((v) => v.name === name);
    if (same.length && now - same[same.length - 1].start < lim.gap) return { ok: false, reason: 'too soon' };
    let steal = null;
    if (same.length >= lim.max) steal = same[0];
    else if (this.voices.length >= this.globalMax) steal = this.voices[0];
    if (steal) this.voices.splice(this.voices.indexOf(steal), 1);
    const voice = { name, start: now, end: now + dur };
    this.voices.push(voice);
    return { ok: true, steal, voice };
  }
}

export const recipeDuration = (r) => Math.max(...r.layers.map((l) => l.dur));


// The noise buffer is cached per context — never re-created per play (GC spikes).
const noiseCache = new WeakMap();
function noiseBuffer(ctx) {
  if (!noiseCache.has(ctx)) {
    const len = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    const r = rng(7);
    for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
    noiseCache.set(ctx, b);
  }
  return noiseCache.get(ctx);
}

/** Schedule one recipe at `when` into `destination`. Returns stop(). */
export function playRecipe(ctx, recipe, { when = ctx.currentTime, destination = ctx.destination, gain = 1 } = {}) {
  const out = ctx.createGain();
  out.gain.value = gain;
  out.connect(destination);
  const nodes = [];
  for (const l of recipe.layers) {
    const env = ctx.createGain();
    const end = when + l.dur;
    // Never ramp exponentially to 0 (it throws) and never start at full
    env.gain.setValueAtTime(0.0001, when);
    env.gain.linearRampToValueAtTime(l.gain, when + l.attack);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    let head = env;
    if (l.filter) {
      const f = ctx.createBiquadFilter();
      f.type = l.filter.type;
      f.Q.value = l.filter.q ?? 1;
      f.frequency.setValueAtTime(l.filter.freq[0], when);
      f.frequency.exponentialRampToValueAtTime(l.filter.freq[1], end);
      f.connect(env);
      head = f;
    }
    env.connect(out);
    let src;
    if (l.src === 'noise') {
      src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      src.loop = true;
    } else {
      src = ctx.createOscillator();
      src.type = l.src;
      if (l.notes) {
        l.notes.forEach((n, i) => src.frequency.setValueAtTime(semitone(l.base, n), when + i * l.step));
      } else {
        src.frequency.setValueAtTime(l.freq[0], when);
        src.frequency.exponentialRampToValueAtTime(l.freq[1], end);
      }
    }
    src.connect(head);
    src.start(when);
    src.stop(end + 0.02);
    nodes.push(src);
  }
  const last = nodes[nodes.length - 1];
  if (last) last.onended = () => { out.disconnect(); };
  return () => {
    const t = ctx.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setTargetAtTime(0, t, 0.01);
  };
}

/** Game-facing SFX API: master bus, lazy unlock, variation, mute. */
export function createSfx({ recipes = RECIPES, limits = LIMITS, seed = 1, AudioContextClass = globalThis.AudioContext } = {}) {
  let ctx = null;
  let master = null;
  let muted = false;
  const limiter = new VoiceLimiter(limits);
  const rand = rng(seed);
  const stops = new Map();
  const played = []; // in-memory play log (newest last, capped) for tests and debugging
  const api = {
    get state() { return ctx ? ctx.state : 'off'; },
    isMuted() { return muted; },
    /** The AudioContext (null before unlock) — a test seam for advancing fake time. */
    context() { return ctx; },
    /** Names of sounds played, in order (capped at the last 50). */
    played() { return [...played]; },
    /** Master gain node value (0 when muted, 1 when not) — null before unlock. */
    masterGain() { return master ? master.gain.value : null; },
    /** Call from a pointerdown / keydown handler (autoplay policy). Safe to call many times. */
    unlock() {
      if (!ctx) {
        if (typeof AudioContextClass !== 'function') return { ok: false, reason: 'unavailable' };
        ctx = new AudioContextClass();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.ratio.value = 4;
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(comp);
        comp.connect(ctx.destination);
      }
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume();
      return { ok: true };
    },
    mute(on = !muted) {
      muted = on;
      if (master) master.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.02);
      return muted;
    },
    play(name, o = {}) {
      if (!ctx || ctx.state !== 'running') return { ok: false, reason: 'locked' };
      const recipe = recipes[name];
      if (!recipe) throw new Error(`unknown sound ${name}`);
      const r = limiter.request(name, ctx.currentTime, recipeDuration(recipe));
      if (!r.ok) return r;
      if (r.steal) stops.get(r.steal)?.();
      stops.set(r.voice, playRecipe(ctx, vary(recipe, rand), { destination: master }));
      played.push(name);
      if (played.length > 50) played.shift();
      return { ok: true };
    },
    voices: () => limiter.voices.length,
  };
  return api;
}
