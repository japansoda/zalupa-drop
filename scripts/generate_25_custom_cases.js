const fs = require('fs');
const path = require('path');

const allSkins = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/all_skins.json'), 'utf8'));
const allCases = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/all_cases.json'), 'utf8'));

console.log('Loaded all_skins:', allSkins.length, 'and all_cases:', allCases.length);

// Helper to find skins by keyword or criteria
function findSkins(filterFn, limit = 20) {
  const seen = new Set();
  const res = [];
  for (const s of allSkins) {
    const key = s.name.replace(/\s*\([^)]+\)$/, '');
    if (!seen.has(key) && filterFn(s)) {
      seen.add(key);
      res.push(s);
      if (res.length >= limit) break;
    }
  }
  return res;
}

// Generate an authentic 3D CS2 SVG crate
function generateCrateSvg(primaryColor, secondaryColor, accentColor, emblemText) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 215" width="100%" height="100%">
  <defs>
    <linearGradient id="groundG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="topG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="50%" stop-color="${secondaryColor}" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <linearGradient id="frontG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${secondaryColor}" />
      <stop offset="50%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="#090a10" />
    </linearGradient>

    <linearGradient id="sideG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <linearGradient id="accentG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Drop Shadow -->
  <ellipse cx="125" cy="195" rx="100" ry="18" fill="url(#groundG)" />

  <!-- 3D Crate Body -->
  <!-- Top Face -->
  <polygon points="125,25 215,65 125,105 35,65" fill="url(#topG)" stroke="#334155" stroke-width="2" />
  
  <!-- Right Face -->
  <polygon points="215,65 215,145 125,185 125,105" fill="url(#sideG)" stroke="#1e293b" stroke-width="2" />

  <!-- Front Face -->
  <polygon points="35,65 125,105 125,185 35,145" fill="url(#frontG)" stroke="#334155" stroke-width="2" />

  <!-- Glowing Accent Stripes -->
  <polygon points="45,85 115,117 115,123 45,91" fill="${accentColor}" opacity="0.85" filter="url(#glow)" />
  <polygon points="135,117 205,85 205,91 135,123" fill="${accentColor}" opacity="0.6" />

  <!-- Reinforced Corner Brackets -->
  <polygon points="35,65 50,71 42,95 35,85" fill="#475569" />
  <polygon points="215,65 200,71 208,95 215,85" fill="#334155" />
  <polygon points="125,105 115,110 115,130 125,125" fill="#64748b" />
  <polygon points="125,105 135,110 135,130 125,125" fill="#475569" />

  <!-- Center Steel Padlock / Emblem -->
  <circle cx="125" cy="115" r="22" fill="#0f172a" stroke="${accentColor}" stroke-width="3" filter="url(#glow)" />
  <circle cx="125" cy="115" r="17" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
  
  <!-- Emblem Typography / Icon -->
  <text x="125" y="120" font-family="monospace, sans-serif" font-weight="900" font-size="11" fill="${accentColor}" text-anchor="middle">
    ${emblemText}
  </text>
