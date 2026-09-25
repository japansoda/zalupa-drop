const fs = require('fs');
const path = require('path');

const allCasesPath = path.join(__dirname, '../src/data/all_cases.json');
const allSkinsPath = path.join(__dirname, '../src/data/all_skins.json');

const allCases = JSON.parse(fs.readFileSync(allCasesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(allSkinsPath, 'utf8'));

console.log(`Loaded ${allCases.length} cases and ${allSkins.length} skins.`);

function getSkins(weapon, skinName, limit = 2) {
  const w = (weapon || '').toLowerCase().trim();
  const sn = (skinName || '').toLowerCase().trim();

  let matches = allSkins.filter(s => {
    const sw = (s.weapon || '').toLowerCase().trim();
    const ssn = (s.skinName || s.name || '').toLowerCase().trim();
    if (w) {
      return (sw === w || sw.includes(w) || w.includes(sw)) && (ssn === sn || ssn.includes(sn));
    }
    return ssn === sn || ssn.includes(sn);
  });

  if (matches.length === 0) {
    matches = allSkins.filter(s => (s.name || '').toLowerCase().includes(sn));
  }

  const seen = new Set();
  const res = [];
  for (const s of matches) {
    if (!seen.has(s.name)) {
      seen.add(s.name);
      res.push(s);
      if (res.length >= limit) break;
    }
  }
  return res;
}

function countUnique(skins) {
  const set = new Set();
  for (const s of (skins || [])) {
    set.add(`${s.weapon || ''}___${s.skinName || s.name}`);
  }
  return set.size;
}

// 1. Reprice recent cases so they are no longer broken money-printers
const repricing = {
  'case_cyber_protocol': 4900,
  'case_inferno_banana_rush': 1850,
  'case_gold_bar_24k': 9500,
  'case_quantum_dimension': 2900,
  'case_monkey_business': 1750,
  'case_mecha_overdrive': 4200,
  'case_toxic_biohazard': 2800,
  'case_casino_jackpot_ultra': 18500,
  'case-heat-treated': 8900,
  'case-arabesque-2026': 9800,
  'case-spy-tech-2026': 4900,
  'case-sport-and-field': 3600,
  'case-overpass-2024': 3500,
  'case-graphic-design': 3200,
};

for (const [id, newPrice] of Object.entries(repricing)) {
  const c = allCases.find(x => x.id === id);
  if (c) {
    console.log(`Repriced [${c.id}] "${c.name}": ${c.priceDc} -> ${newPrice} DC`);
    c.priceDc = newPrice;
  }
}

// 2. Define the 5 new collection cases
const newCollections = [
  {
    id: 'case-achroma-2026',
    name: 'Коллекция «Achroma»',
    nameEn: 'The Achroma Collection',
    subtitle: 'Монохромная эстетика из обновления Season 4 CS2',
    subtitleEn: 'Monochromatic aesthetic from CS2 Season 4',
    image: '/cases/case_achroma.webp',
    priceDc: 1850,
    badge: 'NEW',
    badgeEn: 'NEW',
    category: 'custom',
    skinPairs: [
      ['AWP', 'The End'],
      ['AK-47', 'Breakthrough'],
      ['Glock-18', 'Trace Lock'],
      ['Desert Eagle', 'The Daily Deagle'],
      ['AUG', 'Creep'],
      ['P2000', 'Grip Tape'],
      ['P90', 'Aeolian Light'],
      ['FAMAS', 'Vendetta'],
      ['M4A4', 'Aeolian Dark'],
      ['MAC-10', 'Snow Splash'],
      ['MP5-SD', 'Snow Splash'],
      ['R8 Revolver', 'Dark Chamber'],
      ['Dual Berettas', 'Silver Pour'],
      ['M249', 'Sleet'],
      ['MP9', 'Dizzy'],
      ['Nova', 'Currents'],
      ['P250', 'Sleet'],
      ['PP-Bizon', 'Bizoom'],
      ['SCAR-20', 'Zinc'],
      ['SSG 08', 'Sans Comic'],
      ['Karambit', 'Damascus Steel'],
      ['Driver Gloves', 'Black Tie'],
    ]
  },
  {
    id: 'case-ascent-2025',
    name: 'Коллекция «Ascent»',
    nameEn: 'The Ascent Collection',
    subtitle: 'Королевская сине-фиолетовая коллекция CS2 Spring Forward',
    subtitleEn: 'Royal blue & purple aesthetic from CS2 Spring Forward',
    image: '/cases/case_ascent.webp',
    priceDc: 2400,
    badge: 'NEW',
    badgeEn: 'NEW',
    category: 'custom',
    skinPairs: [
      ['M4A1-S', 'Stratosphere'],
      ['AK-47', 'Midnight Laminate'],
      ['USP-S', 'Royal Guard'],
      ['Desert Eagle', 'Mint Fan'],
      ['FAMAS', 'Yeti Camo'],
      ['P2000', 'Royal Baroque'],
      ['MP9', 'Cobalt Paisley'],
      ['P90', 'Reef Grief'],
      ['Zeus x27', 'Electric Blue'],
      ['Nova', 'Turquoise Pour'],
      ['M4A4', 'Naval Shred Camo'],
      ['Galil AR', "Robin's Egg"],
      ['Glock-18', 'Ocean Topo'],
      ['Dual Berettas', 'Rose Nacre'],
      ['Five-SeveN', 'Sky Blue'],
      ['XM1014', 'Gum Wall Camo'],
      ['Negev', 'Sour Grapes'],
      ['Tec-9', 'Blue Blast'],
      ['M9 Bayonet', 'Doppler'],
      ['Sport Gloves', 'Cobalt Skulls'],
    ]
  },
  {
    id: 'case-boreal-2025',
    name: 'Коллекция «Boreal»',
    nameEn: 'The Boreal Collection',
    subtitle: 'Лесная и природная коллекция CS2 Spring Forward',
    subtitleEn: 'Forest & nature themed aesthetic from CS2 Spring Forward',
    image: '/cases/case_boreal.webp',
    priceDc: 2100,
    badge: 'NEW',
    badgeEn: 'NEW',
    category: 'custom',
    skinPairs: [
      ['AWP', 'Green Energy'],
      ['M4A4', 'Sheet Lightning'],
      ['Glock-18', 'Glockingbird'],
      ['AK-47', 'Wintergreen'],
      ['USP-S', 'Tropical Breeze'],
      ['MP5-SD', 'Gold Leaf'],
      ['MAC-10', 'Poplar Thicket'],
      ['XM1014', 'Copperflage'],
      ['Dual Berettas', 'Polished Malachite'],
      ['SSG 08', 'Tiger Tear'],
      ['Zeus x27', 'Swamp DDPAT'],
      ['P90', 'Copper Oxide'],
      ['Galil AR', 'Raw Ceramic'],
      ['FAMAS', 'Boreal Forest'],
      ['P250', 'Forest Night'],
      ['MP9', 'Green Plaid'],
      ['Huntsman Knife', 'Boreal Forest'],
      ['Hand Wraps', 'Arboreal'],
      ['Specialist Gloves', 'Emerald Web'],
    ]
  },
  {
    id: 'case-harlequin-2026',
    name: 'Коллекция «Арлекин»',
    nameEn: 'The Harlequin Collection',
    subtitle: 'Экспрессивные яркие геометрические паттерны CS2',
    subtitleEn: 'Vibrant theatrical diamond-motif patterns CS2',
    image: '/cases/case_harlequin.webp',
    priceDc: 2600,
    badge: 'NEW',
    badgeEn: 'NEW',
    category: 'custom',
    skinPairs: [
      ['M4A1-S', 'Party Animal'],
      ['USP-S', 'Sleeping Potion'],
      ['AWP', 'Exothermic'],
      ['Five-SeveN', 'Fraise Crane'],
      ['Galil AR', 'Sky Mandala'],
      ['UMP-45', 'Warm Blooded'],
      ['Zeus x27', 'Earth Mandala'],
      ['AK-47', 'Point Disarray'],
      ['Glock-18', 'Vogue'],
      ['MAC-10', 'Disco Tech'],
      ['P250', 'Visions'],
      ['MP9', 'Starlight Protector'],
      ['Desert Eagle', 'Ocean Drive'],
      ['SG 553', 'Integrale'],
      ['FAMAS', 'Eye of Athena'],
      ['Butterfly Knife', 'Fade'],
      ['Sport Gloves', 'Vice'],
      ['Specialist Gloves', 'Marble Fade'],
    ]
  },
  {
    id: 'case-radiant-2025',
    name: 'Коллекция «Radiant»',
    nameEn: 'The Radiant Collection',
    subtitle: 'Коллекция багряных и рубиновых оттенков CS2',
    subtitleEn: 'Crimson, ruby & radiant red finishes from CS2',
    image: '/cases/case_radiant.webp',
    priceDc: 2750,
    badge: 'NEW',
    badgeEn: 'NEW',
    category: 'custom',
    skinPairs: [
      ['AK-47', 'Nouveau Rouge'],
      ['USP-S', 'Bleeding Edge'],
      ['Desert Eagle', 'Mulberry'],
      ['M4A1-S', 'Glitched Paint'],
      ['M4A1-S', 'Rose Hex'],
      ['AWP', 'Arsenic Spill'],
      ['SSG 08', 'Blush Pour'],
      ['P250', 'Red Tide'],
      ['Glock-18', 'Coral Bloom'],
      ['MP9', 'Shredded'],
      ['FAMAS', 'Grey Ghost'],
      ['P250', 'Sedimentary'],
      ['M4A4', 'Steel Work'],
      ['CZ75-Auto', 'Red Astor'],
      ['Galil AR', 'Firefight'],
      ['Karambit', 'Crimson Web'],
      ['M9 Bayonet', 'Slaughter'],
      ['Moto Gloves', 'Bloodpressure'],
      ['Specialist Gloves', 'Crimson Kimono'],
    ]
  }
];

for (const col of newCollections) {
  const resultSkins = [];
  const seenIds = new Set();

  for (const [w, sn] of col.skinPairs) {
    const found = getSkins(w, sn, 2);
    for (const s of found) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        resultSkins.push(s);
      }
    }
  }

  const uCount = countUnique(resultSkins);
  console.log(`[${col.id}] Generated ${resultSkins.length} items (${uCount} unique skins)`);

  const caseObj = {
    id: col.id,
    name: col.name,
    nameEn: col.nameEn,
    subtitle: col.subtitle,
    subtitleEn: col.subtitleEn,
    image: col.image,
    priceDc: col.priceDc,
    badge: col.badge,
    badgeEn: col.badgeEn,
    category: col.category,
    skins: resultSkins
  };

  const existIdx = allCases.findIndex(c => c.id === col.id);
  if (existIdx !== -1) {
    allCases[existIdx] = caseObj;
  } else {
    // Insert after highroller/terminal or at top of custom
    const firstCustomIdx = allCases.findIndex(c => c.category === 'custom');
    if (firstCustomIdx !== -1) {
      allCases.splice(firstCustomIdx, 0, caseObj);
    } else {
      allCases.unshift(caseObj);
    }
  }
}

fs.writeFileSync(allCasesPath, JSON.stringify(allCases, null, 2), 'utf8');
console.log(`Updated all_cases.json successfully! Total cases: ${allCases.length}`);
