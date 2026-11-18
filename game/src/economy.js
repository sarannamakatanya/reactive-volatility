// economy.js — the money ledger: coins + Gems. The seam M4's debt.js and
// shop.js plug into; it holds the balances and nothing else. Coins come from
// contract rewards and potion sales, Gems from fulfilments (computeGemReward);
// spent in the M4 relic shop. Spend guards return a boolean instead of a

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
