// shop.js — the minimum-viable relic shop (M4). Pure logic; the modal UI
// lives in game.js. Gems are the only currency.

import { spendGems } from './economy.js';
import { RELICS, discountedPrice, relicById } from './relics.js';

export const PAWN_GREY_REASON = 'No later purchase to discount.';

/** The 8 relics minus owned ones. */
export function availableRelics(ownedIds, contractsFulfilled) {
  const owned = new Set(ownedIds);
  return RELICS.filter((r) => !owned.has(r.id)).map((r) => {
    const greyed = r.id === 'pawn-ticket' && contractsFulfilled >= 2;
    return { ...r, greyed, greyReason: greyed ? PAWN_GREY_REASON : null };
  });
}

/** Buy a relic: validates (exists, not owned, not greyed, affordable at * the discounted price), deducts Gems, adds to ownedRelics. */
export function buyRelic(state, relicId) {
  const relic = relicById(relicId);
  if (!relic) return { ok: false, reason: 'No such relic.' };
  if (state.ownedRelics.has(relicId)) return { ok: false, reason: 'Already owned.' };
  if (relicId === 'pawn-ticket' && state.contractsFulfilled >= 2) {
    return { ok: false, reason: PAWN_GREY_REASON };
  }
  const price = discountedPrice(relic, state.discountPending && relicId !== 'pawn-ticket');
  if (!spendGems(state.ledger, price)) return { ok: false, reason: 'Not enough Gems.' };
  state.ownedRelics.add(relicId);
  state.discountPending = relicId === 'pawn-ticket';
  return { ok: true, price };
}
