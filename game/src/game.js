// game.js — Reactive Volatility, M2.
// Game state, UI wiring, and the play loop. The reaction rules live in
// reaction.js, the contracts (plus the Gem reward) in contracts.js, and
// the money ledger in economy.js; this file only moves state around and
// renders it.
//
// The loop: pick 2-3 ingredients in order, set the flame, pick a
// catalyst, watch the preview, stabilize if the reaction looks too wild,
// then brew. A brew that matches the contract's effect at its quality
// fulfils it — and pays Gems on top of the coin reward. Fulfil 3
// contracts before the 12 brews run out. Ingredients are FREE in M1
// (the coin cost arrives in M4), so the economy does not confound the
// reaction test.

import { AFFINITIES, CATALYSTS, GEM_REWARD, INGREDIENTS, TEMPERATURES } from './data.js';
import { MAX_INGREDIENTS, MIN_INGREDIENTS, MAX_STABILIZATIONS, brewReaction, computeReaction } from './reaction.js';
import { computeGemReward, fulfilsContract, makeContract } from './contracts.js';
import { addCoins, addGems, createLedger } from './economy.js';
import { TUTORIAL_CONTRACT, createTutorial, currentStep, recordTutorialBrew, stepChecklist } from './tutorial.js';
import { createRecipeBook, listRecipes, recordBrew, recipeCount } from './recipes.js';
import { isTutorialDone, loadBest, saveBest, setTutorialDone } from './storage.js';

export const WIN_CONTRACTS = 3;
export const BREW_LIMIT = 12;

const SLOT_LABELS = ['1st — Base', '2nd — Modifier', '3rd — Finisher'];
const SLOT_ROLES = [
  'sets the potion’s effect',
  'sets its trait',
  'sets its twist',
];

// Keyboard map (brief §9). Every key has a visible mouse equivalent;
// buttons show their key hints.
const FLAME_KEYS = { q: 'low', w: 'med', e: 'high' };
const FLAME_HINTS = { low: 'Q', med: 'W', high: 'E' };
const CATALYST_KEYS = { z: 'none', x: 'salt', c: 'wild' };
const CATALYST_HINTS = { none: 'Z', salt: 'X', wild: 'C' };

// The rng the game draws from (contracts + brew rolls). Math.random in
// play; tests inject a seeded one via setRng.
let rng = Math.random;

/** Test seam: replace the rng (seeded) so a playthrough is deterministic. */
export function setRng(fn) {
  rng = fn;
}

const state = {
  screen: 'title',
  mode: 'play', // 'play' | 'tutorial'
  tutorial: null,
  recipes: createRecipeBook(),
  returnTo: 'title',
  ledger: createLedger(),
  contractsFulfilled: 0,
  brewsLeft: BREW_LIMIT,
  runaways: 0,
  contract: null,
  brew: { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 },
};

/** Test seam: a snapshot of the observable state (no DOM needed to read it). */
export function getState() {
  return {
    screen: state.screen,
    coins: state.ledger.coins,
    gems: state.ledger.gems,
    contractsFulfilled: state.contractsFulfilled,
    brewsLeft: state.brewsLeft,
    runaways: state.runaways,
    contract: state.contract ? { ...state.contract } : null,
    brewIngredients: [...state.brew.ingredients],
    temperature: state.brew.temperature,
    catalyst: state.brew.catalyst,
    stabilizations: state.brew.stabilizations,
    brewDisabled: $('btn-brew').disabled,
    stabilizeDisabled: $('btn-stabilize').disabled,
    resultText: $('result').textContent,
    eventText: $('event-strip').textContent,
    mode: state.mode,
    tutorialStep: state.tutorial ? state.tutorial.stepIndex : null,
    tutorialCompleted: state.tutorial ? state.tutorial.completed : false,
    recipesCount: recipeCount(state.recipes),
    previewText: $('preview').textContent,
  };
}

function $(id) {
  return document.getElementById(id);
}

