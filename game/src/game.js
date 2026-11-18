// game.js — M4: state, UI, play loop.
// Brew 2-3 in order; match effect at quality to fulfil (+Gems).
// Fulfil 3 in 12 brews, pay debt (300).

import { AFFINITIES, CATALYSTS, EFFECTS, GEM_REWARD, INGREDIENTS, TEMPERATURES, ingredientById } from './data.js';
import { MAX_INGREDIENTS, MIN_INGREDIENTS, MAX_STABILIZATIONS, brewReaction, computeReaction } from './reaction.js';
import { computeGemReward, fulfilsContract, makeContract } from './contracts.js';
import { addCoins, addGems, createLedger } from './economy.js';
import { INGREDIENT_COST, STARTING_COINS, borrow, checkInvariant, createDebt, makePayment } from './debt.js';
import { computeMods, discountedPrice } from './relics.js';
import { availableRelics, buyRelic } from './shop.js';
import { TUTORIAL_CONTRACT, createTutorial, currentStep, recordTutorialBrew, stepChecklist } from './tutorial.js';
import { createRecipeBook, listRecipes, rarityOf, recordBrew, recipeCount } from './recipes.js';
import { isTutorialDone, loadBest, saveBest, setTutorialDone } from './storage.js';
import SPRITE_DATA, { createSpriteSet, drawText, textWidth } from './assets.js';
import { createSfx } from './sfx.js';

export const WIN_CONTRACTS = 3;
export const BREW_LIMIT = 12;

const SLOT_LABELS = ['1st — Base', '2nd — Modifier', '3rd — Finisher'];
const SLOT_ROLES = [
  'sets the potion’s effect',
  'sets its trait',
  'sets its twist',
];

// Keyboard map (brief §9). Every key has a visible mouse equivalent.
const FLAME_KEYS = { q: 'low', w: 'med', e: 'high' };
const FLAME_HINTS = { low: 'Q', med: 'W', high: 'E' };
const CATALYST_KEYS = { z: 'none', x: 'salt', c: 'wild' };
const CATALYST_HINTS = { none: 'Z', salt: 'X', wild: 'C' };

let rng = Math.random;

/** Test seam: seeded rng. */
export function setRng(fn) {
  rng = fn;
}

const sfx = createSfx();
let sprites = null;
let spritesFailed = false;

/** Test seam: the SFX object. */
export function getSfx() {
  return sfx;
}

/** Test seam: the baked sprite set. */
export function getSprites() {
  return sprites;
}

const state = {
  screen: 'title',
  mode: 'play', // 'play' | 'tutorial'
  tutorial: null,
  recipes: createRecipeBook(),
  returnTo: 'title',
  ledger: createLedger(),
  debt: createDebt(),
  ownedRelics: new Set(),
  discountPending: false,
  shopOpen: false,
  contractsFulfilled: 0,
  brewsLeft: BREW_LIMIT,
  runaways: 0,
  contract: null,
  brew: { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 },
  cauldronRunaway: false, // runaway sprite stays up until the next brew starts
  lastPotion: null, // last brewed potion (affinity picks the potion sprite frame)
  // M3 rework — contractor presentation (cosmetic only, §9).
  contractorPopupFor: null,
  contractorPopupShown: false,
  contractorLiveExpanded: false,
  contractorIrritation: 0,
  contractorReaction: null,
  payoffOpen: false, // outcome overlay (§5) — presentation only, never gates state
};

// Arrival lines are Luna's §8 drafts, verbatim; reactions are §9 flavor.
export const CONTRACTOR_ART = {
  'The Brass Merchant': { sprite: 'portrait_brass', img: 'assets/portrait-brass-merchant.webp', arrival: 'Got something worth selling?', reaction: 'That one stung the purse.' },
  'Madame Vex': { sprite: 'portrait_vex', img: 'assets/portrait-madame-vex.webp', arrival: 'I trust your last experiment survived.', reaction: 'Sloppy. Amusing, but sloppy.' },
  'The Clockmaker': { sprite: 'portrait_clock', img: 'assets/portrait-clockmaker.webp', arrival: 'Time is rather expensive today.', reaction: 'You waste good minutes.' },
  'Sister Anselm': { sprite: 'portrait_anselm', img: 'assets/portrait-sister-anselm.webp', arrival: 'May this transaction remain peaceful.', reaction: 'Patience, child. Breathe.' },
  'The Drowned Sailor': { sprite: 'portrait_sailor', img: 'assets/portrait-drowned-sailor.webp', arrival: 'The deep has strange demands.', reaction: 'The deep laughs at that one.' },
  'Baron Crowe': { sprite: 'portrait_crowe', img: 'assets/portrait-baron-crowe.webp', arrival: 'Do try not to disappoint me.', reaction: 'I expected better. I always do.' },
};

export const EFFECT_LIQUID = { fire: 8, cold: 9, earth: 10, air: 11, shadow: 12, light: 13 };

/** Test seam: state snapshot. */
export function getState() {
  const borrowBtn = $('btn-borrow');
  const shopBtn = $('btn-shop');
  const brewingName = $('brewing-name');
  return {
    screen: state.screen,
    coins: state.ledger.coins,
    gems: state.ledger.gems,
    debt: { ...state.debt },
    debtInvariant: checkInvariant(state.debt),
    ownedRelics: [...state.ownedRelics],
    discountPending: state.discountPending,
    shopOpen: state.shopOpen,
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
    brewingName: brewingName ? brewingName.textContent : null,
    hudDebt: $('hud-debt').textContent,
    borrowDisabled: borrowBtn ? borrowBtn.disabled : null,
    shopDisabled: shopBtn ? shopBtn.disabled : null,
    muted: sfx.isMuted(),
    cauldronVisual: cauldronVisual(),
    lastPotionAffinity: state.lastPotion ? state.lastPotion.affinity : null,
    contractorName: state.contract ? state.contract.client : null,
    contractorPopup: state.contractorPopupShown,
    contractorLiveExpanded: state.contractorLiveExpanded,
    contractorIrritation: state.contractorIrritation,
    contractorLine: state.contract
      ? (state.contractorReaction || (CONTRACTOR_ART[state.contract.client] || {}).arrival || null)
      : null,
    contractorPopupVisible: vis('contractor-popup', state.contractorPopupShown),
    contractorLiveVisible: vis('contractor-live', !state.contractorPopupShown && state.contract !== null),
    payoffOpen: state.payoffOpen,
    sfxPlayed: sfx.played(),
    sfxState: sfx.state,
  };
}

function $(id) {
  return document.getElementById(id);
}

/** Shim helper. */
function vis(id, fallback) {
  const el = $(id);
  return el ? !el.hidden : fallback;
}


function nowSeconds() {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now() / 1000
    : Date.now() / 1000;
}

