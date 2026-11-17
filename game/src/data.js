// data.js — the static tables for Reactive Volatility (M1).
// No logic lives here, only the facts the reaction engine and the UI read.
// An ingredient is one thing you can put in the cauldron. A catalyst is a
// special ingredient that changes how the reaction behaves instead of adding
// an effect of its own.

export const INGREDIENTS = [
  {
    id: 'ember',
    name: 'Ember Root',
    element: 'fire',
    potency: 3,
    color: '#e25822',
    blurb: 'Burns hot. The base of any fire potion.',
  },
  {
    id: 'frost',
    name: 'Frost Petal',
    element: 'cold',
    potency: 3,
    color: '#7fd4ff',
    blurb: 'Cold as a winter morning.',
  },
  {
    id: 'moss',
    name: 'Mosscap',
    element: 'earth',
    potency: 3,
    color: '#6ab04c',
    blurb: 'Grows where nothing else will.',
  },
  {
    id: 'storm',
    name: 'Storm Salt',
    element: 'air',
    potency: 3,
    color: '#f5d76e',
    blurb: 'Crackles with static.',
  },
  {
    id: 'gloom',
    name: 'Gloomshroom',
    element: 'shadow',
    potency: 3,
    color: '#9b59b6',
    blurb: 'Grows in the dark. Potent, but uneasy.',
  },
  {
    id: 'sun',
    name: 'Sunpetal',
    element: 'light',
    potency: 3,
    color: '#ffd700',
    blurb: 'Holds a piece of the sun.',
  },
];

// Opposites clash. Each element has exactly one opposite; the other four
// elements are neither opposite nor identical, so they cooperate.
export const OPPOSITES = {
  fire: 'cold',
  cold: 'fire',
  light: 'shadow',
  shadow: 'light',
  air: 'earth',
  earth: 'air',
};

// What the FIRST ingredient (the base) makes the potion do.
export const EFFECTS = {
  fire: { name: 'Ignition', desc: 'A fire potion. Burns, heats, ignites.' },
  cold: { name: 'Frost', desc: 'A cold potion. Chills, freezes, preserves.' },
  earth: { name: 'Growth', desc: 'An earth potion. Grows, roots, mends.' },
  air: { name: 'Gale', desc: 'An air potion. Swift, light, freeing.' },
  shadow: { name: 'Umbral', desc: 'A shadow potion. Veils, hides, decays.' },
  light: { name: 'Radiance', desc: 'A light potion. Bright, pure, revealing.' },
};

// What the SECOND ingredient (the modifier) adds to the potion.
export const TRAITS = {
  fire: 'Burning',
  cold: 'Chilling',
  earth: 'Rooted',
  air: 'Swift',
  shadow: 'Veiled',
  light: 'Bright',
};

// What the THIRD ingredient (the finisher) twists the potion into.
export const TWISTS = {
  fire: 'Ember',
  cold: 'Rime',
  earth: 'Bloom',
  air: 'Tempest',
  shadow: 'Shade',
  light: 'Dawn',
};

// The flame under the cauldron. Hotter means a stronger potion and a
// wilder reaction.
export const TEMPERATURES = {
  low: {
    id: 'low',
    name: 'Low flame',
    desc: 'Gentle and safe.',
    qualityMult: 0.8,
    volChange: 0,
  },
  med: {
    id: 'med',
    name: 'Medium flame',
    desc: 'A steady burn.',
    qualityMult: 1.0,
    volChange: 10,
  },
  high: {
    id: 'high',
    name: 'High flame',
    desc: 'A roaring fire. Powerful, but wild.',
    qualityMult: 1.3,
    volChange: 30,
  },
};

// Catalysts change how the reaction behaves. They add no effect of their own.
export const CATALYSTS = {
  none: {
    id: 'none',
    name: 'No catalyst',
    desc: 'A plain reaction.',
    qualityMult: 1.0,
    volChange: 0,
  },
  salt: {
    id: 'salt',
    name: 'Stabilizing Salt',
    desc: 'Steadies the reaction. Less volatile, slightly weaker.',
    qualityMult: 0.9,
    volChange: -20,
  },
  wild: {
    id: 'wild',
    name: 'Wildspark',
    desc: 'Doubles the reaction’s power — and its danger.',
    qualityMult: 1.6,
    volChange: 30,
  },
};

// How the first two ingredients get along. This is the affinity of the
// reaction, and it is the main source of both quality and volatility.
// Each affinity carries one display signal (color + icon) so the contract
// card's demanded affinity reads at a glance.
export const AFFINITIES = {
  pure: {
    id: 'pure',
    name: 'Pure',
    desc: 'The same element twice. A focused, pure reaction.',
    qualityMult: 1.25,
    volChange: 5,
    color: '#cdd7ff',
    icon: '✦',
  },
  violent: {
    id: 'violent',
    name: 'Violent',
    desc: 'Opposites clash. Powerful, but dangerous.',
    qualityMult: 1.3,
    volChange: 30,
    color: '#e05d5d',
    icon: '⚡',
  },
  harmonious: {
    id: 'harmonious',
    name: 'Harmonious',
    desc: 'The elements cooperate. Steady and reliable.',
    qualityMult: 1.15,
    volChange: 0,
    color: '#7bc47f',
    icon: '❋',
  },
};

// The affinities a contract can demand, one drawn uniformly at random per
// contract (Alt C model). Matching the demand earns affinity Gems; it is
// never required for fulfilment.
export const DEMAND_AFFINITIES = ['pure', 'harmonious', 'violent'];

// The Gem reward on fulfilment (frozen config, speed DROPPED by Yukarin's
// call 2026-11-18 — there is no early-completion bonus in M1/M4).
// Quality +2 when the brewed quality meets the contract minimum (a
// fulfilment stipend: it fires on 100% of fulfilments), affinity +2 when
// the brewed affinity matches the contract's demanded affinity. Each
// component is multiplied by the contract scaling (by contract index:
// 1st 1.0, 2nd 1.5, 3rd 2.0) and Math.round'ed, so a contract pays
// 4 / 6 / 8 Gems at most, 18 per run. Gems are earned and displayed in M1;
// the spend path (the minimum-viable relic shop) arrives in M4.
export const GEM_REWARD = {
  quality: 2,
  affinity: 2,
  scaling: [1.0, 1.5, 2.0],
};

// The people who want potions. A contract is one client asking for one
// effect at one minimum quality.
export const CLIENTS = [
  { name: 'The Brass Merchant', want: 'needs a potion for the winter fair.' },
  { name: 'Madame Vex', want: 'collects rare effects. Pays well.' },
  { name: 'The Clockmaker', want: 'needs something precise, and soon.' },
  { name: 'Sister Anselm', want: 'asks for the abbey’s stores.' },
  { name: 'The Drowned Sailor', want: 'will pay in salvaged coin.' },
  { name: 'Baron Crowe', want: 'demands the best, and pays for it.' },
];

// Contract difficulty tiers. The reward is the minimum quality doubled,
// so a contract always pays far more than selling the same potion.
// All ingredients share potency 3, so every effect is equally reachable;
// the tiers are tuned so a sensible brew clears Modest, a strong brew
// clears Demanding, and only a pushed (risky) brew clears Exacting.
export const CONTRACT_TIERS = [
  { label: 'Modest', minQuality: 55 },
  { label: 'Demanding', minQuality: 70 },
  { label: 'Exacting', minQuality: 85 },
];

export function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id) ?? null;
}
