// game.js — The Alchemist's Debt, reaction prototype.
// Game state, UI wiring, and the play loop. The reaction rules live in
// reaction.js and the contracts in contracts.js; this file only moves
// state around and renders it.
//
// The loop: pick 2-3 ingredients in order, set the flame, pick a
// catalyst, watch the preview, stabilize if the reaction looks too wild,
// then brew. A brew that matches the contract's effect at its quality
// fulfils it. Fulfil 3 contracts before the 12 brews run out.

import { CATALYSTS, INGREDIENTS, TEMPERATURES } from './data.js';
import { MAX_INGREDIENTS, MIN_INGREDIENTS, MAX_STABILIZATIONS, brewReaction, computeReaction } from './reaction.js';
import { fulfilsContract, makeContract } from './contracts.js';

export const WIN_CONTRACTS = 3;
export const BREW_LIMIT = 12;

const SLOT_LABELS = ['1st — Base', '2nd — Modifier', '3rd — Finisher'];
const SLOT_ROLES = [
  'sets the potion’s effect',
  'sets its trait',
  'sets its twist',
];

const state = {
  screen: 'title',
  coins: 0,
  contractsFulfilled: 0,
  brewsLeft: BREW_LIMIT,
  contract: null,
  brew: { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 },
  result: null,
  log: [],
};

function $(id) {
  return document.getElementById(id);
}

function showScreen(name) {
  state.screen = name;
  $('screen-title').hidden = name !== 'title';
  $('screen-play').hidden = name !== 'play';
  $('screen-end').hidden = name !== 'end';
}

