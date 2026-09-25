const fs = require('fs');
const path = require('path');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/all_cases.json'), 'utf8'));

// Probabilities used in roulette (from ReelRoulette / farm / cases)
const RARITY_PROBS = {
  milspec: 0.7992,
  restricted: 0.1598,
  classified: 0.032,
  covert: 0.0064,
  gold: 0.0026
};

// Check recent cases
const recentIds = [
  'case_cyber_protocol',
  'case_inferno_banana_rush',
  'case_gold_bar_24k',
  'case_quantum_dimension',
  'case_monkey_business',
  'case_mecha_overdrive',
  'case_toxic_biohazard',
  'case_casino_jackpot_ultra',
  'case-overpass-2024',
  'case-sport-and-field',
  'case-graphic-design',
  'case-heat-treated',
  'case-spy-tech-2026',
  'case-arabesque-2026'
];

for (const id of recentIds) {
  const c = cases.find(x => x.id === id);
  if (!c) continue;
  
  // Calculate average price per rarity
  const rarityGroups = {};
  for (const s of c.skins || []) {
    const r = s.rarity || 'milspec';
    if (!rarityGroups[r]) rarityGroups[r] = [];
    rarityGroups[r].push(s.priceDc || 0);
  }

  // Raw average skin price
  const allPrices = (c.skins || []).map(s => s.priceDc || 0);
  const avgRaw = allPrices.reduce((a, b) => a + b, 0) / (allPrices.length || 1);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  console.log(`[${c.id}] "${c.name}"`);
  console.log(`  Price: ${c.priceDc} DC`);
  console.log(`  Min skin: ${minPrice} DC, Max skin: ${maxPrice} DC, Avg skin: ${Math.round(avgRaw)} DC`);
  for (const [r, list] of Object.entries(rarityGroups)) {
    const avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
    console.log(`    ${r} (${list.length} skins): avg ${avg} DC`);
  }
}