function showScreen(name) {
  state.screen = name;
  $('screen-title').hidden = name !== 'title';
  $('screen-play').hidden = name !== 'play';
  $('screen-end').hidden = name !== 'end';
  $('screen-howto').hidden = name !== 'howto';
  if (name === 'title') renderTitle();
  if (name === 'howto') renderHowto();
}

function stars(quality) {
  const filled = Math.max(0, Math.min(5, Math.round(quality / 20)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/** The one-line last-event strip — the whole "log" in M1 (no Log panel). */
function setEvent(text) {
  $('event-strip').textContent = text;
}

/** Title screen: the best run so far (contracts fulfilled / coins). */
function renderTitle() {
  const best = loadBest();
  $('best-result').textContent = best
    ? `Best result: ${best.contracts} contract${best.contracts === 1 ? '' : 's'} fulfilled · ${best.coins} coins`
    : 'No runs yet — the cauldron is waiting for its first brewer.';
}

/** The How-to-play screen: the five tutorial steps as text + the recipe reference. */
function renderHowto() {
  const box = $('howto-recipes');
  const recipes = listRecipes(state.recipes);
  if (recipes.length === 0) {
    box.innerHTML = '<p class="muted">No reactions discovered yet — brew something and it will be written down here, with its affinity, quality, and volatility as last brewed.</p>';
    return;
  }
  box.innerHTML = recipes.map((r) => `
    <div class="recipe">
      <span class="recipe-name">${r.name}</span>
      <span class="recipe-meta">${r.affinity} · quality ${r.quality} · volatility ${r.volatility}${r.count > 1 ? ` · brewed ${r.count}×` : ''}</span>
    </div>`).join('');
}

/** The tutorial banner above the play grid: current step + checklist. */
function renderTutorialBanner() {
  const banner = $('tutorial-banner');
  if (state.mode !== 'tutorial' || !state.tutorial) {
    banner.hidden = true;
    return;
  }
  banner.hidden = false;
  const tut = state.tutorial;
  if (tut.completed) {
    $('tutorial-text').innerHTML = '<strong>Tutorial complete!</strong> You know the reaction now — order, affinity, flame, catalysts, and contracts. The first real contract is waiting.';
    $('tutorial-progress').innerHTML = '';
    $('btn-skip-tutorial').hidden = true;
    $('btn-tutorial-done').hidden = false;
    return;
  }
  const step = currentStep(tut);
  $('tutorial-text').innerHTML = `<strong>${step.title}</strong> — ${step.instruction}`;
  $('tutorial-progress').innerHTML = stepChecklist(tut)
    .map((item) => `<div>${item.done ? '✓' : '○'} ${item.label}</div>`).join('');
  // The Skip button is on step 1 only (spec §6); after that the player
  // is one step in and the tutorial is short.
  $('btn-skip-tutorial').hidden = tut.stepIndex !== 0;
  $('btn-tutorial-done').hidden = true;
}

function openHowto() {
  state.returnTo = state.screen;
  showScreen('howto');
}

function closeHowto() {
  showScreen(state.returnTo === 'howto' ? 'title' : state.returnTo);
}

/** Volatility band (§4, presentation only — it never changes a probability). */
function volatilityBand(volatility) {
  if (volatility < 20) return { name: 'Controlled', color: 'var(--green)' };
  if (volatility < 40) return { name: 'Unstable', color: 'var(--yellow)' };
  if (volatility < 60) return { name: 'Dangerous', color: 'var(--orange)' };
  return { name: 'Critical', color: 'var(--red)' };
}

function newGame(options = {}) {
  state.mode = 'play';
  state.tutorial = null;
  // A new run starts with an empty recipe book (A8) — except the run
  // that follows the tutorial, which keeps the reactions the tutorial
  // just taught (the tutorial is the start of that run, not a restart).
  if (!options.keepRecipes) state.recipes = createRecipeBook();
  state.ledger = createLedger();
  state.contractsFulfilled = 0;
  state.brewsLeft = BREW_LIMIT;
  state.runaways = 0;
  state.contract = makeContract(rng, 0);
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };
  $('result').innerHTML = '<p class="muted">Nothing brewed yet. The cauldron is waiting.</p>';
  setEvent('');
  showScreen('play');
  render();
}

/** The tutorial (spec §6): 5 playable steps before the first real contract. */
function startTutorial() {
  state.mode = 'tutorial';
  state.tutorial = createTutorial();
  state.recipes = createRecipeBook();
  state.ledger = createLedger();
  state.contractsFulfilled = 0;
  state.brewsLeft = BREW_LIMIT;
  state.runaways = 0;
  state.contract = null;
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };
  $('result').innerHTML = '<p class="muted">The tutorial: brew what each step asks for. Tutorial brews are free — they spend no brews and no coins.</p>';
  setEvent('');
  showScreen('play');
  render();
}

/** "Begin brewing": the tutorial on the first run, straight to play after. */
function begin() {
  if (isTutorialDone()) newGame();
  else startTutorial();
}

/** The Skip button (step 1 only): leave the tutorial and start a real run. */
function skipTutorial() {
  if (!state.tutorial) return;
  state.tutorial.skipped = true;
  setTutorialDone();
  newGame();
}

function canBrew() {
  return state.brew.ingredients.length >= MIN_INGREDIENTS && state.brewsLeft > 0;
}

function preview() {
  if (state.brew.ingredients.length < MIN_INGREDIENTS) return null;
  return computeReaction({
    ingredients: state.brew.ingredients,
    temperature: state.brew.temperature,
    catalyst: state.brew.catalyst,
    stabilizations: state.brew.stabilizations,
  });
}

function renderHud() {
  $('hud-coins').textContent = state.ledger.coins;
  $('hud-gems').textContent = state.ledger.gems;
  $('hud-contracts').textContent = `${state.contractsFulfilled} / ${WIN_CONTRACTS}`;
  $('hud-brews').textContent = state.brewsLeft;
}

/** The contract card's HTML, shared by real contracts and the tutorial's fixed one. */
function renderContractCard(c) {
  const aff = AFFINITIES[c.demandAffinityKey];
  const scaling = GEM_REWARD.scaling[Math.min(c.index, GEM_REWARD.scaling.length - 1)];
  const qGems = Math.round(GEM_REWARD.quality * scaling);
  const aGems = Math.round(GEM_REWARD.affinity * scaling);
  return `
    <div class="client">${c.client}</div>
    <div class="want">${c.want}</div>
    <div class="demand">Wants a <strong>${c.effect}</strong> potion of quality
      <strong>${c.minQuality}</strong> or better <span class="muted">(${c.tier})</span>.</div>
    <div class="demand-aff" style="color:${aff.color}">${aff.icon} Demanded affinity: <strong>${aff.name}</strong></div>
    <div class="demand-gems">Gems on fulfilment: +${qGems} ◆ quality · +${aGems} ◆ affinity (×${scaling}) — up to ${qGems + aGems} ◆</div>
    <div class="reward">Reward: ${c.reward} coins</div>`;
}

function renderContract() {
  if (state.mode === 'tutorial') {
    if (state.tutorial && state.tutorial.stepIndex === 4) {
      $('contract-card').innerHTML = renderContractCard(TUTORIAL_CONTRACT);
      return;
    }
    // Steps 1–4 have no contract yet — the card says so and repeats the
    // step goal, so the player never wonders where the contract went.
    const step = state.tutorial ? currentStep(state.tutorial) : null;
    $('contract-card').innerHTML = step
      ? `<div class="muted">No contract yet — the tutorial comes first.</div>
         <div class="demand">${step.title}</div>
         <div class="line">${step.instruction}</div>`
      : '<div class="muted">No contract yet.</div>';
    return;
  }
  $('contract-card').innerHTML = renderContractCard(state.contract);
}

function renderCauldron() {
  const slots = $('cauldron-slots');
  slots.innerHTML = '';
  for (let i = 0; i < MAX_INGREDIENTS; i++) {
    const id = state.brew.ingredients[i];
    const slot = document.createElement('div');
    slot.className = 'slot' + (id ? ' filled' : '');
    if (id) {
      const ing = INGREDIENTS.find((item) => item.id === id);
      slot.innerHTML = `
        <span class="pos">${SLOT_LABELS[i]}</span>
        <span class="dot" style="background:${ing.color}"></span>
        <span class="ing-name">${ing.name}</span>
        <span class="ing-el">${ing.element} · ${SLOT_ROLES[i]}</span>`;
      slot.title = 'Click to take it back out';
      slot.addEventListener('click', () => {
        state.brew.ingredients.splice(i, 1);
        state.brew.stabilizations = 0;
        render();
      });
    } else {
      slot.innerHTML = `
        <span class="pos">${SLOT_LABELS[i]}</span>
        <span class="ing-el">${SLOT_ROLES[i]}</span>
        <span class="muted">empty</span>`;
    }
    slots.appendChild(slot);
  }
}

function renderShelf() {
  const shelf = $('ingredient-shelf');
  shelf.innerHTML = '';
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const ing = INGREDIENTS[i];
    const card = document.createElement('button');
    card.className = 'ing-card';
    card.disabled = state.brew.ingredients.length >= MAX_INGREDIENTS;
    card.innerHTML = `
      <span class="key-hint">[${i + 1}]</span>
      <span class="dot" style="background:${ing.color}"></span>
      <span class="ing-name">${ing.name}</span>
      <span class="ing-el">${ing.element}</span>
      <span class="ing-pot">Potency ${ing.potency}</span>
      <span class="ing-blurb">${ing.blurb}</span>`;
    card.addEventListener('click', () => {
      if (state.brew.ingredients.length >= MAX_INGREDIENTS) return;
      state.brew.ingredients.push(ing.id);
      state.brew.stabilizations = 0;
      render();
    });
    shelf.appendChild(card);
  }
}

