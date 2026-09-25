const fs = require('fs');
const path = require('path');

const allCasesPath = path.join(__dirname, '../src/data/all_cases.json');
const allSkinsPath = path.join(__dirname, '../src/data/all_skins.json');

const allCases = JSON.parse(fs.readFileSync(allCasesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(allSkinsPath, 'utf8'));

console.log(`Loaded ${allCases.length} cases and ${allSkins.length} skins.`);

// Helper to find skins by weapon and skinName or exact skinName
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

  // Deduplicate by name
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

// Helper to count unique skins (grouped by weapon + skinName)
function countUnique(skins) {
  const set = new Set();
  for (const s of (skins || [])) {
    set.add(`${s.weapon || ''}___${s.skinName || s.name}`);
  }
  return set.size;
}

// 8 Custom Cases definitions with >= 17 distinct skins each
const customCasesDefinitions = [
  {
    id: "case_cyber_protocol",
    oldId: "case_nano_banana_cyber",
    name: "Кейс «Кибер-Протокол»",
    nameEn: "Cyber Protocol Case",
    subtitle: "Футуристический арсенал кибер-бойца",
    subtitleEn: "Futuristic cyberpunk operative loadout",
    image: "/cases/case_cyber_protocol.webp",
    priceDc: 390,
    badge: "NEW",
    badgeEn: "NEW",
    category: "custom",
    skinPairs: [
      ['R8 Revolver', 'Banana Cannon'],
      ['AK-47', 'Neon Revolution'],
      ['M4A1-S', 'Player Two'],
      ['MP9', 'Starlight Protector'],
      ['Glock-18', 'Bullet Queen'],
      ['MAC-10', 'Neon Rider'],
      ['USP-S', 'Cortex'],
      ['AWP', 'Neo-Noir'],
      ['Desert Eagle', 'Mecha Industries'],
      ['FAMAS', 'Commemoration'],
      ['Galil AR', 'Chatterbox'],
      ['P90', 'Asiimov'],
      ['SSG 08', 'Turbo Peek'],
      ['Five-SeveN', 'Hyper Beast'],
      ['CZ75-Auto', 'Tacticat'],
      ['Karambit', 'Lore'],
      ['Sport Gloves', 'Omega'],
      ['Stiletto Knife', 'Tiger Tooth'],
    ]
  },
  {
    id: "case_inferno_banana_rush",
    oldId: "case_inferno_banana_rush",
    name: "Кейс «Раш Банана на Inferno»",
    nameEn: "Inferno Banana Rush Case",
    subtitle: "Легендарный пуш через банан прямо на плент B",
    subtitleEn: "Legendary rush through Banana directly onto B site",
    image: "/cases/case_inferno_banana_rush.webp",
    priceDc: 290,
    badge: "HOT",
    badgeEn: "HOT",
    category: "custom",
    skinPairs: [
      ['Tec-9', 'Banana Leaf'],
      ['R8 Revolver', 'Banana Cannon'],
      ['AK-47', 'Fire Serpent'],
      ['AWP', 'Wildfire'],
      ['Desert Eagle', 'Blaze'],
      ['M4A4', 'Hellfire'],
      ['P90', 'Traction'],
      ['P250', 'Inferno'],
      ['Galil AR', 'Firefight'],
      ['SG 553', 'Integrale'],
      ['MP7', 'Bloodsport'],
      ['Glock-18', 'Reactor'],
      ['CZ75-Auto', 'Xiangliu'],
      ['Five-SeveN', 'Angry Mob'],
      ['MAG-7', 'Heat'],
      ['Butterfly Knife', 'Slaughter'],
      ['Flip Knife', 'Crimson Web'],
      ['Moto Gloves', 'Bloodpressure'],
    ]
  },
  {
    id: "case_gold_bar_24k",
    oldId: "case_nano_banana_gold",
    name: "Кейс «Золотой Слиток 24K»",
    nameEn: "24K Gold Bar Case",
    subtitle: "Премиальное золото высшей пробы",
    subtitleEn: "Premium pure gold luxury arsenal",
    image: "/cases/case_gold_bar_24k.webp",
    priceDc: 1250,
    badge: "VIP",
    badgeEn: "VIP",
    category: "custom",
    skinPairs: [
      ['AK-47', 'Gold Arabesque'],
      ['M4A1-S', 'Welcome to the Jungle'],
      ['AWP', 'The Prince'],
      ['Desert Eagle', 'Fennec Fox'],
      ['CZ75-Auto', 'Yellow Jacket'],
      ['Glock-18', 'Brass'],
      ['USP-S', 'Orion'],
      ['MP9', 'Bulldozer'],
      ['MAC-10', 'Gold Brick'],
      ['P250', 'Wingshot'],
      ['FAMAS', 'Meltdown'],
      ['Five-SeveN', 'Copper Galaxy'],
      ['XM1014', 'Entombed'],
      ['AUG', 'Strikethrough'],
      ['Butterfly Knife', 'Lore'],
      ['Specialist Gloves', 'Tiger Strike'],
      ['Skeleton Knife', 'Fade'],
      ['Karambit', 'Tiger Tooth'],
    ]
  },
  {
    id: "case_quantum_dimension",
    oldId: "case_quantum_banana",
    name: "Кейс «Квантовое Измерение»",
    nameEn: "Quantum Dimension Case",
    subtitle: "Энергия квантовых полей и антиматерии",
    subtitleEn: "Energy of quantum fields and antimatter",
    image: "/cases/case_quantum_dimension.webp",
    priceDc: 420,
    badge: "NEW",
    badgeEn: "NEW",
    category: "custom",
    skinPairs: [
      ['AWP', 'Chromatic Aberration'],
      ['M4A4', 'Cyber Security'],
      ['AK-47', 'Nightwish'],
      ['MAC-10', 'Propaganda'],
      ['USP-S', 'Printstream'],
      ['SSG 08', 'Turbo Peek'],
      ['Galil AR', 'Signal'],
      ['Glock-18', 'High Beam'],
      ['MP5-SD', 'Gauss'],
      ['Desert Eagle', 'Ocean Drive'],
      ['P250', 'Cyber Shell'],
      ['M4A1-S', 'Decimator'],
      ['AUG', 'Momentum'],
      ['SG 553', 'Darkwing'],
      ['M9 Bayonet', 'Gamma Doppler'],
      ['Talon Knife', 'Marble Fade'],
      ['Sport Gloves', 'Vice'],
      ['Nomad Knife', 'Blue Steel'],
    ]
  },
  {
    id: "case_monkey_business",
    oldId: "case_monkey_business_bananas",
    name: "Кейс «Обезьяний Бизнес»",
    nameEn: "Monkey Business Case",
    subtitle: "Тропический хаос, джунгли и банановый задор",
    subtitleEn: "Tropical chaos, jungle beasts, and bananas",
    image: "/cases/case_monkey_business.webp",
    priceDc: 260,
    badge: "FUN",
    badgeEn: "FUN",
    category: "custom",
    skinPairs: [
      ['Five-SeveN', 'Monkey Business'],
      ['Tec-9', 'Bamboozle'],
      ['AK-47', 'Jaguar'],
      ['AWP', 'Wild Lotus'],
      ['M4A4', 'Jungle Tiger'],
      ['SSG 08', 'Jungle Dashed'],
      ['P90', 'Shallow Grave'],
      ['Desert Eagle', 'Emerald J\u00f6rmungandr'],
      ['MP7', 'Skulls'],
      ['USP-S', 'Forest Leaves'],
      ['Glock-18', 'Groundwater'],
      ['MAC-10', 'Palm'],
      ['Nova', 'Wild Six'],
      ['P250', 'Forest Night'],
      ['Huntsman Knife', 'Doppler'],
      ['Survival Knife', 'Case Hardened'],
      ['Specialist Gloves', 'Emerald Web'],
      ['Hand Wraps', 'Arboreal'],
    ]
  },
  {
    id: "case_mecha_overdrive",
    oldId: "case_mecha_banana_overdrive",
    name: "Кейс «Меха-Овердрайв»",
    nameEn: "Mecha Overdrive Case",
    subtitle: "Тяжелая роботизированная броня и нано-технологии",
    subtitleEn: "Heavy robotic armor and cutting-edge mecha tech",
    image: "/cases/case_mecha_overdrive.webp",
    priceDc: 380,
    badge: "EPIC",
    badgeEn: "EPIC",
    category: "custom",
    skinPairs: [
      ['M4A1-S', 'Mecha Industries'],
      ['FAMAS', 'Mecha Industries'],
      ['Desert Eagle', 'Mecha Industries'],
      ['AK-47', 'Vulcan'],
      ['AWP', 'Elite Build'],
      ['P90', 'Grim'],
      ['USP-S', 'Cyrex'],
      ['M4A1-S', 'Cyrex'],
      ['SG 553', 'Cyrex'],
      ['SCAR-20', 'Cyrex'],
      ['Glock-18', 'Ironwork'],
      ['MP9', 'Airlock'],
      ['Galil AR', 'Stone Cold'],
      ['P250', 'Iron Clad'],
      ['Skeleton Knife', 'Slaughter'],
      ['Paracord Knife', 'Crimson Web'],
      ['Driver Gloves', 'King Snake'],
      ['Specialist Gloves', 'Foundation'],
    ]
  },
  {
    id: "case_toxic_biohazard",
    oldId: "case_toxic_banana_biohazard",
    name: "Кейс «Токсичная Угроза Biohazard»",
    nameEn: "Toxic Biohazard Case",
    subtitle: "Зона биологического заражения 4-го уровня",
    subtitleEn: "Biohazard quarantine zone level 4",
    image: "/cases/case_toxic_biohazard.webp",
    priceDc: 320,
    badge: "TOXIC",
    badgeEn: "TOXIC",
    category: "custom",
    skinPairs: [
      ['Tec-9', 'Toxic'],
      ['Glock-18', 'Nuclear Garden'],
      ['MP9', 'Bioleak'],
      ['MAC-10', 'Nuclear Garden'],
      ['M4A4', 'Radiation Hazard'],
      ['AK-47', 'Hydroponic'],
      ['AWP', 'Containment Breach'],
      ['Galil AR', 'Cerberus'],
      ['P250', 'Contamination'],
      ['Desert Eagle', 'Mud-Spec'],
      ['SG 553', 'Fallout Warning'],
      ['XM1014', 'Bone Machine'],
      ['UMP-45', 'Crime Scene'],
      ['PP-Bizon', 'Chemical Green'],
      ['Karambit', 'Gamma Doppler'],
      ['Bowie Knife', 'Gamma Doppler'],
      ['Moto Gloves', 'Finish Line'],
      ['Specialist Gloves', 'Field Agent'],
    ]
  },
  {
    id: "case_casino_jackpot_ultra",
    oldId: "case_banana_jackpot_ultra",
    name: "Кейс «Казино Джекпот Ultra»",
    nameEn: "Casino Jackpot Ultra Case",
    subtitle: "Крути рулетку, срывай главный куш сервера",
    subtitleEn: "Spin the reels and hit the server ultra jackpot",
    image: "/cases/case_casino_jackpot_ultra.webp",
    priceDc: 1800,
    badge: "JACKPOT",
    badgeEn: "JACKPOT",
    category: "custom",
    skinPairs: [
      ['AWP', 'Dragon Lore'],
      ['AK-47', 'Case Hardened'],
      ['M4A4', 'Howl'],
      ['Desert Eagle', 'Golden Koi'],
      ['USP-S', 'Kill Confirmed'],
      ['Glock-18', 'Fade'],
      ['Five-SeveN', 'Case Hardened'],
      ['P250', 'Cartel'],
      ['MP9', 'Wild Lily'],
      ['MAC-10', 'Heat'],
      ['CZ75-Auto', 'Victoria'],
      ['SSG 08', 'Blood in the Water'],
      ['Dual Berettas', 'Cobra Strike'],
      ['Butterfly Knife', 'Doppler'],
      ['Karambit', 'Fade'],
      ['M9 Bayonet', 'Lore'],
      ['Sport Gloves', "Pandora's Box"],
      ['Specialist Gloves', 'Crimson Kimono'],
    ]
  }
];

// Build skins array for a definition
function buildSkinsForCase(def) {
  const result = [];
  const seenIds = new Set();

  for (const [weapon, skinName] of def.skinPairs) {
    const found = getSkins(weapon, skinName, 2);
    for (const s of found) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        result.push(s);
      }
    }
  }
  return result;
}

