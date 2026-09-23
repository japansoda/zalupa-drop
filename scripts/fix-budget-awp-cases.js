/**
 * Surgical fix for mismatched case drops:
 * - Budget cases (50/100/250/500/750 DC) contained gloves (100-200k DC) and gold
 *   stickers that have nothing to do with a budget tier. Rebuilt from cheap
 *   weapon-only skins capped per tier.
 * - Oligarch 25,000 DC was priced 47527 DC while named 25,000 -> price fixed.
 * - AWP Elite / AWP Overlord were 15/18 SSG 08 with 3 AWP -> refilled with AWP.
 *
 * RTP stays calibrated at runtime (pickWeightedSkin solves weights for 98.5% EV),
 * so changing contents only changes the drop table, never the payout math.
 */
const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '../src/data/all_cases.json');
const skinsPath = path.join(__dirname, '../src/data/all_skins.json');

const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));
console.log(`Loaded ${cases.length} cases, ${allSkins.length} skins.`);

// Unique base skins pool (dedupe by weapon+skinName like the original generator)
function getUniqueBaseSkins(skinList) {
  const seen = new Set();
  const res = [];
  for (const s of skinList) {
    const key = `${s.weapon || ''}_${s.skinName || s.name || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      res.push(s);
    }
  }
  return res;
}
const pool = getUniqueBaseSkins(allSkins);

const NON_WEAPON = (s) => {
  const w = (s.weapon || '').toLowerCase();
  const n = (s.name || '').toLowerCase();
  if (['sticker', 'charm', 'patch', 'agent', 'pin', 'graffiti', 'music kit'].includes(w)) return true;
  if (w.includes('sticker') || w.includes('charm') || w.includes('agent') || w.includes('patch') || w.includes('pin') || w.includes('graffiti') || w.includes('music')) return true;
  // Cyrillic item types (Наклейка, Брелок, Агент, Патч, Граффити, Значок, Музыка)
  if (w.includes('наклейк') || w.includes('брелок') || w.includes('агент') || w.includes('патч') || w.includes('граффити') || w.includes('значок') || w.includes('нашивк') || w.includes('музык') || w.includes('капсул')) return true;
  if (n.startsWith('sticker |') || n.startsWith('charm |') || n.startsWith('agent |') || n.startsWith('patch |') || n.startsWith('pin |')) return true;
  if (n.startsWith('наклейка |') || n.startsWith('брелок |') || n.startsWith('агент |') || n.startsWith('патч |')) return true;
  return false;
};
const IS_RARE = (s) => {
  const w = (s.weapon || '').toLowerCase();
  const n = (s.name || '').toLowerCase();
  if (n.startsWith('★')) return true;
  if (w.includes('knife') || w.includes('glove') || w.includes('wrap') || w.includes('нож') || w.includes('перчат') || w.includes('обмотк')) return true;
  return false;
};

const weaponSkins = pool.filter((s) => !NON_WEAPON(s) && !IS_RARE(s) && (s.priceDc || 0) > 0);
// Budget filler: cheap non-rare consumables (stickers etc.) so low tiers can hit 98.5% EV
const cheapNonRare = pool.filter((s) => !IS_RARE(s) && (s.priceDc || 0) > 0);

function pickSpread(filterFn, count, source) {
  const matched = (source || weaponSkins).filter(filterFn).sort((a, b) => a.priceDc - b.priceDc);
  if (matched.length <= count) return matched;
  // Even spread across the price band so the case has cheap filler + dear top
  const out = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor((i * (matched.length - 1)) / (count - 1));
    out.push(matched[idx]);
  }
  return [...new Map(out.map((s) => [s.id, s])).values()];
}

function cleanSkin(s) {
  return { ...s, wear: undefined, statTrak: false };
}

function rebuildBudget(caseId, minPrice, maxPrice, count, allowFiller) {
  const c = cases.find((x) => x.id === caseId);
  if (!c) {
    console.log(`NOT FOUND: ${caseId}`);
    return;
  }
  const source = allowFiller ? cheapNonRare : weaponSkins;
  const picked = pickSpread((s) => s.priceDc >= minPrice && s.priceDc <= maxPrice, count, source);
  const prices = picked.map((s) => s.priceDc);
  const target = c.priceDc * 0.985;
  console.log(`${caseId}: ${c.skins.length} -> ${picked.length} skins, band ${minPrice}-${maxPrice}, min ${Math.min(...prices)}, max ${Math.max(...prices)}, targetEV ${target.toFixed(0)}, solvable: ${Math.min(...prices) < target}`);
  c.skins = picked.map(cleanSkin);
}

// Budget tiers rebuilt from tier-appropriate cheap drops (weapons + cheap stickers as filler)
rebuildBudget('case_budget_50', 10, 400, 24, true);
rebuildBudget('case_budget_100', 15, 900, 24, true);
rebuildBudget('case_budget_250', 20, 2200, 24, true);
rebuildBudget('case_budget_500', 40, 4500, 24, true);
rebuildBudget('case_student_750', 50, 6500, 24, true);

// Oligarch 25,000 DC: price must match the name
{
  const c = cases.find((x) => x.id === 'case_oligarch_25000');
  if (c) {
    console.log(`case_oligarch_25000: price ${c.priceDc} -> 25000`);
    c.priceDc = 25000;
  } else {
    console.log('NOT FOUND: case_oligarch_25000');
  }
}

// AWP cases: fill with AWP skins across the case's own price band
for (const caseId of ['case_awp_elite', 'case_awp_king']) {
  const c = cases.find((x) => x.id === caseId);
  if (!c) {
    console.log(`NOT FOUND: ${caseId}`);
    continue;
  }
  const prices = c.skins.map((s) => s.priceDc).sort((a, b) => a - b);
  const lo = Math.max(10, prices[0]);
  const hi = prices[prices.length - 1];
  const awps = pool
    .filter((s) => (s.weapon || '').toLowerCase() === 'awp' && s.priceDc >= lo && s.priceDc <= hi && !NON_WEAPON(s))
    .sort((a, b) => a.priceDc - b.priceDc);
  console.log(`${caseId}: AWP candidates in band ${lo}-${hi}: ${awps.length}`);
  const target = c.skins.length;
  let filled = awps.length >= target ? awps.slice(0, target) : awps.slice();
  if (filled.length < target) {
    // Top up with any AWP skins sorted by closeness to band
    const rest = pool
      .filter((s) => (s.weapon || '').toLowerCase() === 'awp' && !filled.some((f) => f.id === s.id))
      .sort((a, b) => Math.abs(a.priceDc - hi) - Math.abs(b.priceDc - hi));
    filled = filled.concat(rest.slice(0, target - filled.length));
  }
  // Even spread
  filled.sort((a, b) => a.priceDc - b.priceDc);
  c.skins = filled.map(cleanSkin);
  console.log(`${caseId}: now ${c.skins.length} AWP skins, min ${Math.min(...c.skins.map((s) => s.priceDc))}, max ${Math.max(...c.skins.map((s) => s.priceDc))}`);
}

// Knife lottery cases: real knives + diverse guns (were AK-only with zero knives,
// so the "10%/50% knife" promise never fired)
const isKnifeSkin = (s) => {
  const w = (s.weapon || '').toLowerCase();
  return (
    w.includes('knife') || w.includes('bayonet') || w.includes('karambit') ||
    w.includes('dagger') || w.includes('stiletto') || w.includes('talon') ||
    w.includes('ursus') || w.includes('kukri') || w.includes('navaja') ||
    w.includes('falchion') || w.includes('bowie') || w.includes('huntsman') ||
    w.includes('butterfly') || w.includes('flip') || w.includes('gut') ||
    w.includes('paracord') || w.includes('survival') || w.includes('nomad') ||
    w.includes('skeleton') || w.includes('classic') || w.includes('нож')
  );
};
const knifePool = pool.filter((s) => isKnifeSkin(s) && (s.priceDc || 0) > 0)
  .sort((a, b) => a.priceDc - b.priceDc);

function cheapestOfWeapon(weaponName, minPrice, maxPrice, excludeIds) {
  const hit = weaponSkins
    .filter((s) => (s.weapon || '').toLowerCase() === weaponName.toLowerCase() &&
      s.priceDc >= minPrice && s.priceDc <= maxPrice && !excludeIds.has(s.id))
    .sort((a, b) => a.priceDc - b.priceDc)[0];
  if (hit) excludeIds.add(hit.id);
  return hit;
}

function rebuildKnifeCase(caseId, knifeCount, gunWeapons, gunMin, gunMax) {
  const c = cases.find((x) => x.id === caseId);
  if (!c) {
    console.log(`NOT FOUND: ${caseId}`);
    return;
  }
  const exclude = new Set();
  const knives = knifePool.slice(0, knifeCount);
  knives.forEach((s) => exclude.add(s.id));
  const guns = [];
  for (const w of gunWeapons) {
    const g = cheapestOfWeapon(w, gunMin, gunMax, exclude);
    if (g) guns.push(g);
  }
  c.skins = knives.concat(guns).map(cleanSkin);
  const kn = c.skins.filter(isKnifeSkin).length;
  console.log(`${caseId}: ${kn} knives + ${guns.length} diverse guns (total ${c.skins.length})`);
}

const DIVERSE_GUNS = ['awp', 'm4a4', 'm4a1-s', 'ak-47', 'desert eagle', 'usp-s', 'glock-18', 'famas', 'galil ar', 'p90', 'tec-9', 'sg 553'];
rebuildKnifeCase('case_10_knife', 5, DIVERSE_GUNS, 200, 3000);
rebuildKnifeCase('case_50_knife', 7, DIVERSE_GUNS, 300, 5000);

// Backup once, then save
const backupPath = path.join(__dirname, '../src/data/all_cases.backup.json');
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(casesPath, backupPath);
  console.log('Backup written to all_cases.backup.json');
}
fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
console.log('Saved all_cases.json');