function renderChoiceButtons(containerId, options, currentId, hints, onPick) {
  const container = $(containerId);
  container.innerHTML = '';
  for (const opt of Object.values(options)) {
    const btn = document.createElement('button');
    btn.className = 'btn' + (opt.id === currentId ? ' selected' : '');
    btn.innerHTML = `${opt.name} <span class="key-hint">[${hints[opt.id]}]</span>`;
    btn.title = opt.desc;
    btn.addEventListener('click', () => onPick(opt.id));
    container.appendChild(btn);
  }
}

function renderPreview() {
  const box = $('preview');
  const p = preview();
  $('btn-brew').disabled = !canBrew();
  // A brew can only be stabilized once: the choice is whether to cool it
  // down at the cost of quality, not how many times to cool it.
  const stabilizable = p !== null && p.volatility > 0
    && state.brew.stabilizations < MAX_STABILIZATIONS;
  $('btn-stabilize').disabled = !stabilizable;
  $('btn-stabilize').innerHTML = state.brew.stabilizations >= MAX_STABILIZATIONS
    ? 'Stabilized'
    : 'Stabilize the cauldron <span class="key-hint">[T]</span>';
  $('btn-brew').innerHTML = 'Brew! <span class="key-hint">[Space]</span>';

  if (!p) {
    box.innerHTML = '<p class="muted">Add at least 2 ingredients to see the reaction. '
      + 'The first sets the effect, the second the trait, the third the twist.</p>';
    return;
  }

  const c = state.mode === 'tutorial'
    ? (state.tutorial && state.tutorial.stepIndex === 4 ? TUTORIAL_CONTRACT : null)
    : state.contract;
  const band = volatilityBand(p.volatility);
  let indicator = '';
  let match = '';
  if (c) {
    const effectOk = p.effectKey === c.effectKey;
    const qualityOk = p.quality >= c.minQuality;
    const affinityOk = p.affinity === AFFINITIES[c.demandAffinityKey].name;
    indicator = `<div class="fulfil-line">Contract: effect ${effectOk ? '<span class="ok">✓</span>' : '<span class="no">✗</span>'} · quality ${qualityOk ? '<span class="ok">✓</span>' : '<span class="no">✗</span>'} · affinity ${affinityOk ? '<span class="ok">★</span>' : '<span class="no">—</span>'}</div>`;

    if (effectOk && qualityOk) {
      match = affinityOk
        ? '<div class="match">This would fulfil the contract — and match its demanded affinity.</div>'
        : '<div class="match">This would fulfil the contract — but the affinity differs, so no affinity Gems.</div>';
    } else if (effectOk) {
      match = `<div class="nomatch">Effect matches, but quality is ${c.minQuality - p.quality} short of the contract.</div>`;
    } else {
      match = `<div class="nomatch">Wrong effect for this contract — it wants ${c.effect}.</div>`;
    }
  } else {
    match = '<div class="muted">No contract yet — brew what the tutorial step asks for.</div>';
  }

  box.innerHTML = `
    <div class="potion-name">${p.name}</div>
    <div class="line">${p.effectDesc}</div>
    <div class="line">Affinity: <b>${p.affinity}</b> — <span class="affinity">${p.affinityDesc}</span></div>
    <div class="line">Quality: <b>${p.quality}</b> ${stars(p.quality)} <span class="muted">(±5 when brewed)</span></div>
    <div class="line">Volatility: <b>${p.volatility}</b> — <span style="color:${band.color}"><b>${band.name}</b></span></div>
    <div class="meter"><div style="width:${p.volatility}%; background:${band.color}"></div></div>
    <div class="meter-label">Runaway chance: <b>${p.runawayChance}%</b>${p.runawayChance > 0 ? ' — the brew may fail outright.' : ' — safe.'}</div>
    <div class="line">Would sell for <b>${p.value} coins</b>.</div>
    ${indicator}
    ${match}`;
}