function initSprites() {
  if (sprites || spritesFailed) return;
  try {
    sprites = createSpriteSet(SPRITE_DATA, 1);
  } catch (e) {
    sprites = null;
    spritesFailed = true;
  }
}

/** Cauldron visual. */
function cauldronVisual() {
  if (state.cauldronRunaway) return 'runaway';
  if (state.brew.ingredients.length > 0) return 'bubble';
  return 'idle';
}

function ctx2d(id) {
  const cv = $(id);
  if (!cv || typeof cv.getContext !== 'function') return null;
  try {
    return cv.getContext('2d');
  } catch (e) {
    return null;
  }
}

function drawSpriteOn(id, name, frame, scale) {
  if (!sprites) return;
  const cv = $(id);
  if (!cv) return;
  const ctx = ctx2d(id);
  if (!ctx) return;
  if (typeof ctx.clearRect === 'function') ctx.clearRect(0, 0, cv.width, cv.height);
  sprites.draw(ctx, name, frame, 0, 0, scale);
}

function drawIntoCanvas(cv, name, frame, scale) {
  if (!sprites || !cv || typeof cv.getContext !== 'function') return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  if (typeof ctx.clearRect === 'function') ctx.clearRect(0, 0, cv.width, cv.height);
  sprites.draw(ctx, name, frame, 0, 0, scale);
}

function currentContractForSigil() {
  if (state.mode === 'tutorial') {
    return state.tutorial && state.tutorial.stepIndex === 4 ? TUTORIAL_CONTRACT : null;
  }
  return state.contract;
}

const POTION_FRAME = { Pure: 0, Harmonious: 2, Violent: 4 };
const SHIMMER_FPS = 2;

// Visual only — never touches SFX or AudioContext.
let animRunning = false;
let animRafId = null;
let animTicks = 0;
let animDraws = 0;
let animLast = { cauldron: null, flame: null, potion: null, meter: null, workshop: null };

function drawSpriteAt(id, name, frame, scale, x, y) {
  if (!sprites) return;
  const ctx = ctx2d(id);
  if (ctx) sprites.draw(ctx, name, frame, x, y, scale);
}
function fillRectOn(id, colorIndex, x, y, w, h) {
  const ctx = ctx2d(id);
  if (!ctx || typeof ctx.fillRect !== 'function') return;
  ctx.fillStyle = SPRITE_DATA.palette[colorIndex];
  ctx.fillRect(x, y, w, h);
}
function bubbleFrame(t) { // plain 4 fps with no preview; faster as volatility climbs
  const p = preview();
  const mult = !p ? 1 : p.volatility < 20 ? 0.5 : p.volatility < 40 ? 1 : p.volatility < 60 ? 1.5 : 2;
  return sprites.frameAt('cauldron_bubble', t * mult);
}
function drawCauldronCanvas(t) {
  if (!sprites) return;
  const vis = cauldronVisual();
  const frame = vis === 'idle' ? 0 : vis === 'runaway'
    ? sprites.frameAt('cauldron_runaway', t) : bubbleFrame(t);
  const c = ctx2d('cauldron-canvas');
  if (c && typeof c.clearRect === 'function') c.clearRect(0, 0, 96, 80);
  const hero = $('cauldron-img');
  if (hero && hero.complete && hero.naturalWidth) {
    if (c) c.drawImage(hero, 0, 0, 96, 80);
  } else drawSpriteOn('cauldron-canvas', 'cauldron_idle', 0, 2);
  if (vis === 'bubble') {
    const first = state.brew.ingredients[0];
    if (first) {
      const liq = EFFECT_LIQUID[ingredientById(first).element];
      fillRectOn('cauldron-canvas', liq, 30, 23, 33, 1);
      fillRectOn('cauldron-canvas', liq, 26, 24, 45, 2);
      fillRectOn('cauldron-canvas', liq, 26, 26, 45, 2);
      fillRectOn('cauldron-canvas', liq, 28, 28, 41, 2);
      fillRectOn('cauldron-canvas', liq, 31, 30, 35, 2);
      fillRectOn('cauldron-canvas', 3, 33, 24, 4, 1);
    }
    drawSpriteAt('cauldron-canvas', 'cauldron_bubble', frame, 1, 34, 25);
    const p = preview();
    if (p && p.quality >= 70) {
      fillRectOn('cauldron-canvas', 13, 44, 24, 10, 2);
      if (p.quality >= 85) { fillRectOn('cauldron-canvas', 13, 36, 27, 2, 2); fillRectOn('cauldron-canvas', 13, 58, 27, 2, 2); }
    }
  } else if (vis === 'runaway') {
    fillRectOn('cauldron-canvas', 14, 30, 23, 33, 1);
    fillRectOn('cauldron-canvas', 14, 26, 24, 45, 2);
    fillRectOn('cauldron-canvas', 14, 26, 26, 45, 2);
    fillRectOn('cauldron-canvas', 14, 28, 28, 41, 2);
    fillRectOn('cauldron-canvas', 14, 31, 30, 35, 2);
    drawSpriteAt('cauldron-canvas', 'cauldron_runaway', frame, 1, 34, 25);
  }
  animLast.cauldron = `cauldron_${vis}:${frame}`;
  if (vis === 'runaway' && c) { fillRectOn('cauldron-canvas', 0, 19, 46, 58, 14); drawText(c, 'RUNAWAY', Math.round((96 - textWidth('RUNAWAY') * 2) / 2), 48, 7, 2); }
}
const WORKSHOP_TILES = [
  ['workshop_window', 6, 4], ['workshop_shelf', 48, 26], ['workshop_cat', 54, 14],
  ['workshop_herbs', 118, 2], ['workshop_shelf', 148, 28],
];
function drawWorkshopCanvas(t) {
  if (!sprites) return;
  const cv = $('workshop-canvas');
  if (!cv) return;
  const ctx = ctx2d('workshop-canvas');
  if (!ctx) return;
  if (typeof ctx.clearRect === 'function') ctx.clearRect(0, 0, cv.width, cv.height);
  fillRectOn('workshop-canvas', 1, 0, 0, 240, 40);
  fillRectOn('workshop-canvas', 2, 0, 40, 240, 8);
  for (const [name, x, y] of WORKSHOP_TILES) sprites.draw(ctx, name, 0, x, y, 2);
  const lamp = sprites.frameAt('workshop_lantern', t);
  sprites.draw(ctx, 'workshop_lantern', lamp, 212, 6, 2);
  animLast.workshop = `workshop_lantern:${lamp}`;
}

function drawMeterCanvas(t) {
  if (!sprites) return;
  const frame = sprites.frameAt('meter_ticks', t);
  drawSpriteOn('meter-canvas', 'meter_ticks', frame, 2);
  animLast.meter = `meter_ticks:${frame}`;
}

