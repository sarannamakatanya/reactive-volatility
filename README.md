# Reactive Volatility

A desperate alchemist brews potions for demanding clients.

**Milestone 2** — everything from M1, plus the 5-step playable
tutorial (§6: order, affinity, flame, catalysts & stabilization,
contracts), the recipe reference (discovered reactions only), the title
screen's best result, and a "How to play" screen.

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
- **Volatility.** Every brew has a volatility meter with four bands
  (Controlled / Unstable / Dangerous / Critical) and the exact runaway
  chance shown. Above 40, every extra point is one percent of runaway
  chance: a runaway loses the brew outright. **Stabilize** cools the
  cauldron once per brew (−25 volatility) at the cost of quality (−15%,
  Fix B). The strongest brews cannot be made perfectly safe — that is
  the push-vs-stabilize choice.
- **Contracts.** Fulfil 3 contracts before your 12 brews run out. A
  fulfilled contract pays its reward in coins, plus Gems: +2 for meeting
  the quality requirement and +2 for matching the contract's demanded
  affinity, each scaled by contract (×1.0 / ×1.5 / ×2.0), so 4 / 6 / 8
  Gems per contract. The affinity match is never required for
  fulfilment. A potion that does not match is sold for its value instead.
  Gems are earned and shown in M1; the shop that spends them arrives
  in M4. Ingredients are free in M1.

## Controls

Mouse and keyboard. Keys `1`–`6` add ingredients in shelf order,
`Backspace` takes the last one back out, `Q`/`W`/`E` set the flame,
`Z`/`X`/`C` pick the catalyst, `T` stabilizes, `Space`/`Enter` brews,
`R` restarts from the end screen (or starts from the title), `Esc`
goes back to the title. Every key has a visible button with its hint.

## Files

- `game/index.html` — the page (title, brewing, and end screens).
- `game/style.css` — the dark arcane styling.
- `game/src/data.js` — ingredients, catalysts, flame, affinities, clients,
  Gem reward table.
- `game/src/reaction.js` — the reaction engine (pure: order, affinity,
  quality, volatility, runaway). Testable in Node.
- `game/src/contracts.js` — contract generation, fulfilment, and the Gem
  reward breakdown.
- `game/src/economy.js` — the money ledger (coins + Gems); the seam M4's
  debt and shop plug into.
- `game/src/game.js` — game state, UI wiring, keyboard input, and the
  play loop (including the tutorial mode and the recipe reference).
- `game/src/tutorial.js` — the 5-step tutorial flow (pure step logic).
- `game/src/recipes.js` — the discovered-reactions reference (per run).
- `game/src/storage.js` — local best result + the tutorial-done flag.
- `game/src/main.js` — entry point.
- `main.ts` — the build program: verifies the game tree and copies
  `game/` (and `screenshots/` when present) to the output directory.

## Playtest

Serve `game/` and open it in a desktop browser. Or run the headless
check: `OUTPUT_DIR=out node main.ts` (verifies the tree and copies it
to `out/`).