function render() {
  renderHud();
  renderTutorialBanner();
  renderContract();
  renderCauldron();
  renderShelf();
  renderChoiceButtons('temp-buttons', TEMPERATURES, state.brew.temperature, FLAME_HINTS, (id) => {
    state.brew.temperature = id;
    render();
  });
  renderChoiceButtons('catalyst-buttons', CATALYSTS, state.brew.catalyst, CATALYST_HINTS, (id) => {
    state.brew.catalyst = id;
    render();
  });
  renderPreview();
}

function endGame(won) {
  saveBest(state.contractsFulfilled, state.ledger.coins);
  const used = BREW_LIMIT - state.brewsLeft;
  $('end-title').textContent = won ? 'The contracts are fulfilled!' : 'Out of brews.';
  $('end-text').textContent = won
    ? 'Three clients paid, three potions delivered, and the cauldron is still in one piece.'
    : 'The cauldron is cold and the contracts are unfulfilled.';
  $('end-stats').textContent = `Coins: ${state.ledger.coins} · Gems: ${state.ledger.gems} ◆ · Contracts fulfilled: ${state.contractsFulfilled} / ${WIN_CONTRACTS} · Brews used: ${used} / ${BREW_LIMIT} · Runaways: ${state.runaways}`;
  showScreen('end');
}