function drawPotionCanvas(t) {
  if (!sprites) return;
  const pcv = $('potion-canvas');
  if (!pcv) return;
  if (!state.lastPotion) {
    pcv.hidden = true;
    animLast.potion = null;
    return;
  }
  pcv.hidden = false;
  const frame = (POTION_FRAME[state.lastPotion.affinity] ?? 0) + (Math.floor(t * SHIMMER_FPS) % 2);
  drawSpriteOn('potion-canvas', 'potion', frame, 2);
  animLast.potion = `potion:${frame}`;
}

function renderSprites() {
  if (!sprites) return;
  const t = nowSeconds();
  drawWorkshopCanvas(t);
  drawCauldronCanvas(t);
  drawMeterCanvas(t);
  drawSpriteOn('coin-icon', 'coin', 0, 1);
  drawSpriteOn('gem-icon', 'gem', 0, 1);
  drawSpriteOn('seal-canvas', 'contract_seal', 0, 1);
  // Affinity sigil beside the DOM affinity line (never instead of it).
  const c = currentContractForSigil();
  if (c) drawSpriteOn('sigil-canvas', `sigil_${c.demandAffinityKey}`, 0, 1);
  drawPotionCanvas(t);
}

/** Frames at t. */
function animatedFrames(t) {
  const vis = cauldronVisual();
  return {
    cauldron: vis === 'idle' ? null : {
      name: `cauldron_${vis}`,
      frame: vis === 'runaway' ? sprites.frameAt('cauldron_runaway', t) : bubbleFrame(t),
    },
    potion: !state.lastPotion ? null : {
      name: 'potion',
      frame: (POTION_FRAME[state.lastPotion.affinity] ?? 0) + (Math.floor(t * SHIMMER_FPS) % 2),
    },
    meter: { name: 'meter_ticks', frame: sprites.frameAt('meter_ticks', t) },
    workshop: { name: 'workshop_lantern', frame: sprites.frameAt('workshop_lantern', t) },
  };
}

/** Anim step. */
export function animTick(t) {
  if (!sprites) return;
  if (state.screen !== 'play') return;
  if (typeof document !== 'undefined' && document.hidden) return;
  animTicks++;
  const f = animatedFrames(t);
  if (f.cauldron && animLast.cauldron !== `${f.cauldron.name}:${f.cauldron.frame}`) {
    drawCauldronCanvas(t);
    animDraws++;
  }
  if (animLast.meter !== `${f.meter.name}:${f.meter.frame}`) {
    drawMeterCanvas(t);
    animDraws++;
  }
  if (f.potion && animLast.potion !== `potion:${f.potion.frame}`) {
    drawPotionCanvas(t);
    animDraws++;
  }
  if (animLast.workshop !== `${f.workshop.name}:${f.workshop.frame}`) {
    drawWorkshopCanvas(t);
    animDraws++;
  }
}

function animLoop() {
  if (!animRunning) return;
  animTick(nowSeconds());
  if (!animRunning) return;
  if (typeof requestAnimationFrame === 'function') {
    animRafId = requestAnimationFrame(animLoop);
  } else {
    animRunning = false;
    animRafId = null;
  }
}

export function startAnimLoop() {
  if (animRunning) return;
  if (typeof requestAnimationFrame !== 'function') return;
  animRunning = true;
  animRafId = requestAnimationFrame(animLoop);
}

export function stopAnimLoop() {
  animRunning = false;
  if (animRafId !== null && typeof cancelAnimationFrame === 'function') {
    try { cancelAnimationFrame(animRafId); } catch (e) { /* callback already fired */ }
  }
  animRafId = null;
}

function onVisibilityChange() {
  if (typeof document === 'undefined') return;
  if (document.hidden) stopAnimLoop();
  else if (state.screen === 'play') startAnimLoop();
}

/** Test seam: animation loop state. */
export function getAnimState() {
  return {
    running: animRunning,
    ticks: animTicks,
    draws: animDraws,
    last: { ...animLast },
  };
}

/** Mute toggle. */
function toggleMute() {
  sfx.mute();
  updateMuteButton();
}

function updateMuteButton() {
  const btn = $('btn-mute');
  if (!btn) return;
  btn.innerHTML = `Sound: ${sfx.isMuted() ? 'off' : 'on'} <span class="key-hint">[M]</span>`;
}

function showScreen(name) {
  state.screen = name;
  $('screen-title').hidden = name !== 'title';
  $('screen-play').hidden = name !== 'play';
  $('screen-end').hidden = name !== 'end';
  $('screen-howto').hidden = name !== 'howto';
  if (name === 'play') startAnimLoop();
  else stopAnimLoop();
  if (name === 'title') renderTitle();
  if (name === 'howto') renderHowto();
}