function stars(quality) {
  const filled = Math.max(0, Math.min(5, Math.round(quality / 20)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function logEvent(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 6);
  $('log').innerHTML = state.log.map((line) => `<li>${line}</li>`).join('');
}

function newGame() {
  state.coins = 0;
  state.contractsFulfilled = 0;
  state.brewsLeft = BREW_LIMIT;
  state.contract = makeContract();
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };
  state.result = null;
  state.log = [];
  $('log').innerHTML = '';
  $('result').innerHTML = '<p class="muted">Nothing brewed yet. The cauldron is waiting.</p>';
  showScreen('play');
  render();
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
  $('hud-coins').textContent = state.coins;
  $('hud-contracts').textContent = `${state.contractsFulfilled} / ${WIN_CONTRACTS}`;
  $('hud-brews').textContent = state.brewsLeft;
}

function renderContract() {
  const c = state.contract;
  $('contract-card').innerHTML = `
    <div class="client">${c.client}</div>
    <div class="want">${c.want}</div>
    <div class="demand">Wants a <strong>${c.effect}</strong> potion of quality
      <strong>${c.minQuality}</strong> or better <span class="muted">(${c.tier})</span>.</div>
    <div class="reward">Reward: ${c.reward} coins</div>`;
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
  for (const ing of INGREDIENTS) {
    const card = document.createElement('button');
    card.className = 'ing-card';
    card.disabled = state.brew.ingredients.length >= MAX_INGREDIENTS;
    card.innerHTML = `
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

function renderChoiceButtons(containerId, options, currentId, onPick) {
  const container = $(containerId);
  container.innerHTML = '';
  for (const opt of Object.values(options)) {
    const btn = document.createElement('button');
    btn.className = 'btn' + (opt.id === currentId ? ' selected' : '');
    btn.textContent = opt.name;
    btn.title = opt.desc;
    btn.addEventListener('click', () => onPick(opt.id));
    container.appendChild(btn);
  }
}

function meterColor(volatility) {
  if (volatility >= 70) return 'var(--red)';
  if (volatility >= 40) return 'var(--amber)';
  return 'var(--green)';
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
  $('btn-stabilize').textContent = state.brew.stabilizations >= MAX_STABILIZATIONS
    ? 'Stabilized'
    : 'Stabilize the cauldron';

  if (!p) {
    box.innerHTML = '<p class="muted">Add at least 2 ingredients to see the reaction. '
      + 'The first sets the effect, the second the trait, the third the twist.</p>';
    return;
  }

  let match = '';
  const c = state.contract;
  if (p.effectKey === c.effectKey && p.quality >= c.minQuality) {
    match = '<div class="match">This would fulfil the contract.</div>';
  } else if (p.effectKey === c.effectKey) {
    match = `<div class="nomatch">Effect matches, but quality is ${c.minQuality - p.quality} short of the contract.</div>`;
  } else {
    match = `<div class="nomatch">Wrong effect for this contract — it wants ${c.effect}.</div>`;
  }

  box.innerHTML = `
    <div class="potion-name">${p.name}</div>
    <div class="line">${p.effectDesc}</div>
    <div class="line">Affinity: <b>${p.affinity}</b> — <span class="affinity">${p.affinityDesc}</span></div>
    <div class="line">Quality: <b>${p.quality}</b> ${stars(p.quality)} <span class="muted">(±5 when brewed)</span></div>
    <div class="line">Volatility: <b>${p.volatility}</b></div>
    <div class="meter"><div style="width:${p.volatility}%; background:${meterColor(p.volatility)}"></div></div>
    <div class="meter-label">Runaway chance: <b>${p.runawayChance}%</b>${p.runawayChance > 0 ? ' — the brew may fail outright.' : ' — safe.'}</div>
    <div class="line">Would sell for <b>${p.value} coins</b>.</div>
    ${match}`;
}

function render() {
  renderHud();
  renderContract();
  renderCauldron();
  renderShelf();
  renderChoiceButtons('temp-buttons', TEMPERATURES, state.brew.temperature, (id) => {
    state.brew.temperature = id;
    render();
  });
  renderChoiceButtons('catalyst-buttons', CATALYSTS, state.brew.catalyst, (id) => {
    state.brew.catalyst = id;
    render();
  });
  renderPreview();
}

function endGame(won) {
  const used = BREW_LIMIT - state.brewsLeft;
  $('end-title').textContent = won ? 'The contracts are fulfilled!' : 'Out of brews.';
  $('end-text').textContent = won
    ? 'Three clients paid, three potions delivered, and the cauldron is still in one piece. The prototype run is complete.'
    : 'The cauldron is cold and the contracts are unfulfilled. The prototype run is over.';
  $('end-stats').textContent = `Coins: ${state.coins} · Contracts fulfilled: ${state.contractsFulfilled} / ${WIN_CONTRACTS} · Brews used: ${used} / ${BREW_LIMIT}`;
  showScreen('end');
}

function brew() {
  if (!canBrew()) return;
  const spec = {
    ingredients: [...state.brew.ingredients],
    temperature: state.brew.temperature,
    catalyst: state.brew.catalyst,
    stabilizations: state.brew.stabilizations,
  };
  const outcome = brewReaction(spec);
  state.brewsLeft -= 1;
  state.brew = { ingredients: [], temperature: 'med', catalyst: 'none', stabilizations: 0 };

  if (!outcome.success) {
    $('result').innerHTML = `
      <div class="bad">RUNAWAY REACTION!</div>
      <div class="line">The cauldron boiled over and the brew was lost. Volatility was ${outcome.prediction.volatility}, and the roll came up ${outcome.rolled} against a ${outcome.prediction.runawayChance}% runaway chance.</div>
      <div class="line muted">High volatility is powerful, but it bites. Stabilize, or use a cooler flame.</div>`;
    logEvent(`Runaway! A ${outcome.prediction.name} boiled over. Ingredients lost.`);
  } else {
    const potion = outcome.potion;
    const fulfilled = fulfilsContract(potion, state.contract);
    if (fulfilled) {
      state.coins += state.contract.reward;
      state.contractsFulfilled += 1;
      const done = state.contractsFulfilled;
      $('result').innerHTML = `
        <div class="potion-name">${potion.name}</div>
        <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
        <div class="good">Contract fulfilled! ${state.contract.client} pays ${state.contract.reward} coins.</div>`;
      logEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — contract fulfilled! +${state.contract.reward} coins.`);
      state.contract = makeContract();
    } else {
      state.coins += potion.value;
      const why = potion.effectKey !== state.contract.effectKey
        ? `The contract wants ${state.contract.effect}, not ${potion.effect}.`
        : `The contract wants quality ${state.contract.minQuality}; this is ${potion.quality}.`;
      $('result').innerHTML = `
        <div class="potion-name">${potion.name}</div>
        <div class="line">Quality <b>${potion.quality}</b> ${stars(potion.quality)} · ${potion.affinity} reaction</div>
        <div class="line">No match. ${why} Sold for <b>${potion.value} coins</b>.</div>`;
      logEvent(`Brewed a ${potion.name} (quality ${potion.quality}) — no match. Sold for ${potion.value} coins.`);
    }
  }

  render();
  if (state.contractsFulfilled >= WIN_CONTRACTS) {
    endGame(true);
  } else if (state.brewsLeft <= 0) {
    endGame(false);
  }
}

export function startGame() {
  $('btn-start').addEventListener('click', newGame);
  $('btn-restart').addEventListener('click', newGame);
  $('btn-brew').addEventListener('click', brew);
  $('btn-stabilize').addEventListener('click', () => {
    if (state.brew.ingredients.length < MIN_INGREDIENTS) return;
    if (state.brew.stabilizations >= MAX_STABILIZATIONS) return;
    const p = preview();
    if (!p || p.volatility <= 0) return;
    state.brew.stabilizations += 1;
    render();
  });
  showScreen('title');
}
