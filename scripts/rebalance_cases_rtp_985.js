/**
 * Rebalance ALL cases to RTP 98.5%.
 *
 * Pricing model (same as scripts/check_case_ev.js):
 *   Standard CS2 rarity odds:
 *     milspec/industrial/consumer 79.92% | restricted 15.98% |
 *     classified 3.2% | covert 0.64% | gold/extraordinary/contraband 0.26%
 *   Probabilities are renormalized over the rarities actually present in the case,
 *   so knife-only / sticker-only cases degrade gracefully to EV = average price.
 *
 *   Special exact-odds cases (bypass the generic model in ReelRoulette):
 *     case_10_knife (10% knife) / case_50_knife (50% knife):
 *       EV = pKnife * avgKnife + (1 - pKnife) * avgOther
 *
 *   New price = max(1, round(EV / 0.985))
 *
 * Exchange rate is fixed: 1 USD = 4 DC (see marketPricing: priceUsd = priceDc / 4).
 * Only case priceDc changes — skins, odds code and drop logic are untouched.
 * Runtime enforcement stays in ReelRoulette (targetEV = price * 0.985).
 *
 * Usage: node scripts/rebalance_cases_rtp_985.js
 */
const fs = require('fs');
const path = require('path');

const CASES_PATH = path.join(__dirname, '../src/data/all_cases.json');
const TARGET_RTP = 0.985;

const RARITY_PROBS = {
  milspec: 0.7992,
  industrial: 0.7992,
  consumer: 0.7992,
  restricted: 0.1598,
  classified: 0.032,
  covert: 0.0064,
  gold: 0.0026,
  extraordinary: 0.0026,
  contraband: 0.0026,
};

function isKnifeOrGloveSkin(s) {
  if (!s) return false;
  const r = (s.rarity || '').toLowerCase();
  if (r === 'gold' || r === 'extraordinary') return true;
  const w = (s.weapon || '').toLowerCase();
  return (
    w.includes('knife') ||
    w.includes('bayonet') ||
    w.includes('karambit') ||
    w.includes('daggers') ||
    w.includes('gloves') ||
    w.includes('wraps')
  );
}

function avg(list) {
  if (!list.length) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

// EV under exact fixed knife odds (10% / 50% cases)
function evFixedKnifeOdds(skins, pKnife) {
  const knives = skins.filter(isKnifeOrGloveSkin);
  const others = skins.filter((s) => !isKnifeOrGloveSkin(s));
  if (!knives.length || !others.length) {
    // Degenerate: fall back to plain average
    return avg(skins.map((s) => Math.max(0.01, s.priceDc || 0)));
  }
  return (
    pKnife * avg(knives.map((s) => Math.max(0.01, s.priceDc || 0))) +
    (1 - pKnife) * avg(others.map((s) => Math.max(0.01, s.priceDc || 0)))
  );
}

// EV under standard CS2 rarity odds, renormalized to present rarities
function evRarityOdds(skins) {
  const groups = {};
  for (const s of skins) {
    const r = (s.rarity || 'milspec').toLowerCase();
    if (!groups[r]) groups[r] = [];
    groups[r].push(Math.max(0.01, s.priceDc || 0));
  }
  const present = Object.keys(groups);
  if (present.length === 0) return 0;
  let totalP = 0;
  for (const r of present) totalP += RARITY_PROBS[r] !== undefined ? RARITY_PROBS[r] : 0.01;
  let ev = 0;
  for (const r of present) {
    const p = (RARITY_PROBS[r] !== undefined ? RARITY_PROBS[r] : 0.01) / totalP;
    ev += p * avg(groups[r]);
  }
  return ev;
}

function loadCases() {
  const buf = fs.readFileSync(CASES_PATH);
  let text;
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    text = buf.toString('utf16le').replace(/^\uFEFF/, '');
  } else {
    text = buf.toString('utf8').replace(/^\uFEFF/, '');
  }
  return JSON.parse(text);
}

function main() {
  const cases = loadCases();
  console.log(`Loaded ${cases.length} cases.`);

  let changed = 0;
  let fixed10 = 0;
  let fixed50 = 0;
  const deltas = [];

  for (const c of cases) {
    const skins = c.skins || [];
    if (!skins.length) continue;

    const name = `${c.name || ''} ${c.nameEn || ''}`;
    let ev;
    let model = 'rarity';
    if (c.id === 'case_10_knife' || /10%\s*(нож|knife)/i.test(name)) {
      ev = evFixedKnifeOdds(skins, 0.1);
      model = 'knife10';
      fixed10++;
    } else if (c.id === 'case_50_knife' || /50%\s*(нож|knife)/i.test(name)) {
      ev = evFixedKnifeOdds(skins, 0.5);
      model = 'knife50';
      fixed50++;
    } else {
      ev = evRarityOdds(skins);
    }

    const raw = ev / TARGET_RTP;
    // Integer DC for real prices; 2-decimal precision below 20 DC so that
    // 1-2 DC micro-cases (sticker scraps) don't drift off RTP by rounding.
    const newPrice = raw >= 20 ? Math.max(1, Math.round(raw)) : Math.max(0.01, Math.round(raw * 100) / 100);
    if (newPrice !== c.priceDc) {
      deltas.push({ id: c.id, old: c.priceDc, next: newPrice, model });
      c.priceDc = newPrice;
      changed++;
    }
  }

  // Backup previous file (utf8) before overwriting
  const backupPath = CASES_PATH + `.pre-rtp985.${Date.now()}.bak.json`;
  try {
    fs.copyFileSync(CASES_PATH, backupPath);
    console.log(`Backup written: ${backupPath}`);
  } catch (e) {
    console.warn('Backup failed:', e.message);
  }

  // Write back as plain UTF-8 (repo standard; all_cases.json was the only UTF-16LE file)
  fs.writeFileSync(CASES_PATH, JSON.stringify(cases, null, 2), 'utf8');
  console.log(`Rebalanced ${changed}/${cases.length} case prices to RTP ${(TARGET_RTP * 100).toFixed(1)}% (10% model: ${fixed10}, 50% model: ${fixed50}).`);

  // Verification pass: recompute RTP under the same model
  let worst = 0;
  for (const c of cases) {
    const skins = c.skins || [];
    if (!skins.length || !c.priceDc) continue;
    const name = `${c.name || ''} ${c.nameEn || ''}`;
    let ev;
    if (c.id === 'case_10_knife' || /10%\s*(нож|knife)/i.test(name)) ev = evFixedKnifeOdds(skins, 0.1);
    else if (c.id === 'case_50_knife' || /50%\s*(нож|knife)/i.test(name)) ev = evFixedKnifeOdds(skins, 0.5);
    else ev = evRarityOdds(skins);
    const rtp = (ev / c.priceDc) * 100;
    worst = Math.max(worst, Math.abs(rtp - 98.5));
  }
  console.log(`Max |RTP-98.5| after rebalance (model odds): ${worst.toFixed(2)}pp (rounding to 1 DC).`);

  deltas.sort((a, b) => b.next - a.next);
  console.log('Top 5 most expensive after rebalance:');
  for (const d of deltas.slice(0, 5)) console.log(`  ${d.id}: ${d.old} -> ${d.next} DC [${d.model}]`);
  console.log('5 cheapest after rebalance:');
  const allSorted = [...cases]
    .filter((c) => (c.skins || []).length)
    .sort((a, b) => a.priceDc - b.priceDc);
  for (const c of allSorted.slice(0, 5)) console.log(`  ${c.id}: ${c.priceDc} DC`);
}

main();