function stars(quality) {
  const filled = Math.max(0, Math.min(5, Math.round(quality / 20)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/** Event strip. */
function setEvent(text) {
  $('event-strip').textContent = text;
}

function renderTitle() {
  const best = loadBest();
  $('best-result').textContent = best
    ? `Best result: ${best.contracts} contract${best.contracts === 1 ? '' : 's'} fulfilled · ${best.coins} coins`
    : 'No runs yet — the cauldron is waiting for its first brewer.';
  drawSpriteOn('title-cauldron', 'cauldron_idle', 0, 2);
}

function renderHowto() {
  const box = $('howto-recipes');
  const recipes = listRecipes(state.recipes);
  if (recipes.length === 0) {
    box.innerHTML = '<p class="muted">No reactions discovered yet — brew something and it will be written down here, with its affinity, quality, and volatility as last brewed.</p>';
  } else {
    box.innerHTML = recipes.map((r) => `
    <div class="recipe">
      <span class="recipe-name">${r.name}</span>
      <span class="recipe-meta">${r.affinity} · quality ${r.quality} · volatility ${r.volatility}${r.count > 1 ? ` · brewed ${r.count}×` : ''}</span>
    </div>`).join('');
  }
  renderGlossary();
}

/** Glossary (§6), display only: discovered recipes (rarity from personal best) + "?" silhouettes. */
function renderGlossary() {
  const g = $('howto-glossary');
  if (!g) return;
  const recipes = listRecipes(state.recipes);
  const total = 252;
  const missing = total - recipes.length;
  const shown = Math.min(60, missing);
  const rows = recipes.map((r) => {
    const rarity = rarityOf(r.best);
    return `<div class="recipe"><span class="recipe-name">${r.name}</span>`
      + `<span class="recipe-meta">${r.affinity} · <span class="rarity-${rarity.toLowerCase()}">${rarity}</span> · personal best ${r.best}</span></div>`;
  }).join('');
  g.innerHTML = `<p class="muted">Rarity: Common &lt;60 · Uncommon 60–69 · Rare 70–84 · Epic 85–94 · Legendary 95+ (by personal best).</p>`
    + `<p class="muted">${recipes.length} of ${total} reactions discovered.</p>`
    + (rows || '<p class="muted">Nothing discovered yet — brew something and it will be written down here.</p>')
    + (missing > 0 ? `<div class="gloss-undisc">${'<span class="gloss-q">?</span>'.repeat(shown)}${missing > shown ? `<span class="gloss-more">+${missing - shown} more yet undiscovered</span>` : ''}</div>` : '');
}

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
  $('btn-skip-tutorial').hidden = tut.stepIndex !== 0;
  $('btn-tutorial-done').hidden = true;
}

function openHowto() {
  sfx.play('click');
  state.returnTo = state.screen;
  showScreen('howto');
}

function closeHowto() {
  sfx.play('click');
  showScreen(state.returnTo === 'howto' ? 'title' : state.returnTo);
}

/** Volatility band (§4, presentation only — it never changes a probability). */
function volatilityBand(volatility) {
  if (volatility < 20) return { name: 'Controlled', color: 'var(--green)' };
  if (volatility < 40) return { name: 'Unstable', color: 'var(--yellow)' };
  if (volatility < 60) return { name: 'Dangerous', color: 'var(--orange)' };
  return { name: 'Critical', color: 'var(--red)' };
}

function resetRunState() {
  state.ledger = createLedger();
  state.ledger.coins = STARTING_COINS;
  state.debt = createDebt();
  state.ownedRelics = new Set();
  state.discountPending = false;
  state.shopOpen = false;
  state.contractorPopupFor = null;
  state.contractorPopupShown = false;
  state.contractorLiveExpanded = false;
  state.contractorIrritation = 0;
  state.contractorReaction = null;
  state.payoffOpen = false;
  const payoff = $('payoff-overlay');
  if (payoff) payoff.hidden = true;
  const overlay = $('shop-overlay');
  if (overlay) overlay.hidden = true;
}

function newGame(options = {}) {
  sfx.play('click');
  state.mode = 'play';
  state.tutorial = null;
  if (!options.keepRecipes) state.recipes = createRecipeBook();
  resetRunState();
  state.contractsFulfilled = 0;
  state.brewsLeft = BREW_LIMIT;
  state.runaways = 0;
  state.contract = makeContract(rng, 0);
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };
  state.cauldronRunaway = false;
  state.lastPotion = null;
  $('result').innerHTML = '<p class="muted">Nothing brewed yet. The cauldron is waiting.</p>';
  setEvent('');
  showScreen('play');
  render();
}

/** The tutorial (spec §6): 5 playable steps before the first real contract. */
function startTutorial() {
  sfx.play('click');
  state.mode = 'tutorial';
  state.tutorial = createTutorial();
  state.recipes = createRecipeBook();
  resetRunState();
  state.contractsFulfilled = 0;
  state.brewsLeft = BREW_LIMIT;
  state.runaways = 0;
  state.contract = null;
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };
  state.cauldronRunaway = false;
  state.lastPotion = null;
  $('result').innerHTML = '<p class="muted">The tutorial: brew what each step asks for. Tutorial brews are free — they spend no brews and no coins.</p>';
  setEvent('');
  showScreen('play');
  render();
}

/** Begin. */
function begin() {
  if (isTutorialDone()) newGame();
  else startTutorial();
}

/** Skip tutorial. */
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
  }, computeMods(state.ownedRelics));
}

function renderHud() {
  $('hud-coins').textContent = state.ledger.coins;
  $('hud-gems').textContent = state.ledger.gems;
  $('hud-debt').textContent = state.mode === 'tutorial' ? '—' : state.debt.D;
  $('hud-contracts').textContent = `${state.contractsFulfilled} / ${WIN_CONTRACTS}`;
  $('hud-brews').textContent = state.brewsLeft;
  updateMuteButton();
  const borrowBtn = $('btn-borrow');
  if (borrowBtn) {
    borrowBtn.disabled = state.mode !== 'play' || state.debt.loanOutstanding;
    borrowBtn.title = state.mode !== 'play'
      ? 'No debt in the tutorial'
      : state.debt.loanOutstanding
        ? 'A loan is already outstanding'
        : 'Borrow 50 coins from the Creditor — adds 50 to your debt, 13 interest at the next payment';
  }
  const shopBtn = $('btn-shop');
  if (shopBtn) {
    shopBtn.disabled = state.mode !== 'play' || state.brew.ingredients.length > 0;
    shopBtn.title = state.mode !== 'play'
      ? 'The shop opens in a real run'
      : state.brew.ingredients.length > 0
        ? 'Empty the cauldron first — the shop is for between brews'
        : 'Spend Gems on relics';
  }
}

/** Contract card HTML. */
function renderContractCard(c) {
  const aff = AFFINITIES[c.demandAffinityKey];
  const scaling = GEM_REWARD.scaling[Math.min(c.index, GEM_REWARD.scaling.length - 1)];
  const qGems = Math.round(GEM_REWARD.quality * scaling);
  const aGems = Math.round(GEM_REWARD.affinity * scaling);
  const art = CONTRACTOR_ART[c.client];
  return `
    ${art ? `<img class="contract-portrait" src="${art.img}" alt="">` : ''}
    <div class="client">${c.client}</div>
    <div class="want">${c.want}</div>
    <div class="demand">Wants a <strong>${c.effect}</strong> potion of quality
      <strong>${c.minQuality}</strong> or better <span class="muted">(${c.tier})</span>.</div>
    <div class="demand-aff" style="color:${aff.color}"><canvas id="sigil-canvas" class="sigil" width="12" height="12"></canvas>${aff.icon} Demanded affinity: <strong>${aff.name}</strong></div>
    <div class="demand-gems">Gems on fulfilment: +${qGems} ◆ quality · +${aGems} ◆ affinity (×${scaling}) — up to ${qGems + aGems} ◆</div>
    <div class="reward">Reward: ${c.reward} coins</div>`;
}

function renderContract() {
  if (state.mode === 'tutorial') {
    if (state.tutorial && state.tutorial.stepIndex === 4) {
      $('contract-card').innerHTML = renderContractCard(TUTORIAL_CONTRACT);
      return;
    }
    // more — the step itself lives only in the tutorial banner (§4).
    $('contract-card').innerHTML = '<div class="muted">No contract yet — the tutorial comes first.</div>';
    return;
  }
  $('contract-card').innerHTML = renderContractCard(state.contract);
}