// 1. Update or replace the 8 custom cases in allCases
for (const def of customCasesDefinitions) {
  const skins = buildSkinsForCase(def);
  const uCount = countUnique(skins);
  console.log(`[${def.id}] Generated ${skins.length} items with ${uCount} unique skins.`);

  // Find existing by new id or old id
  const existingIdx = allCases.findIndex(c => c.id === def.id || c.id === def.oldId);
  const caseObj = {
    id: def.id,
    name: def.name,
    nameEn: def.nameEn,
    subtitle: def.subtitle,
    subtitleEn: def.subtitleEn,
    image: def.image,
    priceDc: def.priceDc,
    badge: def.badge,
    badgeEn: def.badgeEn,
    category: def.category,
    skins: skins
  };

  if (existingIdx !== -1) {
    allCases[existingIdx] = caseObj;
  } else {
    allCases.push(caseObj);
  }
}

// 2. Expand other new cases that had < 15 unique skins:
const extraExpansions = [
  {
    id: 'case-arabesque-2026',
    addPairs: [
      ['Desert Eagle', 'Golden Koi'],
      ['M4A4', 'Royal Paladin'],
      ['USP-S', 'Orion'],
      ['CZ75-Auto', 'Yellow Jacket'],
      ['Glock-18', 'Brass'],
      ['Five-SeveN', 'Copper Galaxy'],
      ['MAC-10', 'Gold Brick'],
      ['P250', 'Wingshot'],
      ['Karambit', 'Tiger Tooth'],
      ['Specialist Gloves', 'Tiger Strike']
    ]
  },
  {
    id: 'case-spy-tech-2026',
    addPairs: [
      ['M4A1-S', 'Silencer'],
      ['USP-S', 'Dark Water'],
      ['AWP', 'Graphite'],
      ['Desert Eagle', 'Conspiracy'],
      ['MP9', 'Dark Age'],
      ['MAC-10', 'Silver'],
      ['Galil AR', 'Tuxedo'],
      ['P250', 'Steel Disruption'],
      ['Glock-18', 'Ironwork'],
      ['Specialist Gloves', 'Field Agent']
    ]
  },
  {
    id: 'case-heat-treated',
    addPairs: [
      ['Karambit', 'Case Hardened'],
      ['M9 Bayonet', 'Case Hardened'],
      ['Butterfly Knife', 'Case Hardened'],
      ['Stiletto Knife', 'Case Hardened'],
      ['Skeleton Knife', 'Case Hardened'],
      ['Survival Knife', 'Case Hardened'],
      ['Paracord Knife', 'Case Hardened'],
      ['Ursus Knife', 'Case Hardened'],
      ['Nomad Knife', 'Case Hardened'],
      ['Kukri Knife', 'Case Hardened'],
      ['Five-SeveN', 'Case Hardened'],
      ['MAC-10', 'Case Hardened']
    ]
  },
  {
    id: 'case-graphic-design',
    addPairs: [
      ['M4A4', 'In Living Color'],
      ['AK-47', 'Head Shot'],
      ['USP-S', 'Printstream'],
      ['Desert Eagle', 'Printstream'],
      ['M4A1-S', 'Printstream'],
      ['AWP', 'Chromatic Aberration'],
      ['MP9', 'Mount Fuji'],
      ['Glock-18', 'Vogue'],
      ['MAC-10', 'Disco Tech'],
      ['FAMAS', 'Eye of Athena']
    ]
  },
  {
    id: 'case-sport-and-field',
    addPairs: [
      ['M4A4', 'Themistocles'],
      ['AK-47', 'Point Disarray'],
      ['AWP', 'Wildfire'],
      ['Desert Eagle', 'Ocean Drive'],
      ['Glock-18', 'Water Elemental'],
      ['USP-S', 'Kill Confirmed'],
      ['P250', 'See Ya Later'],
      ['Five-SeveN', 'Hyper Beast'],
      ['Sport Gloves', 'Vice'],
      ['Sport Gloves', 'Amphibious']
    ]
  },
  {
    id: 'case-overpass-2024',
    addPairs: [
      ['AK-47', 'Green Laminate'],
      ['M4A1-S', 'Nitro'],
      ['USP-S', 'Road Rash'],
      ['Glock-18', 'Brass'],
      ['Desert Eagle', 'Urban Rubble'],
      ['AWP', 'Pink DDPAT'],
      ['SSG 08', 'Detour'],
      ['CZ75-Auto', 'Nitro']
    ]
  },
  {
    id: 'terminal-dead-hand',
    addPairs: [
      ['Driver Gloves', 'Black Tie'],
      ['Specialist Gloves', 'Crimson Web'],
      ['Moto Gloves', 'Smoke Out'],
      ['Hand Wraps', 'Badlands']
    ]
  }
];

for (const exp of extraExpansions) {
  const targetCase = allCases.find(c => c.id === exp.id);
  if (!targetCase) {
    console.log(`Warning: target case ${exp.id} not found.`);
    continue;
  }

  const existingSkinIds = new Set((targetCase.skins || []).map(s => s.id));
  for (const [w, sn] of exp.addPairs) {
    const found = getSkins(w, sn, 2);
    for (const s of found) {
      if (!existingSkinIds.has(s.id)) {
        existingSkinIds.add(s.id);
        targetCase.skins.push(s);
      }
    }
  }

  const uCount = countUnique(targetCase.skins);
  console.log(`[${targetCase.id}] Expanded to ${targetCase.skins.length} items (${uCount} unique skins).`);
}

// Write back to all_cases.json
fs.writeFileSync(allCasesPath, JSON.stringify(allCases, null, 2), 'utf8');
console.log(`Updated ${allCasesPath} successfully!`);
