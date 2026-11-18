// relics.js — the 8 approved M4 relics (B1 CLOSED). Pure, no DOM.
// No relic grants Gem income. Stacking: qAdd/vAdd sum, stabKeep takes the max.

export const RELICS = [
  { id: 'kilnstone', name: 'Salamantra', icon: 'assets/icon-relic-salamantra.webp', family: 'Brewing', rarity: 'Common', price: 3,
    text: 'Every brew comes out 3 quality higher.', qAdd: 3 },
  { id: 'frostglass-alembic', name: 'Frostglass Alembic', icon: 'assets/icon-relic-frostglass-alembic.webp', family: 'Brewing', rarity: 'Uncommon', price: 6,
    text: 'Every brew runs 10 volatility cooler.', vAdd: -10 },
  { id: 'saltbound-crucible', name: 'Saltbound Crucible', icon: 'assets/icon-relic-saltbound-crucible.webp', family: 'Brewing', rarity: 'Rare', price: 9,
    text: 'Stabilizing preserves more of your brew\'s quality.', stabKeep: 0.92 },
  { id: 'pawn-ticket', name: 'Pawn Ticket', icon: 'assets/icon-relic-pawn-ticket.webp', family: 'Shop', rarity: 'Common', price: 3,
    text: 'Good for one bargain. Your next relic costs 3 Gems less.' },
  { id: 'brass-scales', name: 'Brass Scales', icon: 'assets/icon-relic-brass-scales.webp', family: 'Shop', rarity: 'Uncommon', price: 7,
    text: 'The shop pays half again for every potion you sell.', saleBonus: 0.50 },
  { id: 'quicksilver-alembic', name: 'Quicksilver Alembic', icon: 'assets/icon-relic-quicksilver-alembic.webp', family: 'Generalist', rarity: 'Uncommon', price: 6,
    text: 'A little steadier, a little stronger. Both at once.', qAdd: 2, vAdd: -5 },
  { id: 'gilt-crucible', name: 'Gilt Crucible', icon: 'assets/icon-relic-gilt-crucible.webp', family: 'Generalist', rarity: 'Rare', price: 8,
    text: 'Stronger brews, gentler stabilizing. Neither at full strength.', qAdd: 2, stabKeep: 0.88 },
  { id: 'wayfarers-still', name: 'Wayfarer\'s Still', icon: 'assets/icon-relic-wayfarers-still.webp', family: 'Generalist', rarity: 'Epic', price: 10,
    text: 'A traveller\'s kit: a steadier brew and a better price for whatever doesn\'t sell to the client.',
    qAdd: 2, vAdd: -5, saleBonus: 0.25 },
];

export function relicById(id) {
  return RELICS.find((r) => r.id === id) ?? null;
}

/** The relic effects owned ids grant. ownedIds is a Set or an array. */
export function computeMods(ownedIds) {
  const owned = new Set(ownedIds);
  const mods = { qAdd: 0, vAdd: 0, stabKeepValue: 0.85, saleBonus: 0 };
  for (const relic of RELICS) {
    if (!owned.has(relic.id)) continue;
    mods.qAdd += relic.qAdd ?? 0;
    mods.vAdd += relic.vAdd ?? 0;
    if (relic.stabKeep !== undefined) mods.stabKeepValue = Math.max(mods.stabKeepValue, relic.stabKeep);
    mods.saleBonus += relic.saleBonus ?? 0;
  }
  return mods;
}

/** What a relic costs right now: 3 Gems off with a Pawn Ticket pending, floored at 1. */
export function discountedPrice(relic, discountPending) {
  return Math.max(relic.price - (discountPending ? 3 : 0), 1);
}