// Irritation (§9) is cosmetic only: pips + reaction line, no effect on numbers.
function noteMistake() {
  if (state.mode !== 'play' || !state.contract) return;
  if (state.contractorIrritation < 3) state.contractorIrritation += 1;
  const art = CONTRACTOR_ART[state.contract.client];
  if (art) state.contractorReaction = art.reaction;
  // The portrait reacts visibly to the mistake (cosmetic only, §7).
  const him = $('contractor-head-img');
  if (him && him.className.indexOf('react') < 0) {
    him.className += ' react';
    setTimeout(() => { him.className = him.className.replace(' react', ''); }, 550);
  }
  sfx.play('dialogue');
}
function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
function setHidden(id, hidden) { const el = $(id); if (el) el.hidden = hidden; }
function setImg(id, src) { const el = $(id); if (el) el.src = src; }

function renderContractor() {
  const popup = $('contractor-popup');
  const live = $('contractor-live');
  if (state.mode !== 'play' || !state.contract) {
    if (popup) popup.hidden = true;
    if (live) live.hidden = true;
    return;
  }
  const c = state.contract;
  const art = CONTRACTOR_ART[c.client] || CONTRACTOR_ART['The Brass Merchant'];
  if (state.contractorPopupFor !== c.id) {
    state.contractorPopupFor = c.id;
    state.contractorIrritation = 0;
    state.contractorReaction = null;
    state.contractorPopupShown = true;
    sfx.play('arrival');
    sfx.play('dialogue');
  }
  const line = state.contractorReaction || art.arrival;
  setHidden('contractor-popup', !state.contractorPopupShown);
  if (state.contractorPopupShown) {
    setText('contractor-name', c.client);
    setText('contractor-order', `${c.want} Wants a ${c.effect} potion, quality ${c.minQuality} or better. Reward: ${c.reward} coins.`);
    setText('contractor-bubble', `“${line}”`);
    drawSpriteOn('contractor-portrait', art.sprite, 0, 2);
    setImg('contractor-portrait-img', art.img);
  }
  setHidden('contractor-live', state.contractorPopupShown);
  if (!state.contractorPopupShown) {
    setText('contractor-summary', `${c.client} — ${c.effect} ${c.minQuality}+ · ${c.reward} coins`);
    const ir = $('contractor-irritation');
    if (ir) ir.innerHTML = [0, 1, 2].map((i) => `<span class="${i < state.contractorIrritation ? 'pip-lit' : 'pip-dim'}">●</span>`).join('');
    setText('contractor-reaction', state.contractorReaction ? `“${state.contractorReaction}”` : '');
    setHidden('contractor-details', !state.contractorLiveExpanded);
    if (state.contractorLiveExpanded) {
      const dt = $('contractor-details');
      if (dt) dt.innerHTML = `<div class="line">Contractor: <strong>${c.client}</strong></div><div class="line">Wanted effect: <strong>${c.effect}</strong></div><div class="line">Quality: <strong>${c.minQuality}</strong> or better (${c.tier})</div><div class="line">Reward: <strong>${c.reward} coins</strong></div>`;
    }
    setText('btn-contractor-list', state.contractorLiveExpanded ? 'Hide order' : 'Order');
    drawSpriteOn('contractor-head', art.sprite, 0, 1);
    setImg('contractor-head-img', art.img);
  }
}

// Outcome payoff (§5): centred potion, stamp, stars, reward lines, one
// dismiss button. Presentation only — rewards are already settled; in the
// Node test shims the overlay element does not exist, so this no-ops there.
function showPayoff(o) {
  const ov = $('payoff-overlay');
  if (!ov) return;
  state.payoffOpen = true;
  ov.hidden = false;
  const stars = $('payoff-stars');
  if (stars) stars.style.visibility = o.kind === 'fulfilled' ? 'visible' : 'hidden';
  const pc = $('payoff-potion');
  if (pc) pc.hidden = o.kind === 'runaway';
  setText('payoff-stamp', o.stamp);
  const stamp = $('payoff-stamp');
  if (stamp) stamp.className = `payoff-stamp stamp-${o.kind}`;
  setText('payoff-title', o.title);
  const lines = $('payoff-lines');
  if (lines) lines.innerHTML = o.lines.map((l) => `<div class="line">${l}</div>`).join('');
  if (o.kind !== 'runaway') drawSpriteOn('payoff-potion', 'potion', o.frame ?? 0, 4);
}
function dismissPayoff() {
  state.payoffOpen = false;
  setHidden('payoff-overlay', true);
}
/** The brew moment reads as a reaction: the cauldron pops once (§2). */
function brewPop() {
  const art = $('cauldron-art');
  if (!art || art.className.indexOf('brew-pop') >= 0) return;
  art.className += ' brew-pop';
  setTimeout(() => { art.className = art.className.replace(' brew-pop', ''); }, 650);
}

function renderCauldron() {
  const slots = $('cauldron-slots');
  slots.innerHTML = '';
  for (let i = 0; i < MAX_INGREDIENTS; i++) {
    const id = state.brew.ingredients[i];
    const slot = document.createElement('div');
    slot.className = 'slot' + (id ? ' filled' : '');
    const pos = document.createElement('span');
    pos.className = 'pos';
    pos.textContent = SLOT_LABELS[i];
    slot.appendChild(pos);
    if (id) {
      const ing = INGREDIENTS.find((item) => item.id === id);
      const cv = document.createElement('canvas');
      cv.className = 'ing-sprite';
      cv.width = 16;
      cv.height = 16;
      slot.appendChild(cv);
      const nm = document.createElement('span');
      nm.className = 'ing-name';
      nm.textContent = ing.name;
      slot.appendChild(nm);
      const el = document.createElement('span');
      el.className = 'ing-el';
      el.textContent = `${ing.element} · ${SLOT_ROLES[i]}`;
      slot.appendChild(el);
      drawIntoCanvas(cv, `ing_${id}`, 0, 1);
      slot.title = 'Click to take it back out';
      slot.addEventListener('click', () => {
        state.brew.ingredients.splice(i, 1);
        state.brew.stabilizations = 0;
        if (state.mode === 'play') state.ledger.coins += INGREDIENT_COST; // refund
        sfx.play('click');
        render();
      });
    } else {
      const el = document.createElement('span');
      el.className = 'ing-el';
      el.textContent = SLOT_ROLES[i];
      slot.appendChild(el);
      const empty = document.createElement('span');
      empty.className = 'muted';
      empty.textContent = 'empty';
      slot.appendChild(empty);
    }
    slots.appendChild(slot);
  }
  const n = state.brew.ingredients.length;
  const h = $('brew-hint');
  if (h) h.style.visibility = n ? 'hidden' : '';
  const c = $('col-centre');
  if (c) c.className = n ? 'col-centre brewing' : 'col-centre';
}

