// economy.js — the money ledger: coins + Gems. This is the seam M4's
// debt.js and shop.js plug into; it holds the balances and nothing else.
// M1 implements coins + Gems only: coins are earned from contract rewards
// and potion sales (ingredients are FREE in M1), Gems are earned from
// contract fulfilments (see computeGemReward in contracts.js) and are
// unspendable in M1 — the spend path (the minimum-viable relic shop)
// arrives in M4. No debt, no borrowing, no interest, no market lives here.
//
// The spend guards exist now so M4's debt payment and shop never have to
// re-implement "can the player afford this" — they call spendCoins /
// spendGems and get a boolean back instead of a negative balance.

export function createLedger() {
  return { coins: 0, gems: 0 };
}

export function addCoins(ledger, amount) {
  ledger.coins += amount;
  return ledger.coins;
}

export function addGems(ledger, amount) {
  ledger.gems += amount;
  return ledger.gems;
}

/** Take coins out if the ledger can cover them; false (and no change) otherwise. */
export function spendCoins(ledger, amount) {
  if (amount < 0 || ledger.coins < amount) return false;
  ledger.coins -= amount;
  return true;
}

/** Take Gems out if the ledger can cover them; false (and no change) otherwise. */
export function spendGems(ledger, amount) {
  if (amount < 0 || ledger.gems < amount) return false;
  ledger.gems -= amount;
  return true;
}

export function balances(ledger) {
  return { coins: ledger.coins, gems: ledger.gems };
}
