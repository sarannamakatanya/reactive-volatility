// contracts.js — the contracts. A contract is one client asking for one
// potion effect at one minimum quality. Fulfilling it pays far more than
// selling the same potion, so matching the contract is the goal; selling
// a potion that does not match is the consolation prize.

import { CLIENTS, CONTRACT_TIERS, EFFECTS } from './data.js';

let nextId = 1;

/** Pick a random element from an array, using the given rng. */
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Make a new contract. rng returns [0, 1); pass a seeded one to test.
 * The effect is one of the six, the tier is one of Modest / Demanding /
 * Exacting, and the reward is the minimum quality doubled.
 */
export function makeContract(rng = Math.random) {
  const effectKey = pick(rng, Object.keys(EFFECTS));
  const tier = pick(rng, CONTRACT_TIERS);
  const client = pick(rng, CLIENTS);
  return {
    id: nextId++,
    client: client.name,
    want: client.want,
    effect: EFFECTS[effectKey].name,
    effectKey,
    minQuality: tier.minQuality,
    tier: tier.label,
    reward: tier.minQuality * 2,
  };
}

/** A potion fulfils a contract when its effect matches and its quality is at least the minimum. */
export function fulfilsContract(potion, contract) {
  return potion.effectKey === contract.effectKey && potion.quality >= contract.minQuality;
}
