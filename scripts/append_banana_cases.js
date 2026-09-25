const fs = require('fs');
const path = require('path');

const allCasesPath = path.join(__dirname, '../src/data/all_cases.json');
const allSkinsPath = path.join(__dirname, '../src/data/all_skins.json');

const allCases = JSON.parse(fs.readFileSync(allCasesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(allSkinsPath, 'utf8'));

console.log(`Loaded ${allCases.length} cases and ${allSkins.length} skins.`);

// Helper to find skins by weapon and skinName or exact skinName
function getSkins(weapon, skinName, limit = 4) {
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
    // Fallback: search anywhere in name
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

// 1. Nano Banana Cyberpunk
const cyberSkins = [
  ...getSkins('R8 Revolver', 'Banana Cannon', 4),
  ...getSkins('AK-47', 'Neon Revolution', 3),
  ...getSkins('M4A1-S', 'Player Two', 3),
  ...getSkins('MP9', 'Starlight Protector', 3),
  ...getSkins('Glock-18', 'Bullet Queen', 3),
  ...getSkins('MAC-10', 'Neon Rider', 3),
  ...getSkins('USP-S', 'Cortex', 3),
  ...getSkins('Karambit', 'Lore', 2),
  ...getSkins('Sport Gloves', 'Omega', 2),
  ...getSkins('Stiletto Knife', 'Tiger Tooth', 2),
];

// 2. Inferno Banana Rush
const infernoSkins = [
  ...getSkins('Tec-9', 'Banana Leaf', 4),
  ...getSkins('AK-47', 'Fire Serpent', 3),
  ...getSkins('AWP', 'Wildfire', 3),
  ...getSkins('Desert Eagle', 'Blaze', 2),
  ...getSkins('M4A4', 'Hellfire', 3),
  ...getSkins('P90', 'Traction', 2),
  ...getSkins('P250', 'Inferno', 2),
  ...getSkins('Butterfly Knife', 'Slaughter', 2),
  ...getSkins('Flip Knife', 'Crimson Web', 2),
  ...getSkins('Moto Gloves', 'Bloodpressure', 2),
];

// 3. Nano Banana 24K Gold
const goldSkins = [
  ...getSkins('AK-47', 'Gold Arabesque', 3),
  ...getSkins('M4A1-S', 'Welcome to the Jungle', 2),
  ...getSkins('AWP', 'The Prince', 2),
  ...getSkins('Desert Eagle', 'Fennec Fox', 2),
  ...getSkins('CZ75-Auto', 'Yellow Jacket', 3),
  ...getSkins('Glock-18', 'Brass', 2),
  ...getSkins('Butterfly Knife', 'Lore', 2),
  ...getSkins('Specialist Gloves', 'Tiger Strike', 2),
  ...getSkins('Skeleton Knife', 'Fade', 2),
];

// 4. Quantum Banana
const quantumSkins = [
  ...getSkins('AWP', 'Chromatic Aberration', 4),
  ...getSkins('M4A4', 'Cyber Security', 3),
  ...getSkins('AK-47', 'Nightwish', 3),
  ...getSkins('MAC-10', 'Propaganda', 3),
  ...getSkins('USP-S', 'Printstream', 3),
  ...getSkins('SSG 08', 'Turbo Peek', 3),
  ...getSkins('M9 Bayonet', 'Gamma Doppler', 2),
  ...getSkins('Talon Knife', 'Marble Fade', 2),
  ...getSkins('Sport Gloves', 'Vice', 2),
];

// 5. Monkey Business & Bananas
const monkeySkins = [
  ...getSkins('Five-SeveN', 'Monkey Business', 5),
  ...getSkins('R8 Revolver', 'Banana Cannon', 4),
  ...getSkins('XM1014', 'Banana Leaf', 4),
  ...getSkins('P90', 'Death by Kitty', 2),
  ...getSkins('Galil AR', 'Sugar Rush', 3),
  ...getSkins('MP7', 'Cirrus', 2),
  ...getSkins('P250', 'Valence', 2),
  ...getSkins('Gut Knife', 'Lore', 2),
  ...getSkins('Bowie Knife', 'Tiger Tooth', 2),
];

// 6. Mecha Banana Overdrive
const mechaSkins = [
  ...getSkins('M4A1-S', 'Mecha Industries', 4),
  ...getSkins('FAMAS', 'Mecha Industries', 3),
  ...getSkins('Desert Eagle', 'Mecha Industries', 3),
  ...getSkins('AK-47', 'Vulcan', 3),
  ...getSkins('AWP', 'Neo-Noir', 3),
  ...getSkins('M4A4', 'In Living Color', 3),
  ...getSkins('Karambit', 'Autotronic', 2),
  ...getSkins('Moto Gloves', 'POW!', 2),
  ...getSkins('Classic Knife', 'Crimson Web', 2),
];

// 7. Toxic Banana Biohazard
const toxicSkins = [
  ...getSkins('AK-47', 'Hydroponic', 3),
  ...getSkins('M4A4', 'Radiation Hazard', 3),
  ...getSkins('AWP', 'Containment Breach', 3),
  ...getSkins('P250', 'Nuclear Threat', 2),
  ...getSkins('Tec-9', 'Nuclear Threat', 2),
  ...getSkins('Galil AR', 'Eco', 2),
  ...getSkins('Glock-18', 'Nuclear Garden', 2),
  ...getSkins('Karambit', 'Gamma Doppler', 2),
  ...getSkins('Sport Gloves', 'Hedge Maze', 2),
];

// 8. Banana Jackpot Ultra
const jackpotSkins = [
  ...getSkins('AWP', 'Dragon Lore', 3),
  ...getSkins('AWP', 'Gungnir', 2),
  ...getSkins('AK-47', 'Wild Lotus', 2),
  ...getSkins('M4A4', 'Howl', 2),
  ...getSkins('AK-47', 'Fire Serpent', 2),
  ...getSkins('Karambit', 'Doppler', 2),
  ...getSkins('Butterfly Knife', 'Doppler', 2),
  ...getSkins('Sport Gloves', 'Vice', 2),
  ...getSkins('Specialist Gloves', 'Crimson Kimono', 2),
];

const bananaCases = [
  {
    id: 'case_nano_banana_cyber',
    name: 'Кейс «Nano Banana Киберпанк»',
    nameEn: 'Nano Banana Cyber Case',
    subtitle: 'Высокотехнологичный банановый кейс с неоновым арсеналом',
    subtitleEn: 'High-tech cyberpunk banana case with neon weaponry',
    image: '/cases/case_nano_banana_cyber.jpg',
    priceDc: 1950,
    badge: 'NANO',
    badgeEn: 'NANO',
    category: 'custom',
    skins: cyberSkins
  },
  {
    id: 'case_inferno_banana_rush',
    name: 'Кейс «Раш Банана на Inferno»',
    nameEn: 'Inferno Banana Rush Case',
    subtitle: 'Легендарный штурм позиции Банан с огненным арсеналом',
    subtitleEn: 'Legendary Inferno banana site rush with fiery weapons',
    image: '/cases/case_inferno_banana_rush.jpg',
    priceDc: 2800,
    badge: 'INFERNO',
    badgeEn: 'INFERNO',
    category: 'custom',
    skins: infernoSkins
  },
  {
    id: 'case_nano_banana_gold',
    name: 'Кейс «Nano Banana 24K Золото»',
    nameEn: 'Nano Banana 24K Gold Case',
    subtitle: 'Королевская коллекция чистого золота 999 пробы',
    subtitleEn: 'Royal 24K solid gold luxury collection',
    image: '/cases/case_nano_banana_gold.jpg',
    priceDc: 12500,
    badge: '24K GOLD',
    badgeEn: '24K GOLD',
    category: 'highroller',
    skins: goldSkins
  },
  {
    id: 'case_quantum_banana',
    name: 'Кейс «Квантовый Банан»',
    nameEn: 'Quantum Banana Case',
    subtitle: 'Квантовые наночастицы и хроматические искажения',
    subtitleEn: 'Quantum nano-particles & chromatic distortion weaponry',
    image: '/cases/case_quantum_banana.jpg',
    priceDc: 3400,
    badge: 'QUANTUM',
    badgeEn: 'QUANTUM',
    category: 'custom',
    skins: quantumSkins
  },
  {
    id: 'case_monkey_business_bananas',
    name: 'Кейс «Monkey Business & Бананы»',
    nameEn: 'Monkey Business & Bananas Case',
    subtitle: 'Веселый и мемный банановый арсенал CS2',
    subtitleEn: 'Fun meme banana arsenal of CS2',
    image: '/cases/case_monkey_business_bananas.jpg',
    priceDc: 850,
    badge: 'MONKEY',
    badgeEn: 'MONKEY',
    category: 'budget',
    skins: monkeySkins
  },
  {
    id: 'case_mecha_banana_overdrive',
    name: 'Кейс «Меха-Банан Овердрайв»',
    nameEn: 'Mecha Banana Overdrive Case',
    subtitle: 'Роботизированный высокоточный комплекс вооружения',
    subtitleEn: 'Futuristic robotic high-precision weapon complex',
    image: '/cases/case_mecha_banana_overdrive.jpg',
    priceDc: 4500,
    badge: 'MECHA',
    badgeEn: 'MECHA',
    category: 'custom',
    skins: mechaSkins
  },
  {
    id: 'case_toxic_banana_biohazard',
    name: 'Кейс «Токсичный Банан Biohazard»',
    nameEn: 'Toxic Banana Biohazard Case',
    subtitle: 'Радиоактивный контейнер с мутировавшим оружием',
    subtitleEn: 'Radioactive biohazard container with mutated weaponry',
    image: '/cases/case_toxic_banana_biohazard.jpg',
    priceDc: 3100,
    badge: 'TOXIC',
    badgeEn: 'TOXIC',
    category: 'custom',
    skins: toxicSkins
  },
  {
    id: 'case_banana_jackpot_ultra',
    name: 'Кейс «Джекпот Банана Ultra»',
    nameEn: 'Banana Jackpot Ultra Case',
    subtitle: 'Сверхдорогой кейс с величайшими скинами в истории CS2',
    subtitleEn: 'Ultra jackpot crate with CS2\'s greatest historical grails',
    image: '/cases/case_banana_jackpot_ultra.jpg',
    priceDc: 35000,
    badge: 'JACKPOT',
    badgeEn: 'JACKPOT',
    category: 'highroller',
    skins: jackpotSkins
  }
];

let updatedCases = [...allCases];
for (const bc of bananaCases) {
  const existingIdx = updatedCases.findIndex(c => c.id === bc.id);
  if (existingIdx >= 0) {
    console.log(`Updating existing case: ${bc.id}`);
    updatedCases[existingIdx] = bc;
  } else {
    console.log(`Appending new Banana case: ${bc.id} (${bc.name}) with ${bc.skins.length} skins`);
    // Insert right after the terminals at the top
    updatedCases.splice(2, 0, bc);
  }
}

fs.writeFileSync(allCasesPath, JSON.stringify(updatedCases, null, 2), 'utf8');
console.log(`Successfully saved ${updatedCases.length} cases to all_cases.json`);
