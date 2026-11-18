// Reactive Volatility — build program (Node 22, standard library only).
// The game lives in game/ as plain static files a desktop browser loads offline
// (index.html plus ES modules and stylesheet; no libraries, no network requests).
// This program verifies the tree is really this game's (every
// expected module present, no external reference smuggled in), copies game/ (and
// screenshots/, when it exists) into the output directory, and prints a short
// build summary.
// Milestone: M4 (debt, borrowing, relic shop) + M3 rework (workshop room,
// cauldron feedback, contractor popup/live window, dialogue blips), on the M1
// core, M2 tutorial, M3 pixel art and SFX. It refuses a tree that is not this
// game rather than copying whatever happens to be lying around.
// Run: `node main.ts` (OUTPUT_DIR=out node main.ts to write to a different directory).

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- This game's own facts ---------------------------------

const MILESTONE = 'M4';
const MILESTONE_NAME = 'debt + ingredient costs + borrowing + relic shop + workshop rework';

// Every module the entrypoint expects under game/. If one is missing the
// tree is incomplete and the entrypoint stops instead of handing in half a game.
const EXPECTED_MODULES = [
  'index.html',
  'style.css',
  'src/main.js',
  'src/game.js',
  'src/data.js',
  'src/reaction.js',
  'src/contracts.js',
  'src/economy.js',
  'src/debt.js',
  'src/relics.js',
  'src/shop.js',
  'src/tutorial.js',
  'src/recipes.js',
  'src/storage.js',
  'src/assets.js',
  'src/sfx.js',
];

// The source cap. Over the cap the build warns that sources are over budget.
const TEXT_CAP_BYTES = 163840;

// Text files the external-reference check reads. Only the in-session
// painted art listed here may ship under game/ as image/sound files; any
// other asset is refused outright. All 17 are generated art for this game:
// the painted workshop backdrops, the painted cauldron hero, the six
// contractor portraits and the eight relic icons.
const ALLOWED_ASSETS = new Set([
  'assets/workshop-backdrop.webp',
  'assets/workshop-backdrop-centred.webp',
  'assets/cauldron-hero.webp',
  'assets/portrait-brass-merchant.webp',
  'assets/portrait-madame-vex.webp',
  'assets/portrait-clockmaker.webp',
  'assets/portrait-sister-anselm.webp',
  'assets/portrait-drowned-sailor.webp',
  'assets/portrait-baron-crowe.webp',
  'assets/icon-relic-salamantra.webp',
  'assets/icon-relic-frostglass-alembic.webp',
  'assets/icon-relic-saltbound-crucible.webp',
  'assets/icon-relic-pawn-ticket.webp',
  'assets/icon-relic-brass-scales.webp',
  'assets/icon-relic-quicksilver-alembic.webp',
  'assets/icon-relic-gilt-crucible.webp',
  'assets/icon-relic-wayfarers-still.webp',
]);
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.css', '.json']);
const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.wav', '.mp3', '.ogg', '.flac']);

function fail(message) {
  throw new Error(`Reactive Volatility entrypoint: ${message}`);
}

function walkGameFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkGameFiles(path, out);
    else if (entry.isFile()) out.push(path);
  }
  return out;
}

function checkModules(gameDir) {
  const missing = [];
  for (const rel of EXPECTED_MODULES) {
    const path = join(gameDir, rel);
    let ok = false;
    try {
      ok = existsSync(path) && lstatSync(path).isFile();
    } catch {
      ok = false;
    }
    if (!ok) missing.push(rel);
  }
  if (missing.length > 0) {
    fail(`incomplete game tree — missing module(s): ${missing.join(', ')}`);
  }
  return EXPECTED_MODULES.length;
}

// The game must load offline: no network reference and no asset file under
// game/ except the painted backdrop. One http:// in a comment breaks the rule.
function checkNoExternalRefs(gameDir) {
  const files = walkGameFiles(gameDir);
  let scanned = 0;
  for (const path of files) {
    const rel = path.slice(gameDir.length + 1);
    const ext = extname(path).toLowerCase();
    if (ASSET_EXTENSIONS.has(ext) && !ALLOWED_ASSETS.has(rel)) {
      fail(`asset file under game/: ${rel} — only the listed painted art may ship`);
    }
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    scanned += 1;
    const text = readFileSync(path, 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/https?:\/\//.test(line)) {
        fail(`network reference in ${rel}:${i + 1} — ${line.trim().slice(0, 80)}`);
      }
      if (/fetch\s*\(/.test(line)) {
        fail(`fetch() call in ${rel}:${i + 1} — the game must not reach the network`);
      }
    }
  }
  return scanned;
}

// A short build summary on stdout: milestone, module count, sprite counts,
// source bytes against the source cap, and screenshots ready (M4's job).
function countSprites(gameDir) {
  const text = readFileSync(join(gameDir, 'src', 'assets.js'), 'utf8');
  const names = [...text.matchAll(/^    (\w+): \{$/gm)].map((m) => m[1]);
  return {
    total: names.length,
    workshop: names.filter((n) => n.startsWith('workshop_')).length,
    portraits: names.filter((n) => n.startsWith('portrait_')).length,
    cauldron: names.filter((n) => n.startsWith('cauldron_')).length,
  };
}

function printSummary(gameDir, moduleCount, scannedFiles) {
  const files = walkGameFiles(gameDir);
  const sourceBytes = files.reduce((sum, path) => {
    if (!TEXT_EXTENSIONS.has(extname(path).toLowerCase())) return sum;
    return sum + lstatSync(path).size;
  }, 0);
  const shotsDir = join(here, 'screenshots');
  let shots = 'none yet (M4)';
  try {
    const names = readdirSync(shotsDir, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.'))
      .map((e) => e.name);
    shots = names.length > 0 ? names.join(', ') : 'none yet (M4)';
  } catch {
    shots = 'none yet (M4)';
  }
  console.log(`Reactive Volatility — ${MILESTONE} (${MILESTONE_NAME})`);
  console.log(`game modules: ${moduleCount} expected, all present (${scannedFiles} text files checked)`);
  const art = countSprites(gameDir);
  console.log(`sprites: ${art.total} in assets.js (workshop ${art.workshop}, portraits ${art.portraits}, cauldron ${art.cauldron})`);
  console.log(`source total: ${sourceBytes} bytes of the ${TEXT_CAP_BYTES}-byte source cap`);
  if (sourceBytes > TEXT_CAP_BYTES) {
    console.log('WARNING: source total is over the source cap');
  }
  console.log(`screenshots: ${shots}`);
}

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');

const moduleCount = checkModules(gameDir);
const scannedFiles = checkNoExternalRefs(gameDir);
printSummary(gameDir, moduleCount, scannedFiles);

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