function renderShelf() {
  const shelf = $('ingredient-shelf');
  shelf.innerHTML = '';
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const ing = INGREDIENTS[i];
    const card = document.createElement('button');
    card.className = 'ing-card' + (state.brew.ingredients.includes(ing.id) ? ' in-cauldron' : '');
    card.disabled = state.brew.ingredients.length >= MAX_INGREDIENTS
      || (state.mode === 'play' && state.ledger.coins < INGREDIENT_COST);
    card.innerHTML = `
      <span class="key-hint">[${i + 1}]</span>
      <span class="ing-name">${ing.name}</span>
      <span class="ing-el">${ing.element}</span>
      <span class="ing-pot">Potency ${ing.potency}</span>
      <span class="ing-cost">${state.mode === 'play' ? `${INGREDIENT_COST} coins` : 'Free'}</span>
      <span class="ing-blurb">${ing.blurb}</span>`;
    const cv = document.createElement('canvas');
    cv.className = 'ing-sprite';
    cv.width = 16;
    cv.height = 16;
    card.appendChild(cv);
    drawIntoCanvas(cv, `ing_${ing.id}`, 0, 1);
    card.addEventListener('click', () => addIngredient(ing.id));
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
    if (containerId === 'catalyst-buttons' && opt.id !== 'none') {
      const cv = document.createElement('canvas');
      cv.className = 'catalyst-sprite';
      cv.width = 12;
      cv.height = 12;
      btn.appendChild(cv);
      drawIntoCanvas(cv, `catalyst_${opt.id}`, 0, 1);
    }
    btn.addEventListener('click', () => onPick(opt.id));
    container.appendChild(btn);
  }
}

function renderPreview() {
  const box = $('preview');
  const p = preview();
  $('btn-brew').disabled = !canBrew();
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
  renderContractor();
  renderCauldron();
  renderShelf();
  renderChoiceButtons('temp-buttons', TEMPERATURES, state.brew.temperature, FLAME_HINTS, (id) => {
    if (state.brew.temperature !== id) {
      state.brew.temperature = id;
      sfx.play('click');
    }
    render();
  });
  renderChoiceButtons('catalyst-buttons', CATALYSTS, state.brew.catalyst, CATALYST_HINTS, (id) => {
    if (state.brew.catalyst !== id) {
      state.brew.catalyst = id;
      sfx.play('click');
    }
    render();
  });
  renderPreview();
  const brewingName = $('brewing-name');
  if (brewingName) {
    const first = state.brew.ingredients[0];
    brewingName.textContent = first
      ? `Brewing: ${EFFECTS[ingredientById(first).element].name}`
      : 'No potion brewing';
  }
  if (state.shopOpen) renderShop();
  renderSprites();
}

/** End run. */
function endGame(kind) {
  const won = kind === 'win';
  sfx.play(won ? 'win' : 'lose');
  saveBest(state.contractsFulfilled, state.ledger.coins);
  closeShop();
  const used = BREW_LIMIT - state.brewsLeft;
  const titles = {
    win: 'The contracts are fulfilled!',
    hollow: 'The Creditor takes the laboratory.',
    out: 'Out of brews.',
    softlock: 'No coins, no credit.',
  };
  const texts = {
    win: 'Three clients paid, three potions delivered, and the cauldron is still in one piece.',
    hollow: 'Three contracts fulfilled, but the debt remains — a hollow victory.',
    out: 'The cauldron is cold and the contracts are unfulfilled.',
    softlock: 'You cannot afford to brew and cannot borrow. The laboratory falls silent.',
  };
  $('end-title').textContent = titles[kind];
  $('end-text').textContent = texts[kind];
  $('end-stats').textContent = `Coins: ${state.ledger.coins} · Gems: ${state.ledger.gems} ◆ · Contracts fulfilled: ${state.contractsFulfilled} / ${WIN_CONTRACTS} · Brews used: ${used} / ${BREW_LIMIT} · Runaways: ${state.runaways}`
    + (kind === 'hollow' ? ` · Debt remaining: ${state.debt.D}` : '');
  showScreen('end');
}


/** Open shop. */
function openShop() {
  const overlay = $('shop-overlay');
  if (!overlay || state.mode !== 'play' || state.brew.ingredients.length > 0) return;
  state.shopOpen = true;
  overlay.hidden = false;
  renderShop();
}

function closeShop() {
  state.shopOpen = false;
  const overlay = $('shop-overlay');
  if (overlay) overlay.hidden = true;
}

function renderShop() {
  const list = $('shop-list');
  if (!list) return;
  const gemsEl = $('shop-gems');
  if (gemsEl) {
    gemsEl.textContent = `You hold ${state.ledger.gems} ◆.`
      + (state.discountPending ? ' Pawn Ticket: your next relic costs 3 ◆ less.' : '');
  }
  list.innerHTML = '';
  for (const relic of availableRelics(state.ownedRelics, state.contractsFulfilled)) {
    const row = document.createElement('div');
    row.className = 'shop-row';
    const icon = document.createElement('img');
    icon.className = 'shop-icon';
    icon.src = relic.icon;
    icon.alt = '';
    row.appendChild(icon);
    const main = document.createElement('div');
    main.className = 'shop-main';
    const price = discountedPrice(relic, state.discountPending && relic.id !== 'pawn-ticket');
    const name = document.createElement('span');
    name.className = 'shop-name';
    name.textContent = `${relic.name} · ${relic.rarity} · ${price} ◆`;
    main.appendChild(name);
    const text = document.createElement('span');
    text.className = 'shop-text';
    text.textContent = relic.text;
    main.appendChild(text);
    row.appendChild(main);
    const btn = document.createElement('button');
    btn.className = 'btn small';
    if (relic.greyed) {
      btn.disabled = true;
      btn.textContent = relic.greyReason;
    } else if (state.ledger.gems < price) {
      btn.disabled = true;
      btn.textContent = `Buy — need ${price - state.ledger.gems} ◆ more`;
    } else {
      btn.textContent = `Buy for ${price} ◆`;
      btn.addEventListener('click', () => {
        const res = buyRelic(state, relic.id);
        if (res.ok) {
          sfx.play('click');
          setEvent(`Bought ${relic.name} for ${res.price} ◆ — its effect applies for the rest of the run.`);
        }
        render();
      });
    }
    row.appendChild(btn);
    list.appendChild(row);
  }
}

function borrowCoins() {
  if (state.mode !== 'play') return;
  if (!borrow(state.debt, state.ledger)) return;
  sfx.play('click');
  setEvent('Borrowed 50 coins. The debt grows by 50, and 13 interest falls due at the next payment.');
  render();
}

