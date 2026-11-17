// tutorial.js — the 5-step playable tutorial (spec §6). Each step is a
// tiny brew the player performs, not a wall of text. The tutorial runs
// before the first real contract; its brews are free (they spend no brews
// and no coins) and are recorded in the recipe book like any other brew.
//
// The step logic is pure: recordTutorialBrew takes the tutorial state
// and one brewed reaction ({ spec, outcome } from brewReaction) and
// advances the step's progress. The UI (game.js) only renders the
// current step and its checklist. Runaways brew nothing, so they never
// count toward a step.
//
// Step 5 uses one fixed contract — a Modest Ignition potion at quality
// 55 from the Brass Merchant — so the lesson (effect must match, quality
// must meet the tier, reward = minQuality × 2, non-matches sell for
// quality × 0.5) is the same every time.

import { fulfilsContract } from './contracts.js';

/** The one fixed contract of tutorial step 5 (Modest, Ignition, 55). */
export const TUTORIAL_CONTRACT = {
  id: 0,
  index: 0,
  number: 1,
  client: 'The Brass Merchant',
  want: 'needs a potion for the winter fair.',
  effect: 'Ignition',
  effectKey: 'fire',
  minQuality: 55,
  tier: 'Modest',
  reward: 110,
  demandAffinityKey: 'harmonious',
  demandAffinity: 'Harmonious',
};

export const TUTORIAL_STEPS = [
  {
    id: 'order',
    title: 'Step 1 — Order matters',
    instruction: 'Brew Ember Root + Frost Petal, then Frost Petal + Ember Root. Same ingredients, different order — a different potion.',
  },
  {
    id: 'affinity',
    title: 'Step 2 — Affinity',
    instruction: 'Brew a Pure pair (the same ingredient twice), a Violent pair (opposites), and a Harmonious pair. Watch the preview: each affinity has its own quality and volatility.',
  },
  {
    id: 'flame',
    title: 'Step 3 — Flame',
    instruction: 'Brew the same pair on Low, Medium, and High flame. Hotter is stronger — and wilder.',
  },
  {
    id: 'catalyst',
    title: 'Step 4 — Catalysts & stabilization',
    instruction: 'Brew one pair with Wildspark, one with Stabilizing Salt, then stabilize a volatile brew. Stabilizing cools the cauldron by 25 volatility but costs quality.',
  },
  {
    id: 'contracts',
    title: 'Step 5 — Contracts',
    instruction: 'Fulfil a Modest contract: brew an Ignition potion of quality 55 or better. Then brew a potion that does not match, and watch it sell.',
  },
];

export function createTutorial() {
  return {
    stepIndex: 0,
    completed: false,
    skipped: false,
    order: { emberFrost: false, frostEmber: false },
    affinity: { pure: false, violent: false, harmonious: false },
    flame: { pair: null, low: false, med: false, high: false },
    catalyst: { wild: false, salt: false, stabilized: false },
    contracts: { fulfilled: false, sold: false },
  };
}

export function currentStep(tut) {
  return TUTORIAL_STEPS[tut.stepIndex] ?? null;
}

/** The current step's checklist: [{ label, done }] for the UI. */
export function stepChecklist(tut) {
  switch (tut.stepIndex) {
    case 0:
      return [
        { label: 'Brew Ember Root + Frost Petal', done: tut.order.emberFrost },
        { label: 'Brew Frost Petal + Ember Root', done: tut.order.frostEmber },
      ];
    case 1:
      return [
        { label: 'Brew a Pure pair (same ingredient twice)', done: tut.affinity.pure },
        { label: 'Brew a Violent pair (opposites)', done: tut.affinity.violent },
        { label: 'Brew a Harmonious pair', done: tut.affinity.harmonious },
      ];
    case 2:
      return [
        { label: 'Brew the pair on Low flame', done: tut.flame.low },
        { label: 'Brew the pair on Medium flame', done: tut.flame.med },
        { label: 'Brew the pair on High flame', done: tut.flame.high },
      ];
    case 3:
      return [
        { label: 'Brew a pair with Wildspark', done: tut.catalyst.wild },
        { label: 'Brew a pair with Stabilizing Salt', done: tut.catalyst.salt },
        { label: 'Stabilize a volatile brew', done: tut.catalyst.stabilized },
      ];
    case 4:
      return [
        { label: 'Fulfil the Modest contract (Ignition, quality 55+)', done: tut.contracts.fulfilled },
        { label: 'Brew a potion that does not match — and watch it sell', done: tut.contracts.sold },
      ];
    default:
      return [];
  }
}

function isStepDone(tut) {
  return stepChecklist(tut).every((item) => item.done);
}

/**
 * Feed one brewed reaction into the tutorial. brew is
 * { spec, outcome } where spec is the brew spec (ingredients,
 * temperature, catalyst, stabilizations) and outcome is brewReaction's
 * return. Returns { stepCompleted, allCompleted }. A runaway (no potion)
 * never counts toward a step.
 */
export function recordTutorialBrew(tut, brew) {
  if (tut.completed || tut.skipped) return { stepCompleted: false, allCompleted: false };
  const { spec, outcome } = brew;
  if (!outcome.success) return { stepCompleted: false, allCompleted: false };
  const potion = outcome.potion;
  const ids = spec.ingredients;

  switch (tut.stepIndex) {
    case 0: {
      if (ids[0] === 'ember' && ids[1] === 'frost') tut.order.emberFrost = true;
      if (ids[0] === 'frost' && ids[1] === 'ember') tut.order.frostEmber = true;
      break;
    }
    case 1: {
      const key = potion.affinity.toLowerCase();
      if (key in tut.affinity) tut.affinity[key] = true;
      break;
    }
    case 2: {
      const pair = ids.slice(0, 2).join('+');
      if (!tut.flame.pair) tut.flame.pair = pair;
      // Only the pair the step started with counts — a different pair
      // is a different potion, not progress on this step.
      if (tut.flame.pair === pair) tut.flame[spec.temperature] = true;
      break;
    }
    case 3: {
      if (spec.catalyst === 'wild') tut.catalyst.wild = true;
      if (spec.catalyst === 'salt') tut.catalyst.salt = true;
      if (spec.stabilizations >= 1) tut.catalyst.stabilized = true;
      break;
    }
    case 4: {
      if (!tut.contracts.fulfilled && fulfilsContract(potion, TUTORIAL_CONTRACT)) {
        tut.contracts.fulfilled = true;
      } else if (tut.contracts.fulfilled && !fulfilsContract(potion, TUTORIAL_CONTRACT)) {
        tut.contracts.sold = true;
      }
      break;
    }
    default:
      break;
  }

  const stepCompleted = isStepDone(tut);
  if (stepCompleted) {
    tut.stepIndex += 1;
    if (tut.stepIndex >= TUTORIAL_STEPS.length) tut.completed = true;
  }
  return { stepCompleted, allCompleted: tut.completed };
}
