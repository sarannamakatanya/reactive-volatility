// contracts.js — the contracts. One client asking for one potion effect
// at one minimum quality, plus a demanded affinity (one drawn uniformly
// at random per contract). Fulfilling pays far more than selling, so
// matching is the goal; a non-match sells instead. Fulfilment is effect
// + quality ONLY — the demanded affinity is never required; matching it

import { AFFINITIES, CLIENTS, CONTRACT_TIERS, DEMAND_AFFINITIES, EFFECTS, GEM_REWARD } from './data.js';

let nextId = 1;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Make a new contract. */
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

export function fulfilsContract(potion, contract) {
  return potion.effectKey === contract.effectKey && potion.quality >= contract.minQuality;
}

/** The Gem reward for a fulfilment. */
export function computeGemReward(contract, potion) {
  const scaling = GEM_REWARD.scaling[Math.min(contract.index ?? 0, GEM_REWARD.scaling.length - 1)];
  const qualityMet = potion.quality >= contract.minQuality;
  const affinityMatch = potion.affinity === AFFINITIES[contract.demandAffinityKey].name;
  const quality = qualityMet ? Math.round(GEM_REWARD.quality * scaling) : 0;
  const affinity = affinityMatch ? Math.round(GEM_REWARD.affinity * scaling) : 0;
  return { quality, affinity, total: quality + affinity, qualityMet, affinityMatch, scaling };
}
