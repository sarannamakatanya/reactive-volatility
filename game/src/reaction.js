// reaction.js — the reaction engine. Pure functions only: given a brew
// specification, compute what the reaction will do. Nothing here touches
// the DOM or the game state, so the whole system can be tested in Node.
//
// A brew is: 2 or 3 ingredients in a chosen ORDER, a flame, an optional
// catalyst, and any stabilizations the player has applied. Order is the
// signature mechanic — the first ingredient sets the potion's effect, the
// second sets its trait, and an optional third sets its twist — so the same
// ingredients in a different order make a different potion.

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
// Below this volatility a reaction cannot run away. Above it, every extra
// point of volatility is one percent of runaway chance.
export const RUNAWAY_THRESHOLD = 40;
// One stabilization cools the cauldron by this much volatility and costs
// this much of the potion's quality. A brew can only be stabilized once —
// otherwise the strongest brews could always be made perfectly safe, and
// the push-vs-stabilize choice would vanish.
export const STABILIZE_VOL_DROP = 25;
export const STABILIZE_QUALITY_KEEP = 0.85;
export const MAX_STABILIZATIONS = 1;
// The actual quality wobbles by this much either way when the brew lands,
// so a brew is never perfectly predictable.
export const QUALITY_JITTER = 5;

/**
 * The affinity of a reaction, from its first two ingredients.
 * Same element twice is Pure, opposites are Violent, anything else is
 * Harmonious. The third ingredient (the finisher) does not change it.
 */
export function affinityOf(first, second) {
  if (first.element === second.element) return AFFINITIES.pure;
  if (OPPOSITES[first.element] === second.element) return AFFINITIES.violent;
  return AFFINITIES.harmonious;
}

/**
 * The name of the potion a brew makes, from its ingredients in order.
 * Two ingredients: "Trait Effect" (Burning Ignition).
 * Three ingredients: "Trait Effect of Twist" (Burning Ignition of Rime).
 */
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

/**
 * Predict a brew. spec is:
 *   { ingredients: [id, id, id?], temperature: 'low'|'med'|'high',
 *     catalyst: 'none'|'salt'|'wild', stabilizations: number }
 * Returns the full prediction: effect, trait, twist, name, affinity,
 * quality (before the brew-time wobble), volatility, runaway chance in
 * percent, and the coin value the potion would sell for.
 */
export function computeReaction(spec) {
  const ingredients = spec.ingredients.map(ingredientById);
  const temp = TEMPERATURES[spec.temperature];
  const catalyst = CATALYSTS[spec.catalyst];
  const stabilizations = spec.stabilizations ?? 0;
  const affinity = affinityOf(ingredients[0], ingredients[1]);

  const potencySum = ingredients.reduce((sum, ing) => sum + ing.potency, 0);
  const avgPotency = potencySum / ingredients.length;
  const sizeBonus = 1 + 0.15 * ingredients.length;
  const stabilizeKeep = STABILIZE_QUALITY_KEEP ** stabilizations;

  let quality = avgPotency * sizeBonus * affinity.qualityMult
    * temp.qualityMult * catalyst.qualityMult * 12;
  quality = Math.max(0, Math.min(100, quality));
  // Stabilizing costs quality AFTER the cap, so even a maxed-out brew
  // pays for cooling down — otherwise stabilizing a strong brew would
  // be free, and the push-vs-stabilize tension would vanish at the top.
  quality = Math.max(0, Math.min(100, Math.round(quality * stabilizeKeep)));

  let volatility = affinity.volChange + temp.volChange + catalyst.volChange
    + (ingredients.length === 3 ? 5 : 0)
    - stabilizations * STABILIZE_VOL_DROP;
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
    value: Math.round(quality * 0.5),
    ingredients: ingredients.map((ing) => ing.name),
  };
}

/**
 * Actually brew it. Applies the quality wobble and rolls for a runaway.
 * rng is a function returning [0, 1); pass a seeded one to test.
 * Returns { success, potion, runaway, rolled } — potion is null on a
 * runaway, and `rolled` is the 0-99 roll that decided it.
 */
export function brewReaction(spec, rng = Math.random) {
  const prediction = computeReaction(spec);
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
    value: Math.round(quality * 0.5),
  };
  return { success: true, potion, runaway: false, rolled, prediction };
}
