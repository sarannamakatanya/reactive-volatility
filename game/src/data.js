// data.js — the static tables for Reactive Volatility (M1). No logic,
// only facts the engine and UI read. An ingredient goes in the cauldron;
// a catalyst changes how the reaction behaves instead of adding an effect.

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

export const OPPOSITES = {
  fire: 'cold',
  cold: 'fire',
  light: 'shadow',
  shadow: 'light',
  air: 'earth',
  earth: 'air',
};

export const EFFECTS = {
  fire: { name: 'Ignition', desc: 'A fire potion. Burns, heats, ignites.' },
  cold: { name: 'Frost', desc: 'A cold potion. Chills, freezes, preserves.' },
  earth: { name: 'Growth', desc: 'An earth potion. Grows, roots, mends.' },
  air: { name: 'Gale', desc: 'An air potion. Swift, light, freeing.' },
  shadow: { name: 'Umbral', desc: 'A shadow potion. Veils, hides, decays.' },
  light: { name: 'Radiance', desc: 'A light potion. Bright, pure, revealing.' },
};

export const TRAITS = {
  fire: 'Burning',
  cold: 'Chilling',
  earth: 'Rooted',
  air: 'Swift',
  shadow: 'Veiled',
  light: 'Bright',
};

export const TWISTS = {
  fire: 'Ember',
  cold: 'Rime',
  earth: 'Bloom',
  air: 'Tempest',
  shadow: 'Shade',
  light: 'Dawn',
};

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

// contract. Matching earns affinity Gems; never required for fulfilment.
export const DEMAND_AFFINITIES = ['pure', 'harmonious', 'violent'];

// Gem reward on fulfilment (frozen; speed DROPPED 2026-11-18, no
export const GEM_REWARD = {
  quality: 2,
  affinity: 2,
  scaling: [1.0, 1.5, 2.0],
};

export const CLIENTS = [
  { name: 'The Brass Merchant', want: 'needs a potion for the winter fair.' },
  { name: 'Madame Vex', want: 'collects rare effects. Pays well.' },
  { name: 'The Clockmaker', want: 'needs something precise, and soon.' },
  { name: 'Sister Anselm', want: 'asks for the abbey’s stores.' },
  { name: 'The Drowned Sailor', want: 'will pay in salvaged coin.' },
  { name: 'Baron Crowe', want: 'demands the best, and pays for it.' },
];

export const CONTRACT_TIERS = [
  { label: 'Modest', minQuality: 55 },
  { label: 'Demanding', minQuality: 70 },
  { label: 'Exacting', minQuality: 85 },
];

export function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id) ?? null;
}
