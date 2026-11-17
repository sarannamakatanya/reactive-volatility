// contracts.js — the contracts. A contract is one client asking for one
// potion effect at one minimum quality, plus a demanded affinity (Alt C
// model: one affinity drawn uniformly at random per contract). Fulfilling
// it pays far more than selling the same potion, so matching the contract
// is the goal; selling a potion that does not match is the consolation
// prize.
//
// Fulfilment is effect + quality ONLY. The demanded affinity is never
// required — matching it earns affinity Gems (see computeGemReward), and
// a right-effect, right-quality brew with the wrong affinity still
// fulfils the contract.

import { AFFINITIES, CLIENTS, CONTRACT_TIERS, DEMAND_AFFINITIES, EFFECTS, GEM_REWARD } from './data.js';

let nextId = 1;

/** Pick a random element from an array, using the given rng. */
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Make a new contract. rng returns [0, 1); pass a seeded one to test.
 * The effect is one of the six, the tier is one of Modest / Demanding /
 * Exacting, the reward is the minimum quality doubled, and the demanded
 * affinity is one of Pure / Harmonious / Violent, drawn uniformly at
 * random. `index` is the 0-based contract number in the run (0, 1, 2);
 * it sets the Gem reward scaling.
 */
export function makeContract(rng = Math.random, index = 0) {
  const effectKey = pick(rng, Object.keys(EFFECTS));
  const tier = pick(rng, CONTRACT_TIERS);
  const client = pick(rng, CLIENTS);
  const demandAffinityKey = pick(rng, DEMAND_AFFINITIES);
  return {
    id: nextId++,
    index,
    number: index + 1,
    client: client.name,
    want: client.want,
    effect: EFFECTS[effectKey].name,
    effectKey,
    minQuality: tier.minQuality,
    tier: tier.label,
    reward: tier.minQuality * 2,
    demandAffinityKey,
    demandAffinity: AFFINITIES[demandAffinityKey].name,
  };
}

/** A potion fulfils a contract when its effect matches and its quality is at least the minimum. Affinity never gates fulfilment. */
export function fulfilsContract(potion, contract) {
  return potion.effectKey === contract.effectKey && potion.quality >= contract.minQuality;
}

/**
 * The Gem reward for fulfilling a contract with a brewed potion.
 * Speed is DROPPED (Yukarin's call 2026-11-18) — there is no
 * early-completion bonus. What pays:
 *   quality: +2 Gems when the brewed quality meets the contract minimum
 *     (a fulfilment stipend — it fires on 100% of fulfilments);
 *   affinity: +2 Gems when the brewed affinity matches the contract's
 *     demanded affinity (a real choice: ~1 in 3 by chance, chased by
 *     brewing to the demand).
 * Each component is multiplied by the contract scaling (1.0 / 1.5 / 2.0
 * by contract index) and Math.round'ed, so a contract pays 4 / 6 / 8
 * Gems at most. Returns the breakdown, not just a total, so the result
 * line can show what each part paid.
 */
export function computeGemReward(contract, potion) {
  const scaling = GEM_REWARD.scaling[Math.min(contract.index ?? 0, GEM_REWARD.scaling.length - 1)];
  const qualityMet = potion.quality >= contract.minQuality;
  const affinityMatch = potion.affinity === AFFINITIES[contract.demandAffinityKey].name;
  const quality = qualityMet ? Math.round(GEM_REWARD.quality * scaling) : 0;
  const affinity = affinityMatch ? Math.round(GEM_REWARD.affinity * scaling) : 0;
  return { quality, affinity, total: quality + affinity, qualityMet, affinityMatch, scaling };
}