function addIngredient(id) {
  if (state.brew.ingredients.length >= MAX_INGREDIENTS) return;
  state.brew.ingredients.push(id);
  state.brew.stabilizations = 0;
  render();
}

function removeLastIngredient() {
  if (state.brew.ingredients.length === 0) return;
  state.brew.ingredients.pop();
  state.brew.stabilizations = 0;
  render();
}

function stabilize() {
  if (state.brew.ingredients.length < MIN_INGREDIENTS) return;
  if (state.brew.stabilizations >= MAX_STABILIZATIONS) return;
  const p = preview();
  if (!p || p.volatility <= 0) return;
  state.brew.stabilizations += 1;
  render();
}

function brew() {
  if (!canBrew()) return;
  const spec = {
    ingredients: [...state.brew.ingredients],
    temperature: state.brew.temperature,
    catalyst: state.brew.catalyst,
    stabilizations: state.brew.stabilizations,
  };
  const outcome = brewReaction(spec, rng);
  if (state.mode === 'tutorial') {
    brewTutorial(spec, outcome);
    return;
  }
  state.brewsLeft -= 1;
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };

  if (!outcome.success) {
    state.runaways += 1;
    $('result').innerHTML = `
      <div class="bad">RUNAWAY REACTION!</div>
      <div class="line">The cauldron boiled over and the brew was lost. Volatility was ${outcome.prediction.volatility}, and the roll came up ${outcome.rolled} against a ${outcome.prediction.runawayChance}% runaway chance.</div>
      <div class="line muted">High volatility is powerful, but it bites. Stabilize, or use a cooler flame.</div>`;
    setEvent(`Runaway! A ${outcome.prediction.name} boiled over. Ingredients lost.`);
  } else {
    const potion = outcome.potion;
    recordBrew(state.recipes, potion);
    const fulfilled = fulfilsContract(potion, state.contract);
    if (fulfilled) {
      const reward = computeGemReward(state.contract, potion);
      addCoins(state.ledger, state.contract.reward);
      addGems(state.ledger, reward.total);
      state.contractsFulfilled += 1;
      const done = state.contractsFulfilled;
      $('result').innerHTML = `
        <div class="potion-name">${potion.name}</div>
        <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
        <div class="good">Contract fulfilled! ${state.contract.client} pays ${state.contract.reward} coins.</div>
        <div class="line">Gems: +${reward.quality} ◆ quality · +${reward.affinity} ◆ affinity (×${reward.scaling}) — <b>${reward.total} ◆</b></div>`;
      setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — contract ${done} fulfilled! +${state.contract.reward} coins, +${reward.total} ◆.`);
      if (done < WIN_CONTRACTS) {
        state.contract = makeContract(rng, state.contractsFulfilled);
      }
    } else {
      addCoins(state.ledger, potion.value);
      const why = potion.effectKey !== state.contract.effectKey
        ? `The contract wants ${state.contract.effect}, not ${potion.effect}.`
        : `The contract wants quality ${state.contract.minQuality}; this is ${potion.quality}.`;
      $('result').innerHTML = `
        <div class="potion-name">${potion.name}</div>
        <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
        <div class="line">No match. ${why} Sold for <b>${potion.value} coins</b>.</div>`;
      setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — no match. Sold for ${potion.value} coins.`);
    }
  }

  render();
  if (state.contractsFulfilled >= WIN_CONTRACTS) {
    endGame(true);
  } else if (state.brewsLeft <= 0) {
    endGame(false);
  }
}

