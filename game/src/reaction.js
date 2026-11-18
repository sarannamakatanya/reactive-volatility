// reaction.js — the reaction engine. Pure functions only: given a brew
// spec, compute what the reaction does. Nothing touches the DOM or game
// state, so the system is testable in Node. A brew is 2-3 ingredients in
// a chosen ORDER, a flame, an optional catalyst, and stabilizations.

import {
  AFFINITIES,
  CATALYSTS,
  EFFECTS,
  OPPOSITES,
  TEMPERATURES,
  TRAITS,
  TWISTS,
  ingredientById,
} from './data.js';

export const MIN_INGREDIENTS = 2;
export const MAX_INGREDIENTS = 3;
export const RUNAWAY_THRESHOLD = 40;
export const STABILIZE_VOL_DROP = 25;
export const STABILIZE_QUALITY_KEEP = 0.85;
export const MAX_STABILIZATIONS = 1;
// so a brew is never perfectly predictable.
export const QUALITY_JITTER = 5;

/** Affinity from the first two ingredients: same element Pure, opposites Violent, else Harmonious. */
export function affinityOf(first, second) {
  if (first.element === second.element) return AFFINITIES.pure;
  if (OPPOSITES[first.element] === second.element) return AFFINITIES.violent;
  return AFFINITIES.harmonious;
}

/** Potion name from ingredients in order: "Trait Effect" or "Trait Effect of Twist". */
export function potionName(ingredients) {
  const first = ingredients[0];
  const second = ingredients[1];
  const effect = EFFECTS[first.element].name;
  const trait = TRAITS[second.element];
  if (ingredients.length >= 3) {
    const twist = TWISTS[ingredients[2].element];
    return `${trait} ${effect} of ${twist}`;
  }
  return `${trait} ${effect}`;
}

/** Predict a brew: effect/trait/twist, name, affinity, quality, volatility, runaway %, value. */
export function computeReaction(spec, mods) {
  const ingredients = spec.ingredients.map(ingredientById);
  const temp = TEMPERATURES[spec.temperature];
  const catalyst = CATALYSTS[spec.catalyst];
  const stabilizations = spec.stabilizations ?? 0;
  const affinity = affinityOf(ingredients[0], ingredients[1]);

  const potencySum = ingredients.reduce((sum, ing) => sum + ing.potency, 0);
  const avgPotency = potencySum / ingredients.length;
  const sizeBonus = 1 + 0.15 * ingredients.length;
  const stabilizeKeep = (mods?.stabKeepValue ?? STABILIZE_QUALITY_KEEP) ** stabilizations;

  let quality = avgPotency * sizeBonus * affinity.qualityMult
    * temp.qualityMult * catalyst.qualityMult * 12;
  quality = Math.max(0, Math.min(100, quality));
  // Stabilizing costs quality AFTER the cap, so even a maxed-out brew
  quality = Math.max(0, Math.min(100, Math.round(quality * stabilizeKeep)));
  quality = Math.max(0, Math.min(100, quality + (mods?.qAdd ?? 0)));

  let volatility = affinity.volChange + temp.volChange + catalyst.volChange
    + (ingredients.length === 3 ? 5 : 0)
    - stabilizations * STABILIZE_VOL_DROP
    + (mods?.vAdd ?? 0);
  volatility = Math.max(0, Math.min(100, volatility));

  const runawayChance = Math.max(0, volatility - RUNAWAY_THRESHOLD);

  return {
    effect: EFFECTS[ingredients[0].element].name,
    effectKey: ingredients[0].element,
    effectDesc: EFFECTS[ingredients[0].element].desc,
    trait: TRAITS[ingredients[1].element],
    twist: ingredients.length >= 3 ? TWISTS[ingredients[2].element] : null,
    name: potionName(ingredients),
    affinity: affinity.name,
    affinityDesc: affinity.desc,
    quality,
    volatility,
    runawayChance,
    value: Math.round(quality * 0.5 * (1 + (mods?.saleBonus ?? 0))),
    ingredients: ingredients.map((ing) => ing.name),
  };
}

/** Brew it: quality wobble + runaway roll. rng returns [0, 1). */
export function brewReaction(spec, rng = Math.random, mods) {
  const prediction = computeReaction(spec, mods);
  const jitter = Math.floor(rng() * (QUALITY_JITTER * 2 + 1)) - QUALITY_JITTER;
  const quality = Math.max(0, Math.min(100, prediction.quality + jitter));
  const rolled = Math.floor(rng() * 100);
  const runaway = rolled < prediction.runawayChance;

  if (runaway) {
    return { success: false, potion: null, runaway: true, rolled, prediction };
  }
  const potion = {
    ...prediction,
    quality,
    value: Math.round(quality * 0.5 * (1 + (mods?.saleBonus ?? 0))),
  };
  return { success: true, potion, runaway: false, rolled, prediction };
}