</svg>`;
}

const NEW_CASES_CONFIG = [
  {
    id: 'case_howl_legend',
    name: 'Кейс «Легенда Howl»',
    subtitle: 'Культовый вой волка, первозданное пламя и элитный огонь',
    priceDc: 6500,
    primaryColor: '#dc2626',
    secondaryColor: '#991b1b',
    accentColor: '#f97316',
    emblem: 'HOWL',
    themeFilter: (s) => s.name.includes('Howl') || s.name.includes('Wildfire') || s.name.includes('Code Red') || s.name.includes('Bloodsport') || s.name.includes('Kill Confirmed') || s.name.includes('Flame') || s.name.includes('Blaze') || s.name.includes('Hot Rod') || s.name.includes('Cyrex') || s.name.includes('Fade')
  },
  {
    id: 'case_vulcan_strike',
    name: 'Кейс «Вулкан & Огонь»',
    subtitle: 'Агрессивная мощь AK-47 Vulcan и огненная линейка CS2',
    priceDc: 1200,
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    accentColor: '#60a5fa',
    emblem: 'VLCN',
    themeFilter: (s) => s.name.includes('Vulcan') || s.name.includes('Frontside Misty') || s.name.includes('Asiimov') || s.name.includes('Water Elemental') || s.name.includes('Blue Phosphor') || s.name.includes('Electric Hive') || s.name.includes('Point Disarray') || s.name.includes('Redline') || s.name.includes('Doppler')
  },
  {
    id: 'case_golden_age',
    name: 'Кейс «Золотой Век»',
    subtitle: 'Чистое золото, Gold Arabesque и благородная роскошь',
    priceDc: 4200,
    primaryColor: '#eab308',
    secondaryColor: '#ca8a04',
    accentColor: '#fef08a',
    emblem: 'GOLD',
    themeFilter: (s) => s.name.includes('Gold') || s.name.includes('Arabesque') || s.name.includes('Desert Hydra') || s.name.includes('The Coalition') || s.name.includes('Golden Koi') || s.name.includes('Golden Coil') || s.name.includes('Brass') || s.name.includes('Lore') || s.name.includes('Tiger Tooth')
  },
  {
    id: 'case_fade_rush',
    name: 'Кейс «Градиентный Раш»',
    subtitle: 'Все спектры и переливы легендарных Fade градиентов',
    priceDc: 7800,
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    accentColor: '#facc15',
    emblem: 'FADE',
    themeFilter: (s) => s.name.includes('Fade') || s.name.includes('Amber Fade') || s.name.includes('Acid Fade') || s.name.includes('Marble Fade')
  },
  {
    id: 'case_glove_vault',
    name: 'Кейс «Хранилище Перчаток»',
    subtitle: 'Экстраординарные перчатки: Vice, Spearmint, Cobalt Skulls',
    priceDc: 5500,
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    accentColor: '#22d3ee',
    emblem: 'GLOV',
    themeFilter: (s) => s.weapon.toLowerCase().includes('gloves') || s.weapon.toLowerCase().includes('wraps') || s.name.toLowerCase().includes('gloves') || s.name.toLowerCase().includes('wraps')
  },
  {
    id: 'case_doppler_galaxy',
    name: 'Кейс «Галактика Допплер»',
    subtitle: 'Космические фазы Doppler, Gamma Doppler и сапфиры',
    priceDc: 8500,
    primaryColor: '#6366f1',
    secondaryColor: '#4338ca',
    accentColor: '#a855f7',
    emblem: 'DOPL',
    themeFilter: (s) => s.name.includes('Doppler') || s.name.includes('Gamma Doppler')
  },
  {
    id: 'case_wild_lotus',
    name: 'Кейс «Дикий Лотос»',
    subtitle: 'Флора, экзотика и редчайший шедевр Wild Lotus',
    priceDc: 9500,
    primaryColor: '#10b981',
    secondaryColor: '#047857',
    accentColor: '#f43f5e',
    emblem: 'LOTU',
    themeFilter: (s) => s.name.includes('Wild Lotus') || s.name.includes('Lotus') || s.name.includes('Silk Tiger') || s.name.includes('Jungle') || s.name.includes('Target Acquired') || s.name.includes('Synth Leaf') || s.name.includes('Green Marine') || s.name.includes('Emerald') || s.name.includes('Boreal')
  },
  {
    id: 'case_fire_serpent',
    name: 'Кейс «Огненный Змей»',
    subtitle: 'Древний миф Bravo Collection: Fire Serpent и драконы',
    priceDc: 6000,
    primaryColor: '#d97706',
    secondaryColor: '#b45309',
    accentColor: '#10b981',
    emblem: 'SRPN',
    themeFilter: (s) => s.name.includes('Fire Serpent') || s.name.includes('Jörmungandr') || s.name.includes('Containment Breach') || s.name.includes('Dragonfire') || s.name.includes('Kumicho Dragon') || s.name.includes('Emerald') || s.name.includes('Serpent')
  },
  {
    id: 'case_neon_revolution',
    name: 'Кейс «Неоновая Революция»',
    subtitle: 'Яркие кислотные всплески, граффити и киберпанк',
    priceDc: 950,
    primaryColor: '#f43f5e',
    secondaryColor: '#be123c',
    accentColor: '#10b981',
    emblem: 'NEON',
    themeFilter: (s) => s.name.includes('Neon Revolution') || s.name.includes('Neon Rider') || s.name.includes('Cortex') || s.name.includes('Neo-Noir') || s.name.includes('Mount Fuji') || s.name.includes('Decimator') || s.name.includes('Disco Tech') || s.name.includes('Fever Dream')
  },
  {
    id: 'case_stealth_sniper',
    name: 'Кейс «Снайперская Элита»',
    subtitle: 'Смертоносные винтовки: Gungnir, Medusa, The Prince',
    priceDc: 4800,
    primaryColor: '#0284c7',
    secondaryColor: '#0369a1',
    accentColor: '#38bdf8',
    emblem: 'SNIP',
    themeFilter: (s) => s.weapon.includes('AWP') || s.weapon.includes('SSG 08') || s.weapon.includes('SCAR-20') || s.weapon.includes('G3SG1')
  },
  {
    id: 'case_cs2_grail',
    name: 'Кейс «Грааль CS2»',
    subtitle: 'Священный грааль скинов: Dragon Lore, Howl, Blue Gem',
    priceDc: 15000,
    primaryColor: '#7c3aed',
    secondaryColor: '#5b21b6',
    accentColor: '#facc15',
    emblem: 'GRAIL',
    themeFilter: (s) => s.name.includes('Dragon Lore') || s.name.includes('Howl') || s.name.includes('Gungnir') || s.name.includes('Case Hardened') || s.name.includes('Fade') || s.name.includes('Doppler') || s.name.includes('Prince')
  },
  {
    id: 'case_knife_roulette',
    name: 'Кейс «Рулетка Ножей»',
    subtitle: '20 уникальных видов ножей: от Karambit до Butterfly',
    priceDc: 3200,
    primaryColor: '#b91c1c',
    secondaryColor: '#991b1b',
    accentColor: '#facc15',
    emblem: 'KNIF',
    themeFilter: (s) => s.name.startsWith('★') && !s.weapon.toLowerCase().includes('gloves') && !s.weapon.toLowerCase().includes('wraps')
  },
  {
    id: 'case_redline_fury',
    name: 'Кейс «Ярость Redline»',
    subtitle: 'Строгая красно-черная классика карбона и стали',
    priceDc: 450,
    primaryColor: '#18181b',
    secondaryColor: '#27272a',
    accentColor: '#ef4444',
    emblem: 'REDL',
    themeFilter: (s) => s.name.includes('Redline') || s.name.includes('Crimson Web') || s.name.includes('Cyrex') || s.name.includes('Blood') || s.name.includes('Red') || s.name.includes('Muertos') || s.name.includes('Candy Apple')
  },
  {
    id: 'case_matrix_overdrive',
    name: 'Кейс «Матрица Овердрайв»',
    subtitle: 'Кибернетический изумруд, Hydroponic и ядерная энергия',
    priceDc: 2400,
    primaryColor: '#15803d',
    secondaryColor: '#166534',
    accentColor: '#4ade80',
    emblem: 'MTRX',
    themeFilter: (s) => s.name.includes('Hydroponic') || s.name.includes('Poseidon') || s.name.includes('Atheris') || s.name.includes('Nuclear') || s.name.includes('Emerald') || s.name.includes('Chemical') || s.name.includes('Biohazard') || s.name.includes('Green')
  },
  {
    id: 'case_tokyo_drift',
    name: 'Кейс «Токио Дрифт»',
    subtitle: 'Эстетика неонового Токио, драконы и восточные мотивы',
    priceDc: 1800,
    primaryColor: '#e11d48',
    secondaryColor: '#be123c',
    accentColor: '#fb7185',
    emblem: 'TOKY',
    themeFilter: (s) => s.name.includes('Bloodsport') || s.name.includes('Kumicho Dragon') || s.name.includes('Akihabara') || s.name.includes('Temukau') || s.name.includes('Oni Taiji') || s.name.includes('Dragon') || s.name.includes('Dragon King') || s.name.includes('Tengu')
  },
  {
    id: 'case_tactical_force',
    name: 'Кейс «Тактический Спецназ»',
    subtitle: 'Милитари, камуфляж спецназа и боевая классика',
    priceDc: 350,
    primaryColor: '#3f3f46',
    secondaryColor: '#27272a',
    accentColor: '#a1a1aa',
    emblem: 'SPEC',
    themeFilter: (s) => s.name.includes('Modern Hunter') || s.name.includes('Predator') || s.name.includes('Snake Camo') || s.name.includes('Urban') || s.name.includes('Camo') || s.name.includes('Safari') || s.name.includes('DDPAT') || s.name.includes('Tactical')
  },
  {
    id: 'case_royale_flush',
    name: 'Кейс «Роял Флеш»',
    subtitle: 'Королевские масти Таро: The Empress, The Emperor, Mortis',
    priceDc: 1500,
    primaryColor: '#9333ea',
    secondaryColor: '#7e22ce',
    accentColor: '#facc15',
    emblem: 'FLSH',
    themeFilter: (s) => s.name.includes('Empress') || s.name.includes('Emperor') || s.name.includes('Mortis') || s.name.includes('Fairy Tale') || s.name.includes('Queen') || s.name.includes('Prince') || s.name.includes('King') || s.name.includes('Royale')
  },
  {
    id: 'case_superconductor',
    name: 'Кейс «Суперпроводник»',
    subtitle: 'Электрический лазурный холод и плазменный заряд',
    priceDc: 6200,
    primaryColor: '#0284c7',
    secondaryColor: '#0369a1',
    accentColor: '#38bdf8',
    emblem: 'SUPR',
    themeFilter: (s) => s.name.includes('Superconductor') || s.name.includes('Blue Phosphor') || s.name.includes('Sun in Leo') || s.name.includes('Cobalt') || s.name.includes('Blueprint') || s.name.includes('Aqua') || s.name.includes('Ocean') || s.name.includes('Ice')
  },
  {
    id: 'case_ice_fire',
    name: 'Кейс «Лед & Пламя»',
    subtitle: 'Битва двух стихий: ледяной Marble Fade и огненный жар',
    priceDc: 5200,
    primaryColor: '#0ea5e9',
    secondaryColor: '#ef4444',
    accentColor: '#f59e0b',
    emblem: 'FIRE',
    themeFilter: (s) => s.name.includes('Marble Fade') || s.name.includes('Water Elemental') || s.name.includes('Hyper Beast') || s.name.includes('Heat') || s.name.includes('Blaze') || s.name.includes('Fire') || s.name.includes('Flame') || s.name.includes('Ice')
  },
  {
    id: 'case_dark_fantasy',
    name: 'Кейс «Темное Фэнтези»',
    subtitle: 'Тайная магия теней, экзоскелеты и кошмары бездны',
    priceDc: 800,
    primaryColor: '#312e81',
    secondaryColor: '#1e1b4b',
    accentColor: '#818cf8',
    emblem: 'DARK',
    themeFilter: (s) => s.name.includes('Exoskeleton') || s.name.includes('Nightmare') || s.name.includes('Phantom') || s.name.includes('Black Lotus') || s.name.includes('Dark Water') || s.name.includes('Grim') || s.name.includes('Ghost') || s.name.includes('Spectre')
  },
  {
    id: 'case_bubblegum_dream',
    name: 'Кейс «Bubblegum Мечта»',
    subtitle: 'Яркие конфетные оттенки, каваи и поп-арт стилистика',
    priceDc: 650,
    primaryColor: '#ec4899',
    secondaryColor: '#db2777',
    accentColor: '#f472b6',
    emblem: 'GUM',
    themeFilter: (s) => s.name.includes('Starlight Protector') || s.name.includes('Fever Dream') || s.name.includes('Traitor') || s.name.includes('Decimator') || s.name.includes('Neon') || s.name.includes('Sugar Rush') || s.name.includes('Pink') || s.name.includes('Fade')
  },
  {
    id: 'case_street_graffiti',
    name: 'Кейс «Уличный Граффити»',
    subtitle: 'Бунтарский стрит-арт, теги баллончиком и Head Shot',
    priceDc: 750,
    primaryColor: '#ea580c',
    secondaryColor: '#c2410c',
    accentColor: '#fde047',
    emblem: 'TAGS',
    themeFilter: (s) => s.name.includes('Head Shot') || s.name.includes('In Living Color') || s.name.includes('Duality') || s.name.includes('Printstream') || s.name.includes('Player Two') || s.name.includes('Vandal') || s.name.includes('Graffiti') || s.name.includes('Cartel')
  },
  {
    id: 'case_cyber_ninja',
    name: 'Кейс «Кибер-Ниндзя»',
    subtitle: 'Скрытные убийцы киберпанка, титан и нано-сталь',
    priceDc: 1100,
    primaryColor: '#475569',
    secondaryColor: '#334155',
    accentColor: '#38bdf8',
    emblem: 'NNJA',
    themeFilter: (s) => s.name.includes('Decimator') || s.name.includes('Elite Build') || s.name.includes('Sugar Rush') || s.name.includes('Commemoration') || s.name.includes('Mecha') || s.name.includes('Shadow') || s.name.includes('Stealth') || s.name.includes('Carbon')
  },
  {
    id: 'case_royal_hunt',
    name: 'Кейс «Королевская Охота»',
    subtitle: 'Охотничьи трофеи королей: Man-o-war, Golden Coil, Koi',
    priceDc: 1400,
    primaryColor: '#b45309',
    secondaryColor: '#92400e',
    accentColor: '#fde047',
    emblem: 'HUNT',
    themeFilter: (s) => s.name.includes('Man-o\'-war') || s.name.includes('Golden Coil') || s.name.includes('Golden Koi') || s.name.includes('Grim') || s.name.includes('Huntsman') || s.name.includes('Safari') || s.name.includes('Predator') || s.name.includes('Hunter')
  },
  {
    id: 'case_covert_arsenal',
    name: 'Кейс «Тайный Арсенал»',
    subtitle: 'Только максимальная редкость: Тайное (Covert) и Ножи',
    priceDc: 3900,
    primaryColor: '#e11d48',
    secondaryColor: '#9f1239',
    accentColor: '#fbbf24',
    emblem: 'COVT',
    themeFilter: (s) => s.rarity === 'covert' || s.rarity === 'gold'
  }
];

console.log('Generating 25 custom cases and SVGs...');

const casesDir = path.join(__dirname, '../public/cases');
const newCases = [];

for (const cfg of NEW_CASES_CONFIG) {
  // 1. Generate SVG file
  const svgFilename = `${cfg.id}.svg`;
  const svgPath = path.join(casesDir, svgFilename);
  const svgContent = generateCrateSvg(cfg.primaryColor, cfg.secondaryColor, cfg.accentColor, cfg.emblem);
  fs.writeFileSync(svgPath, svgContent, 'utf8');

  // 2. Select 15 - 20 DISTINCT matching skins
  let candidates = findSkins(cfg.themeFilter, 25);
  if (candidates.length < 15) {
    // Fill up with high quality skins to reach 17-18 distinct items
    const fillers = findSkins((s) => !candidates.some(c => c.name === s.name) && (s.rarity === 'classified' || s.rarity === 'covert' || s.rarity === 'restricted'), 20);
    candidates = [...candidates, ...fillers].slice(0, 18);
  } else {
    candidates = candidates.slice(0, 18);
  }

  // Ensure case has at least 1 gold knife/glove
  const hasKnifeOrGlove = candidates.some(s => s.name.startsWith('★'));
  if (!hasKnifeOrGlove) {
    const knife = allSkins.find(s => s.name.startsWith('★') && s.rarity === 'gold');
    if (knife) candidates[0] = knife;
  }

  const caseObj = {
    id: cfg.id,
    name: cfg.name,
    subtitle: cfg.subtitle,
    image: `/cases/${svgFilename}`,
    priceDc: cfg.priceDc,
    category: 'custom',
    skins: candidates,
  };

  newCases.push(caseObj);
  console.log(`Created ${cfg.name} with ${candidates.length} distinct skins and price ${cfg.priceDc} DC`);
}

// Remove any prior occurrences of these new case IDs to allow clean re-runs
const existingIds = new Set(NEW_CASES_CONFIG.map(c => c.id));
const filteredExisting = allCases.filter(c => !existingIds.has(c.id));
const updatedCases = [...filteredExisting, ...newCases];

fs.writeFileSync(
  path.join(__dirname, '../src/data/all_cases.json'),
  JSON.stringify(updatedCases, null, 2),
  'utf8'
);

console.log('Successfully saved all_cases.json with total cases:', updatedCases.length);
