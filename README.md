# The Alchemist's Debt — reaction prototype

Minimal playable prototype of the reaction system for the make.fun
best-game-01 competition ($1,000, deadline Thu 2026-11-19 01:00 WIB).

## What this is

You are a debtor alchemist. Clients issue contracts: brew a potion with
a given effect at a given quality or better. You brew by combining
ingredients in the cauldron.

This prototype is ONLY the reaction system and contract fulfilment.
There is deliberately no debt/bill system, no House retaliation, no shop,
and no upgrades yet — Luna's rule is to prove the reaction is interesting
on its own before any of that is built.

## The reaction system

- **Order matters.** Pick 2 or 3 ingredients. The first sets the potion's
  effect, the second its trait, the third its twist. The same ingredients
  in a different order make a different potion.
- **Affinity.** Same element twice is Pure; opposites (fire/cold,
  light/shadow, air/earth) are Violent — more powerful, more dangerous;
  anything else is Harmonious.
- **Flame.** Low / Medium / High. Hotter means a stronger potion and a
  wilder reaction.
- **Catalysts.** Stabilizing Salt steadies the reaction (less volatile,
  slightly weaker). Wildspark doubles the power — and the danger.
- **Volatility.** Every brew has a volatility meter. Above 40, every extra
  point is one percent of runaway chance: a runaway loses the brew
  outright. **Stabilize** cools the cauldron once per brew (−25
  volatility) at the cost of quality (−8%). The strongest brews cannot
  be made perfectly safe — that is the push-vs-stabilize choice.
- **Contracts.** Fulfil 3 contracts before your 12 brews run out. A
  fulfilled contract pays its reward; a potion that does not match is
  sold for its value instead.

## Files

- `game/index.html` — the page (title, brewing, and end screens).
- `game/style.css` — the dark arcane styling.
- `game/src/data.js` — ingredients, catalysts, flame, affinities, clients.
- `game/src/reaction.js` — the reaction engine (pure: order, affinity,
  quality, volatility, runaway). Testable in Node.
- `game/src/contracts.js` — contract generation and fulfilment.
- `game/src/game.js` — game state, UI wiring, and the play loop.
- `game/src/main.js` — entry point.
- `main.ts` — the entry program: copies `game/` (and `screenshots/`
  when present) to `/output` and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit library, copied unchanged.

## Playtest

Serve `game/` and open it in a desktop browser, or run `node serve.ts`
from the kit starter. Or run the headless check:
`MAKEFUN_OUTPUT_DIR=out node main.ts` (writes `out/dossier.json`).
