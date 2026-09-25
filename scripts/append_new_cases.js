const fs = require('fs');
const path = require('path');

const allCasesPath = path.join(__dirname, '../src/data/all_cases.json');
const allSkinsPath = path.join(__dirname, '../src/data/all_skins.json');
const fetchedSkinsPath = path.join(__dirname, 'fetched_skins.json');
const steamIconsPath = path.join(__dirname, 'steam_icons.json');
const knifeIdsPath = path.join(__dirname, '../src/data/official_case_knife_ids.json');

const allCases = JSON.parse(fs.readFileSync(allCasesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(allSkinsPath, 'utf8'));
const fetchedSkins = fs.existsSync(fetchedSkinsPath) ? JSON.parse(fs.readFileSync(fetchedSkinsPath, 'utf8')) : {};
const steamIcons = fs.existsSync(steamIconsPath) ? JSON.parse(fs.readFileSync(steamIconsPath, 'utf8')) : [];
const officialKnifeIds = JSON.parse(fs.readFileSync(knifeIdsPath, 'utf8'));

console.log(`Loaded ${allCases.length} cases and ${allSkins.length} skins.`);

// Helper to find skins by weapon and skinName from allSkins
function findSkins(weapon, skinName) {
  const wLower = weapon.toLowerCase().trim();
  const snLower = skinName.toLowerCase().trim();
  return allSkins.filter(s => {
    const sw = (s.weapon || '').toLowerCase().trim();
    const ssn = (s.skinName || s.name || '').toLowerCase().trim();
    return (sw === wLower || sw.includes(wLower) || wLower.includes(sw)) &&
           (ssn === snLower || ssn.includes(snLower) || snLower.includes(ssn));
  });
}

function findExactSkin(weapon, skinName, wear, statTrak = false) {
  const wLower = weapon.toLowerCase().trim();
  const snLower = skinName.toLowerCase().trim();
  return allSkins.find(s => {
    const sw = (s.weapon || '').toLowerCase().trim();
    const ssn = (s.skinName || '').toLowerCase().trim();
    const sWear = (s.wear || '').toUpperCase().trim();
    const sSt = Boolean(s.statTrak);
    return (sw === wLower || sw.includes(wLower)) &&
           (ssn === snLower || ssn.includes(snLower)) &&
           sWear === wear &&
           sSt === statTrak;
  });
}

// Build skin item with fallback
function makeSkin(weapon, skinName, rarity, wear = 'FT', statTrak = false, baseDc = 1500) {
  const found = findExactSkin(weapon, skinName, wear, statTrak);
  if (found) {
    return { ...found };
  }

  // Check fetched skins
  const query = `${weapon} | ${skinName}`;
  const fetched = fetchedSkins[query];
  const wearLabels = {
    FN: 'Прямо с завода',
    MW: 'Немного поношенное',
    FT: 'После полевых испытаний',
    WW: 'Поношенное',
    BS: 'Закалённое в боях'
  };

  const id = `skin_${weapon.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${skinName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${wear.toLowerCase()}${statTrak ? '_st' : ''}`;
  const displayName = `${statTrak ? 'StatTrak™ ' : ''}${weapon} | ${skinName} (${wearLabels[wear] || wear})`;

  let image = fetched?.icon || '/images/special_item.png';
  let priceDc = baseDc;
  if (wear === 'FN') priceDc = Math.round(baseDc * 1.8);
  if (wear === 'MW') priceDc = Math.round(baseDc * 1.3);
  if (wear === 'WW') priceDc = Math.round(baseDc * 0.85);
  if (wear === 'BS') priceDc = Math.round(baseDc * 0.7);
  if (statTrak) priceDc = Math.round(priceDc * 1.5);

  return {
    id,
    name: displayName,
    weapon,
    skinName,
    rarity,
    wear,
    wearLabel: wearLabels[wear] || wear,
    image,
    priceUsd: Math.round((priceDc / 100) * 100) / 100,
    priceDc,
    steamMarketUrl: `https://steamcommunity.com/market/listings/730/${encodeURIComponent((statTrak ? 'StatTrak™ ' : '') + weapon + ' | ' + skinName + ' (' + (wear === 'FN' ? 'Factory New' : wear === 'MW' ? 'Minimal Wear' : wear === 'FT' ? 'Field-Tested' : wear === 'WW' ? 'Well-Worn' : 'Battle-Scarred') + ')')}`,
    statTrak
  };
}

function makeSkinMultiWear(weapon, skinName, rarity, baseDc, wears = ['FN', 'MW', 'FT']) {
  const res = [];
  for (const w of wears) {
    res.push(makeSkin(weapon, skinName, rarity, w, false, baseDc));
  }
  // Add 1 StatTrak variant
  res.push(makeSkin(weapon, skinName, rarity, 'FT', true, baseDc));
  return res;
}

// 1. The Gallery Case
const gallerySkins = [
  ...makeSkinMultiWear('M4A1-S', 'Vaporwave', 'covert', 18500),
  ...makeSkinMultiWear('Glock-18', 'Gold Toof', 'covert', 15200),
  ...makeSkinMultiWear('AK-47', 'The Outsiders', 'classified', 6800),
  ...makeSkinMultiWear('UMP-45', 'Neo-Noir', 'classified', 3800),
  ...makeSkinMultiWear('P250', 'Epicenter', 'classified', 3200),
  ...makeSkinMultiWear('SSG 08', 'Rapid Transit', 'restricted', 1450),
  ...makeSkinMultiWear('MAC-10', 'Saibā Oni', 'restricted', 1350),
  ...makeSkinMultiWear('M4A4', 'Turbine', 'restricted', 1600),
  ...makeSkinMultiWear('Dual Berettas', 'Hydro Strike', 'restricted', 1100),
  ...makeSkinMultiWear('P90', 'Randy Rush', 'restricted', 1050),
  ...makeSkinMultiWear('USP-S', '27', 'milspec', 520, ['FN', 'FT']),
  ...makeSkinMultiWear('Desert Eagle', 'Calligraffiti', 'milspec', 480, ['FN', 'FT']),
  ...makeSkinMultiWear('AUG', 'Luxe Trim', 'milspec', 260, ['MW', 'FT']),
  ...makeSkinMultiWear('SCAR-20', 'Trail Blazer', 'milspec', 220, ['MW', 'FT']),
  ...makeSkinMultiWear('R8 Revolver', 'Tango', 'milspec', 190, ['MW', 'FT']),
  ...makeSkinMultiWear('MP5-SD', 'Statics', 'milspec', 180, ['MW', 'FT']),
  ...makeSkinMultiWear('M249', 'Hypnosis', 'milspec', 150, ['MW', 'FT'])
];

// 2. The Fever Case
const feverSkins = [
  ...makeSkinMultiWear('AWP', 'Printstream', 'covert', 38000),
  ...makeSkinMultiWear('FAMAS', 'Bad Trip', 'covert', 14200),
  ...makeSkinMultiWear('AK-47', 'Searing Rage', 'classified', 8400),
  ...makeSkinMultiWear('Glock-18', 'Shinobu', 'classified', 5600),
  ...makeSkinMultiWear('UMP-45', 'K.O. Factory', 'classified', 3900),
  ...makeSkinMultiWear('Desert Eagle', 'Serpent Strike', 'restricted', 2100),
  ...makeSkinMultiWear('Galil AR', 'Control', 'restricted', 1450),
  ...makeSkinMultiWear('Nova', 'Rising Sun', 'restricted', 1200),
  ...makeSkinMultiWear('P90', 'Wave Breaker', 'restricted', 1150),
  ...makeSkinMultiWear('Zeus x27', 'Tosai', 'restricted', 980),
  ...makeSkinMultiWear('M4A4', 'Choppa', 'milspec', 650, ['FN', 'FT']),
  ...makeSkinMultiWear('MAG-7', 'Resupply', 'milspec', 290, ['MW', 'FT']),
  ...makeSkinMultiWear('MP9', 'Nexus', 'milspec', 280, ['MW', 'FT']),
  ...makeSkinMultiWear('P2000', 'Sure Grip', 'milspec', 240, ['MW', 'FT']),
  ...makeSkinMultiWear('SSG 08', 'Memorial', 'milspec', 220, ['MW', 'FT']),
  ...makeSkinMultiWear('USP-S', 'PC-GRN', 'milspec', 420, ['FN', 'FT'])
];

// 3. Overpass 2024 Collection
const overpassSkins = [
  ...makeSkinMultiWear('AK-47', 'B the Monster', 'covert', 42000),
  ...makeSkinMultiWear('Zeus x27', 'Dragon Snore', 'classified', 11500),
  ...makeSkinMultiWear('AWP', 'Crakow!', 'classified', 13800),
  ...makeSkinMultiWear('XM1014', 'Monster Melt', 'restricted', 2600),
  ...makeSkinMultiWear('Dual Berettas', 'Sweet Little Angels', 'restricted', 2100),
  ...makeSkinMultiWear('AUG', 'Eye of Zapems', 'restricted', 1950),
  ...makeSkinMultiWear('MAC-10', 'Pipsqueak', 'milspec', 650, ['FN', 'FT']),
  ...makeSkinMultiWear('Nova', 'Wurst Hölle', 'milspec', 450, ['MW', 'FT']),
  ...makeSkinMultiWear('Glock-18', 'Teal Graf', 'milspec', 590, ['FN', 'FT']),
  ...makeSkinMultiWear('MP5-SD', 'Neon Squeezer', 'milspec', 420, ['MW', 'FT'])
];

// 4. Sport & Field Collection
const sportSkins = [
  ...makeSkinMultiWear('M4A1-S', 'Fade', 'covert', 75000),
  ...makeSkinMultiWear('Glock-18', 'AXIA', 'classified', 12500),
  ...makeSkinMultiWear('Galil AR', 'Rainbow Spoon', 'classified', 8900),
  ...makeSkinMultiWear('UMP-45', 'Crimson Foil', 'restricted', 2800),
  ...makeSkinMultiWear('MP9', 'Arctic Tri-Tone', 'restricted', 2200),
  ...makeSkinMultiWear('USP-S', 'Alpine Camo', 'milspec', 1100, ['FN', 'FT']),
  ...makeSkinMultiWear('SSG 08', 'Zeno', 'milspec', 580, ['MW', 'FT'])
];

// 5. Graphic Collection
const graphicSkins = [
  ...makeSkinMultiWear('AWP', 'CMYK', 'covert', 34000),
  ...makeSkinMultiWear('Desert Eagle', 'Starcade', 'classified', 9800),
  ...makeSkinMultiWear('AUG', "Lil' Pig", 'classified', 6400),
  ...makeSkinMultiWear('M4A4', 'Polysoup', 'restricted', 2600),
  ...makeSkinMultiWear('P90', 'Attack Vector', 'restricted', 1850),
  ...makeSkinMultiWear('CZ75-Auto', 'Slalom', 'milspec', 520, ['FN', 'FT']),
  ...makeSkinMultiWear('XM1014', 'Halftone Shift', 'milspec', 460, ['MW', 'FT'])
];

// 6. Heat Treated Limited Case
const heatTreatedSkins = [
  ...makeSkinMultiWear('Five-SeveN', 'Heat Treated', 'classified', 9200, ['FN', 'MW', 'FT', 'WW', 'BS']),
  ...makeSkinMultiWear('Desert Eagle', 'Heat Treated', 'covert', 21000, ['FN', 'MW', 'FT']),
  ...makeSkinMultiWear('AK-47', 'Case Hardened', 'classified', 18500, ['FN', 'MW', 'FT', 'WW']),
  ...makeSkinMultiWear('MAC-10', 'Case Hardened', 'restricted', 3200, ['FN', 'MW', 'FT']),
  ...makeSkinMultiWear('Five-SeveN', 'Case Hardened', 'restricted', 4100, ['FN', 'MW', 'FT', 'BS'])
];

// 7. Spy Tech 2026 Collection
const spyTechSkins = [
  ...makeSkinMultiWear('AK-47', 'The Oligarch', 'covert', 28500),
  ...makeSkinMultiWear('M4A4', 'Full Throttle', 'classified', 11200),
  ...makeSkinMultiWear('AWP', 'Ice Coaled', 'classified', 9600),
  ...makeSkinMultiWear('Glock-18', 'Mirror Mosaic', 'restricted', 3400),
  ...makeSkinMultiWear('MP7', 'Smoking Kills', 'restricted', 2500),
  ...makeSkinMultiWear('M4A1-S', 'Liquidation', 'restricted', 4200),
  ...makeSkinMultiWear('UMP-45', 'Continuum', 'milspec', 950, ['FN', 'FT']),
  ...makeSkinMultiWear('MAC-10', 'Cat Fight', 'milspec', 820, ['FN', 'FT'])
];

// 8. Arabesque 2026 Collection
const arabesqueSkins = [
  ...makeSkinMultiWear('AK-47', 'Gold Arabesque', 'covert', 145000, ['FN', 'MW', 'FT']),
  ...makeSkinMultiWear('AWP', "Queen's Gambit", 'classified', 18500),
  ...makeSkinMultiWear('Glock-18', 'Fully Tuned', 'classified', 8400),
  ...makeSkinMultiWear('AK-47', 'Crane Flight', 'restricted', 4800),
  ...makeSkinMultiWear('P90', 'Deathgaze', 'restricted', 3200),
  ...makeSkinMultiWear('P250', 'Kintsugi', 'milspec', 1200, ['FN', 'FT']),
  ...makeSkinMultiWear('Desert Eagle', 'Firebreathing', 'milspec', 1400, ['FN', 'FT']),
  ...makeSkinMultiWear('Galil AR', 'Galigator', 'milspec', 950, ['FN', 'FT']),
  ...makeSkinMultiWear('M4A1-S', 'Electrum', 'covert', 39000)
];

// 9. Sealed Genesis Terminal
const genesisSkins = [
  ...makeSkinMultiWear('AK-47', 'The Outsiders', 'classified', 7500),
  ...makeSkinMultiWear('M4A1-S', 'Vaporwave', 'covert', 22000),
  ...makeSkinMultiWear('Glock-18', 'Gold Toof', 'covert', 16500),
  ...makeSkinMultiWear('AWP', 'Printstream', 'covert', 38000),
  ...makeSkinMultiWear('FAMAS', 'Bad Trip', 'covert', 14000),
  ...makeSkinMultiWear('SSG 08', 'Rapid Transit', 'restricted', 1600),
  ...makeSkinMultiWear('MAC-10', 'Saibā Oni', 'restricted', 1400),
  ...makeSkinMultiWear('UMP-45', 'Neo-Noir', 'classified', 4100),
  ...makeSkinMultiWear('P250', 'Epicenter', 'classified', 3500),
  ...makeSkinMultiWear('USP-S', '27', 'milspec', 650, ['FN', 'FT']),
  ...makeSkinMultiWear('Desert Eagle', 'Calligraffiti', 'milspec', 520, ['FN', 'FT']),
  ...makeSkinMultiWear('Dual Berettas', 'Hydro Strike', 'restricted', 1200),
  ...makeSkinMultiWear('P90', 'Randy Rush', 'restricted', 1100),
  // Rare knife drop in genesis
  makeSkin('★ Kukri Knife', 'Fade', 'gold', 'FN', false, 185000),
  makeSkin('★ Kukri Knife', 'Slaughter', 'gold', 'MW', false, 120000),
  makeSkin('★ Kukri Knife', 'Crimson Web', 'gold', 'FT', false, 95000)
];

// 10. Sealed Dead Hand Terminal
const deadHandSkins = [
  makeSkin('★ Sport Gloves', 'Blaze', 'extraordinary', 'MW', false, 195000),
  makeSkin('★ Specialist Gloves', 'Big Swell', 'extraordinary', 'MW', false, 175000),
  makeSkin('★ Sport Gloves', 'Amphibious', 'extraordinary', 'FT', false, 120000),
  makeSkin('★ Specialist Gloves', 'Crimson Kimono', 'extraordinary', 'FT', false, 240000),
  ...makeSkinMultiWear('AK-47', 'Searing Rage', 'classified', 8800),
  ...makeSkinMultiWear('Desert Eagle', 'Serpent Strike', 'restricted', 2400),
  ...makeSkinMultiWear('AK-47', 'The Oligarch', 'covert', 29000),
  ...makeSkinMultiWear('M4A4', 'Full Throttle', 'classified', 11500),
  ...makeSkinMultiWear('AWP', 'Ice Coaled', 'classified', 9900),
  ...makeSkinMultiWear('Glock-18', 'Mirror Mosaic', 'restricted', 3600),
  ...makeSkinMultiWear('MP7', 'Smoking Kills', 'restricted', 2600),
  ...makeSkinMultiWear('M4A1-S', 'Liquidation', 'restricted', 4500),
  ...makeSkinMultiWear('UMP-45', 'Continuum', 'milspec', 980, ['FN', 'FT']),
  ...makeSkinMultiWear('MAC-10', 'Cat Fight', 'milspec', 850, ['FN', 'FT'])
];

const newCasesList = [
  {
    id: 'terminal-genesis',
    name: 'Запечатанный терминал «Генезис»',
    nameEn: 'Sealed Genesis Terminal',
    subtitle: 'CS2 Терминал: 5 предложений торгов и выбор сделки',
    subtitleEn: 'CS2 Terminal: 5 offer negotiation rounds',
    image: 'https://community.cloudflare.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnRk7P6he6FpbqWXCzSVkL4h6bExTHuwx0wk6mjUmdn_Iy2TbAUkCZslQu8CtBTrkNz5d7S1oNprwEg',
    priceDc: 950,
    badge: 'TERMINAL',
    badgeEn: 'TERMINAL',
    category: 'terminal',
    skins: genesisSkins
  },
  {
    id: 'terminal-dead-hand',
    name: 'Запечатанный терминал «Мёртвая рука»',
    nameEn: 'Sealed Dead Hand Terminal',
    subtitle: 'CS2 Терминал: редкие перчатки и военные прототипы',
    subtitleEn: 'CS2 Terminal: rare gloves and military prototypes',
    image: 'https://community.cloudflare.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnVk7P6he6FpbqHGCmSTk-hz5rZsHS3mwxgjsGjRytb7dC2VPwYlAschRrFbsBC4xNH5d7S1gfLQnNE',
    priceDc: 1200,
    badge: 'TERMINAL',
    badgeEn: 'TERMINAL',
    category: 'terminal',
    skins: deadHandSkins
  },
  {
    id: 'case-the-gallery',
    name: 'Кейс «Галерея»',
    nameEn: 'The Gallery Case',
    subtitle: 'Официальный кейс CS2 с ножами Кукри',
    subtitleEn: 'Official CS2 case with Kukri knives',
    image: 'https://community.cloudflare.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnYVuPD5baE6IfTFCmSRme0j5eU5SXrjkRwmt2rWnoqhdnjEPQQiDpRxTflK7EePRV2-Kg',
    priceDc: 1850,
    badge: 'NEW',
    badgeEn: 'NEW',
    category: 'official',
    skins: gallerySkins
  },
  {
    id: 'case-fever-2025',
    name: 'Кейс «Лихорадка»',
    nameEn: 'The Fever Case',
    subtitle: 'Официальный кейс с AWP Printstream и ножами Хрома',
    subtitleEn: 'Official CS2 case with AWP Printstream & Chroma knives',
    image: 'https://community.cloudflare.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frncVtqv7MPE8JaHHCj_Dl-wk4-NtFirikURy4jiGwo2udHqVaAEjDZp3EflK7EeSMnMs4w',
    priceDc: 2400,
    badge: 'HOT',
    badgeEn: 'HOT',
    category: 'official',
    skins: feverSkins
  },
  {
    id: 'case-overpass-2024',
    name: 'Коллекция «Overpass 2024»',
    nameEn: 'The Overpass 2024 Collection',
    subtitle: 'Официальная коллекция Арсенала CS2 с B the Monster',
    subtitleEn: 'Official Armory Collection featuring B the Monster',
    image: '/cases/case_toxic_hazard.webp',
    priceDc: 3200,
    badge: 'ARMORY',
    badgeEn: 'ARMORY',
    category: 'official',
    skins: overpassSkins
  },
  {
    id: 'case-sport-and-field',
    name: 'Коллекция «Спорт и отдых»',
    nameEn: 'The Sport & Field Collection',
    subtitle: 'Коллекция Арсенала CS2 с легендарным M4A1-S Fade',
    subtitleEn: 'Armory Collection with M4A1-S Fade',
    image: '/cases/case_bloodsport_arena.webp',
    priceDc: 2900,
    badge: 'ARMORY',
    badgeEn: 'ARMORY',
    category: 'official',
    skins: sportSkins
  },
  {
    id: 'case-graphic-design',
    name: 'Коллекция «Графика»',
    nameEn: 'The Graphic Collection',
    subtitle: 'Коллекция Арсенала CS2 с редким AWP CMYK',
    subtitleEn: 'Armory Collection featuring AWP CMYK',
    image: '/cases/case_hyper_velocity.webp',
    priceDc: 2750,
    badge: 'ARMORY',
    badgeEn: 'ARMORY',
    category: 'official',
    skins: graphicSkins
  },
  {
    id: 'case-heat-treated',
    name: 'Кейс «Термообработка»',
    nameEn: 'Heat Treated Limited Edition',
    subtitle: 'Лимитированный кейс Five-SeveN и закаленной серии',
    subtitleEn: 'Limited case featuring Heat Treated finishes',
    image: '/cases/case_inferno_heat.webp',
    priceDc: 6500,
    badge: 'LIMITED',
    badgeEn: 'LIMITED',
    category: 'custom',
    skins: heatTreatedSkins
  },
  {
    id: 'case-spy-tech-2026',
    name: 'Коллекция «Шпионские технологии»',
    nameEn: 'Spy Tech 2026 Collection',
    subtitle: 'Секретные образцы вооружения с AK-47 The Oligarch',
    subtitleEn: 'Covert spy weaponry with AK-47 The Oligarch',
    image: '/cases/case_stealth_sniper_v2.webp',
    priceDc: 4200,
    badge: 'ELITE',
    badgeEn: 'ELITE',
    category: 'custom',
    skins: spyTechSkins
  },
  {
    id: 'case-arabesque-2026',
    name: 'Коллекция «Арабеска Востока»',
    nameEn: 'Arabesque 2026 Collection',
    subtitle: 'Золотая коллекция с AK-47 Gold Arabesque',
    subtitleEn: 'Gold collection with AK-47 Gold Arabesque',
    image: '/cases/case_gold_arabesque.webp',
    priceDc: 7500,
    badge: 'VIP',
    badgeEn: 'VIP',
    category: 'highroller',
    skins: arabesqueSkins
  }
];

// Append or update existing in all_cases
let updatedCases = [...allCases];
for (const nc of newCasesList) {
  const existingIdx = updatedCases.findIndex(c => c.id === nc.id);
  if (existingIdx >= 0) {
    console.log(`Updating existing case: ${nc.id}`);
    updatedCases[existingIdx] = nc;
  } else {
    console.log(`Appending new case: ${nc.id} (${nc.name}) with ${nc.skins.length} skins`);
    // Put terminals and new official cases at the top of the array so they are immediately visible
    updatedCases.unshift(nc);
  }
}

fs.writeFileSync(allCasesPath, JSON.stringify(updatedCases, null, 2), 'utf8');
console.log(`Successfully saved ${updatedCases.length} cases to all_cases.json`);

// Add Kukri knives to officialKnifeIds for case-the-gallery
const kukriKnives = allSkins.filter(s => (s.weapon || '').toLowerCase().includes('kukri'));
if (kukriKnives.length > 0) {
  officialKnifeIds['case-the-gallery'] = kukriKnives.map(k => k.id);
  console.log(`Mapped ${kukriKnives.length} Kukri knives for case-the-gallery`);
}

// Add Chroma knives for case-fever-2025
const chromaKnives = allSkins.filter(s => {
  const n = (s.skinName || '').toLowerCase();
  return (s.rarity === 'gold' || s.rarity === 'extraordinary') && (n.includes('doppler') || n.includes('marble') || n.includes('tiger') || n.includes('damascus'));
});
if (chromaKnives.length > 0) {
  officialKnifeIds['case-fever-2025'] = chromaKnives.slice(0, 50).map(k => k.id);
  console.log(`Mapped ${officialKnifeIds['case-fever-2025'].length} Chroma knives for case-fever-2025`);
}

fs.writeFileSync(knifeIdsPath, JSON.stringify(officialKnifeIds, null, 2), 'utf8');
console.log(`Successfully updated official_case_knife_ids.json`);
