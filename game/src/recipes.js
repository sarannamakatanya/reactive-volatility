// recipes.js — the recipe reference. A reference, NOT a spoiler: it lists
// only reactions the player has actually brewed in this run (spec §6).
// Each entry is keyed by the reaction itself — effect + trait + twist —
// and records the affinity, quality, and volatility AS LAST BREWED, so
// re-brewing the same reaction updates the entry instead of adding one.
//
// A reaction is fully identified by effect + trait + twist: each element
// has exactly one ingredient, so the ingredient order is recoverable
// from the three parts. Two-ingredient brews have no twist (null).
//
// The book is per-run: a new run (newGame) creates a fresh, empty book
// (A8 — no discovered recipes carried over).

/** A reaction's identity: effect element | trait | twist ('' when none). */
export function recipeKey(potion) {
  return `${potion.effectKey}|${potion.trait}|${potion.twist ?? ''}`;
}

export function createRecipeBook() {
  return { order: [], byKey: new Map() };
}

/**
 * Record a successfully brewed potion. Returns the entry. A repeat brew
 * of a known reaction updates its quality/volatility to the latest brew
 * (and bumps its count) instead of adding a duplicate entry.
 */
export function recordBrew(book, potion) {
  const key = recipeKey(potion);
  const existing = book.byKey.get(key);
  if (existing) {
    existing.quality = potion.quality;
    existing.volatility = potion.volatility;
    existing.count += 1;
    return existing;
  }
  const entry = {
    key,
    name: potion.name,
    effect: potion.effect,
    trait: potion.trait,
    twist: potion.twist,
    affinity: potion.affinity,
    quality: potion.quality,
    volatility: potion.volatility,
    count: 1,
  };
  book.byKey.set(key, entry);
  book.order.push(entry);
  return entry;
}

/** The discovered reactions, in discovery order. */
export function listRecipes(book) {
  return [...book.order];
}

export function recipeCount(book) {
  return book.order.length;
}