/**
 * A brew in tutorial mode: free (no brew spent, no coins, no Gems). The
 * potion goes into the recipe book, and the tutorial step advances.
 */
function brewTutorial(spec, outcome) {
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };

  if (!outcome.success) {
    state.runaways += 1;
    $('result').innerHTML = `
      <div class="bad">RUNAWAY REACTION!</div>
      <div class="line">The cauldron boiled over and the brew was lost. Volatility was ${outcome.prediction.volatility}, and the roll came up ${outcome.rolled} against a ${outcome.prediction.runawayChance}% runaway chance.</div>
      <div class="line muted">A runaway brews nothing, so it does not count toward the step. Stabilize, or use a cooler flame.</div>`;
    setEvent(`Runaway! A ${outcome.prediction.name} boiled over. Nothing brewed.`);
    render();
    return;
  }

  const potion = outcome.potion;
  recordBrew(state.recipes, potion);
  const res = recordTutorialBrew(state.tutorial, { spec, outcome });
  const tut = state.tutorial;

  if (res.allCompleted) {
    setTutorialDone();
    // The step only completes on the sold brew: the potion did not match
    // the contract, so show what it sold for (the §6 acceptance).
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
      <div class="line">It did not match the contract, so it sold for <b>${potion.value} coins</b> — that is what a non-matching potion is worth.</div>
      <div class="good">Tutorial complete! You brewed every step — order, affinity, flame, catalysts, and a contract.</div>
      <div class="line">The first real contract is waiting. Three contracts, twelve brews, and the cauldron is yours.</div>`;
    setEvent('Tutorial complete — all five steps brewed.');
  } else if (tut.stepIndex === 4 && tut.contracts.fulfilled && !tut.contracts.sold) {
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
      <div class="good">Contract fulfilled! The Brass Merchant would pay 110 coins.</div>
      <div class="line">Now brew a potion that does <b>not</b> match — a different effect, or too weak — and watch it sell instead.</div>`;
    setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — the Modest contract is fulfilled!`);
  } else if (res.stepCompleted) {
    const next = currentStep(tut);
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
      <div class="good">Step complete!</div>
      <div class="line">Next: <strong>${next.title}</strong> — ${next.instruction}</div>`;
    setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — step complete.`);
  } else {
    const step = currentStep(tut);
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
      <div class="line">${step.title} — keep going: ${step.instruction}</div>`;
    setEvent(`Brewed a ${potion.name} (quality ${potion.quality}).`);
  }

  render();
}

