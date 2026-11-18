// recipes.js — the recipe reference. A reference, NOT a spoiler: only
// reactions actually brewed in this run (spec §6). Each entry is keyed
// by the reaction (effect + trait + twist) and records affinity, quality,
// and volatility AS LAST BREWED — re-brewing updates it instead of

/** A reaction's identity: effect element | trait | twist ('' when none). */
export function recipeKey(potion) {
  return `${potion.effectKey}|${potion.trait}|${potion.twist ?? ''}`;
}

export function createRecipeBook() {
  return { order: [], byKey: new Map() };
}

// Rarity (§6, display only) from the personal best — never downgrades. Tiers: Common <60, Uncommon 60–69, Rare 70–84, Epic 85–94, Legendary 95+.
export function rarityOf(quality) {
  if (quality >= 95) return 'Legendary';
  if (quality >= 85) return 'Epic';
  if (quality >= 70) return 'Rare';
  if (quality >= 60) return 'Uncommon';
  return 'Common';
}

/** Record a brewed potion. */
export function recordBrew(book, potion) {
  const key = recipeKey(potion);
  const existing = book.byKey.get(key);
  if (existing) {
    existing.quality = potion.quality;
    existing.volatility = potion.volatility;
    existing.best = Math.max(existing.best, potion.quality);
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
    best: potion.quality,
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