function addIngredient(id) {
  if (state.shopOpen) return;
  if (state.brew.ingredients.length >= MAX_INGREDIENTS) return;
  if (state.mode === 'play' && state.ledger.coins < INGREDIENT_COST) return;
  if (state.mode === 'play') state.ledger.coins -= INGREDIENT_COST;
  state.brew.ingredients.push(id);
  state.brew.stabilizations = 0;
  state.cauldronRunaway = false; // filling the cauldron again starts the next brew
  sfx.play('click');
  render();
}

function removeLastIngredient() {
  if (state.brew.ingredients.length === 0) return;
  state.brew.ingredients.pop();
  state.brew.stabilizations = 0;
  if (state.mode === 'play') state.ledger.coins += INGREDIENT_COST; // refund
  sfx.play('click');
  render();
}

function stabilize() {
  if (state.brew.ingredients.length < MIN_INGREDIENTS) return;
  if (state.brew.stabilizations >= MAX_STABILIZATIONS) return;
  const p = preview();
  if (!p || p.volatility <= 0) return;
  // A stabilize on a 0%-chance brew cools nothing — a wasted stabilize (§9).
  const wasted = p.runawayChance === 0;
  state.brew.stabilizations += 1;
  if (wasted) noteMistake();
  sfx.play('click');
  render();
}

function brew() {
  if (!canBrew() || state.shopOpen) return;
  const mods = computeMods(state.ownedRelics);
  const spec = {
    ingredients: [...state.brew.ingredients],
    temperature: state.brew.temperature,
    catalyst: state.brew.catalyst,
    stabilizations: state.brew.stabilizations,
  };
  const outcome = brewReaction(spec, rng, mods);
  sfx.play('brew');
  if (!outcome.success) {
    sfx.play('runaway');
    state.cauldronRunaway = true;
    state.lastPotion = null;
  } else {
    state.cauldronRunaway = false;
    state.lastPotion = outcome.potion;
    const c = state.mode === 'tutorial'
      ? (state.tutorial && state.tutorial.stepIndex === 4 ? TUTORIAL_CONTRACT : null)
      : state.contract;
    if (c && fulfilsContract(outcome.potion, c)) sfx.play('fulfil');
  }
  if (state.mode === 'tutorial') {
    brewTutorial(spec, outcome);
    return;
  }
  state.brewsLeft -= 1;
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };

  if (!outcome.success) {
    state.runaways += 1;
    noteMistake(); // a runaway brew is a visible mistake (§9)
    $('result').innerHTML = `
      <div class="bad">RUNAWAY REACTION!</div>
      <div class="line">The cauldron boiled over and the brew was lost. Volatility was ${outcome.prediction.volatility}, and the roll came up ${outcome.rolled} against a ${outcome.prediction.runawayChance}% runaway chance.</div>
      <div class="line muted">High volatility is powerful, but it bites. Stabilize, or use a cooler flame.</div>`;
    setEvent(`Runaway! A ${outcome.prediction.name} boiled over. Ingredients lost.`);
    showPayoff({ kind: 'runaway', stamp: 'RUNAWAY', title: 'Runaway reaction', lines: ['The cauldron boiled over and the brew was lost.', `Volatility was ${outcome.prediction.volatility}, roll ${outcome.rolled} vs ${outcome.prediction.runawayChance}%.`] });
  } else {
    const potion = outcome.potion;
    recordBrew(state.recipes, potion);
    const fulfilled = fulfilsContract(potion, state.contract);
    if (fulfilled) {
      // While in arrears, the coin reward is cut 10% (floor) at fulfilment. Gems are never cut.
      const fullReward = state.contract.reward;
      const cut = state.debt.inArrears;
      const reward = cut ? Math.floor(fullReward * 0.9) : fullReward;
      const gemReward = computeGemReward(state.contract, potion);
      addCoins(state.ledger, reward);
      addGems(state.ledger, gemReward.total);
      state.contractsFulfilled += 1;
      const done = state.contractsFulfilled;
      const pay = makePayment(state.debt, state.ledger, done === WIN_CONTRACTS);
      const payLine = pay.shortfall > 0
        ? `<div class="line">The Creditor takes ${pay.paid} coins, but ${pay.shortfall} short — ${pay.interest} interest, ${pay.carry} carried to the next payment. Debt: ${state.debt.D}.</div>`
        : `<div class="line">The Creditor takes ${pay.paid} coins.${pay.loanInterest > 0 ? ` (Includes ${pay.loanInterest} loan interest.)` : ''} Debt remaining: ${state.debt.D}.</div>`;
      $('result').innerHTML = `
        <div class="potion-name">${potion.name}</div>
        <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
        <div class="good">Contract fulfilled! ${state.contract.client} pays ${reward} coins.${cut ? ` (10% in-arrears cut — was ${fullReward}.)` : ''}</div>
        <div class="line">Gems: +${gemReward.quality} ◆ quality · +${gemReward.affinity} ◆ affinity (×${gemReward.scaling}) — <b>${gemReward.total} ◆</b></div>
        ${payLine}`;
      setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — contract ${done} fulfilled! +${reward} coins, +${gemReward.total} ◆. Creditor took ${pay.paid}; debt ${state.debt.D}.`);
      showPayoff({ kind: 'fulfilled', stamp: 'FULFILLED', frame: POTION_FRAME[potion.affinity], title: potion.name, lines: [`Contract fulfilled! ${state.contract.client} pays ${reward} coins.`, `Gems: +${gemReward.total} ◆`, `The Creditor takes ${pay.paid} coins. Debt remaining: ${state.debt.D}.`] });
      if (done < WIN_CONTRACTS) {
        state.contract = makeContract(rng, state.contractsFulfilled);
        openShop(); // the shop auto-opens after C1 and C2, once the next contract is drawn
      }
    } else {
      addCoins(state.ledger, potion.value);
      const why = potion.effectKey !== state.contract.effectKey
        ? `The contract wants ${state.contract.effect}, not ${potion.effect}.`
        : `The contract wants quality ${state.contract.minQuality}; this is ${potion.quality}.`;
      // A wrong-effect potion is a visible mistake (§9); a too-weak one is not.
      if (potion.effectKey !== state.contract.effectKey) noteMistake();
      $('result').innerHTML = `
        <div class="potion-name">${potion.name}</div>
        <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
        <div class="line">No match. ${why} Sold for <b>${potion.value} coins</b>.</div>`;
      setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — no match. Sold for ${potion.value} coins.`);
      showPayoff({ kind: 'sold', stamp: 'SOLD', frame: POTION_FRAME[potion.affinity], title: potion.name, lines: [`No match. ${why}`, `Sold for ${potion.value} coins.`] });
    }
  }

  brewPop();
  render();
  if (state.contractsFulfilled >= WIN_CONTRACTS) {
    endGame(state.debt.D === 0 ? 'win' : 'hollow');
  } else if (state.brewsLeft <= 0) {
    endGame('out');
  } else if (state.brewsLeft > 0 && state.brew.ingredients.length === 0
    && state.ledger.coins < 10 && state.debt.loanOutstanding) {
    endGame('softlock'); // cannot load a 2-ingredient brew, and cannot borrow
  }
}