/**
 * Keyboard (brief §9). Keys do nothing harmful when their action is
 * unavailable — no-ops, with the button disabled state shown, never a
 * silent state change.
 */
function onKeyDown(e) {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (state.screen === 'howto') {
    if (key === 'Escape' || key === 'h') closeHowto();
    return;
  }
  if (state.screen === 'title') {
    if (key === 'h') {
      openHowto();
      return;
    }
    if (key === 'r' || key === 'Enter' || key === ' ') {
      e.preventDefault();
      begin();
    }
    return;
  }
  if (state.screen === 'end') {
    if (key === 'r') {
      e.preventDefault();
      newGame();
    } else if (key === 'Escape') {
      showScreen('title');
    }
    return;
  }
  // Play screen.
  if (key === 'Escape') {
    showScreen('title');
    return;
  }
  if (key === 'h') {
    openHowto();
    return;
  }
  if (key >= '1' && key <= '6') {
    const ing = INGREDIENTS[Number(key) - 1];
    if (ing) addIngredient(ing.id);
    return;
  }
  if (key === 'Backspace') {
    e.preventDefault();
    removeLastIngredient();
    return;
  }
  if (FLAME_KEYS[key]) {
    state.brew.temperature = FLAME_KEYS[key];
    render();
    return;
  }
  if (CATALYST_KEYS[key]) {
    state.brew.catalyst = CATALYST_KEYS[key];
    render();
    return;
  }
  if (key === 't') {
    stabilize();
    return;
  }
  if (key === ' ' || key === 'Enter') {
    // Space/Enter is Brew — prevent the focused button's own click so a
    // brew never fires twice from one press.
    e.preventDefault();
    brew();
  }
}

export function startGame() {
  $('btn-start').addEventListener('click', begin);
  $('btn-restart').addEventListener('click', newGame);
  $('btn-brew').addEventListener('click', brew);
  $('btn-stabilize').addEventListener('click', stabilize);
  $('btn-howto').addEventListener('click', openHowto);
  $('btn-howto-back').addEventListener('click', closeHowto);
  $('btn-recipes').addEventListener('click', openHowto);
  $('btn-skip-tutorial').addEventListener('click', skipTutorial);
  $('btn-tutorial-done').addEventListener('click', () => newGame({ keepRecipes: true }));
  document.addEventListener('keydown', onKeyDown);
  showScreen('title');
}