/** Tutorial brew: free. */
function brewTutorial(spec, outcome) {
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };

  if (!outcome.success) {
    state.runaways += 1;
    $('result').innerHTML = `
      <div class="bad">RUNAWAY REACTION!</div>
      <div class="line">The cauldron boiled over and the brew was lost. Volatility was ${outcome.prediction.volatility}, and the roll came up ${outcome.rolled} against a ${outcome.prediction.runawayChance}% runaway chance.</div>
      <div class="line muted">A runaway brews nothing, so it does not count toward the step. Stabilize, or use a cooler flame.</div>`;
    setEvent(`Runaway! A ${outcome.prediction.name} boiled over. Nothing brewed.`);
    showPayoff({ kind: 'runaway', stamp: 'RUNAWAY', title: 'Runaway reaction', lines: ['The cauldron boiled over and the brew was lost.', `Volatility was ${outcome.prediction.volatility}, roll ${outcome.rolled} vs ${outcome.prediction.runawayChance}%.`] });
    brewPop();
    render();
    return;
  }

  const potion = outcome.potion;
  recordBrew(state.recipes, potion);
  const res = recordTutorialBrew(state.tutorial, { spec, outcome });
  const tut = state.tutorial;

  if (res.allCompleted) {
    setTutorialDone();
    // The step completes only on the sold brew — show what it sold for (§6).
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
      <div class="line">It did not match the contract, so it sold for <b>${potion.value} coins</b> — that is what a non-matching potion is worth.</div>
      <div class="good">Tutorial complete! You brewed every step — order, affinity, flame, catalysts, and a contract.</div>
      <div class="line">The first real contract is waiting. Three contracts, twelve brews, and the cauldron is yours.</div>`;
    setEvent('Tutorial complete — all five steps brewed.');
    showPayoff({ kind: 'sold', stamp: 'SOLD', frame: POTION_FRAME[potion.affinity], title: potion.name, lines: [`It did not match, so it sold for ${potion.value} coins.`, 'Tutorial complete! You brewed every step — order, affinity, flame, catalysts, and a contract.'] });
  } else if (tut.stepIndex === 4 && tut.contracts.fulfilled && !tut.contracts.sold) {
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
      <div class="good">Contract fulfilled! The Brass Merchant would pay 110 coins.</div>`;
    setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — the Modest contract is fulfilled!`);
    showPayoff({ kind: 'fulfilled', stamp: 'FULFILLED', frame: POTION_FRAME[potion.affinity], title: potion.name, lines: ['Contract fulfilled! The Brass Merchant would pay 110 coins.'] });
  } else if (res.stepCompleted) {
    // The next step lives only in the banner above — never repeated here (§4).
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
      <div class="good">Step complete!</div>`;
    setEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — step complete.`);
  } else {
    $('result').innerHTML = `
      <div class="potion-name">${potion.name}</div>
      <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>`;
    setEvent(`Brewed a ${potion.name} (quality ${potion.quality}).`);
  }

  brewPop();
  render();
}

/** Keyboard (§9): keys do nothing harmful when unavailable — no-ops only. */
function onKeyDown(e) {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (key === 'm') {
    toggleMute();
    return;
  }

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
      sfx.play('click');
      showScreen('title');
    }
    return;
  }
  // shop, so Space/Enter/Escape close it instead of brewing (§5).
  if (state.payoffOpen) {
    if (key === 'Escape' || key === ' ' || key === 'Enter') dismissPayoff();
    return;
  }
  // Play screen. While the shop is open, only Escape closes it (M stays live).
  if (state.shopOpen) {
    if (key === 'Escape') {
      closeShop();
      render();
    }
    return;
  }
  if (key === 'Escape') {
    sfx.play('click');
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
    if (state.brew.temperature !== FLAME_KEYS[key]) {
      state.brew.temperature = FLAME_KEYS[key];
      sfx.play('click');
    }
    render();
    return;
  }
  if (CATALYST_KEYS[key]) {
    if (state.brew.catalyst !== CATALYST_KEYS[key]) {
      state.brew.catalyst = CATALYST_KEYS[key];
      sfx.play('click');
    }
    render();
    return;
  }
  if (key === 't') {
    stabilize();
    return;
  }
  if (key === ' ' || key === 'Enter') {
    // brew never fires twice from one press.
    e.preventDefault();
    brew();
  }
}

export function startGame() {
  initSprites();
  document.addEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('pointerdown', () => sfx.unlock());
  document.addEventListener('keydown', () => sfx.unlock());
  $('btn-start').addEventListener('click', begin);
  $('btn-restart').addEventListener('click', newGame);
  $('btn-brew').addEventListener('click', brew);
  $('btn-stabilize').addEventListener('click', stabilize);
  $('btn-howto').addEventListener('click', openHowto);
  $('btn-howto-back').addEventListener('click', closeHowto);
  $('btn-recipes').addEventListener('click', openHowto);
  $('btn-skip-tutorial').addEventListener('click', skipTutorial);
  $('btn-tutorial-done').addEventListener('click', () => newGame({ keepRecipes: true }));
  const muteBtn = $('btn-mute');
  if (muteBtn) muteBtn.addEventListener('click', toggleMute);
  const borrowBtn = $('btn-borrow');
  if (borrowBtn) borrowBtn.addEventListener('click', borrowCoins);
  const shopBtn = $('btn-shop');
  if (shopBtn) shopBtn.addEventListener('click', openShop);
  const shopCloseBtn = $('btn-shop-close');
  if (shopCloseBtn) shopCloseBtn.addEventListener('click', () => {
    sfx.play('click');
    closeShop();
  });
  const contractorMinBtn = $('btn-contractor-minimize');
  if (contractorMinBtn) contractorMinBtn.addEventListener('click', () => {
    state.contractorPopupShown = false;
    sfx.play('click');
    render();
  });
  const contractorListBtn = $('btn-contractor-list');
  if (contractorListBtn) contractorListBtn.addEventListener('click', () => {
    state.contractorLiveExpanded = !state.contractorLiveExpanded;
    sfx.play('click');
    render();
  });
  const payoffBtn = $('btn-payoff-close');
  if (payoffBtn) payoffBtn.addEventListener('click', () => {
    sfx.play('click');
    dismissPayoff();
  });
  const payoffOv = $('payoff-overlay');
  if (payoffOv) payoffOv.addEventListener('click', (e) => {
    if (e.target === payoffOv) dismissPayoff();
  });
  document.addEventListener('keydown', onKeyDown);
  showScreen('title');
}
