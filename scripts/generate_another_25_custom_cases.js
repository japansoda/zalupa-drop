const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '../src/data/all_cases.json');
const skinsPath = path.join(__dirname, '../src/data/all_skins.json');
const publicCasesDir = path.join(__dirname, '../public/cases');

if (!fs.existsSync(publicCasesDir)) {
  fs.mkdirSync(publicCasesDir, { recursive: true });
}

const allCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));

// Deduplicate skins by clean weapon & skinName (no stickers/charms/agents)
function getCleanWeaponSkins(skinList) {
  const seen = new Set();
  const res = [];
  for (const s of skinList) {
    const w = (s.weapon || '').toLowerCase();
    const n = (s.name || '').toLowerCase();
    if (w === 'sticker' || w === 'charm' || w === 'patch' || w === 'agent' || w === 'оперативник') continue;
    if (w.includes('наклейка') || w.includes('брелок') || w.includes('agent') || w.includes('оперативник')) continue;
    if (n.startsWith('agent |') || n.startsWith('оперативник |') || n.startsWith('sticker |') || n.startsWith('charm |')) continue;

    const cleanW = (s.weapon || '').replace(/^★\s*StatTrak™\s*/i, '★ ').replace(/^StatTrak™\s*/i, '').trim();
    const cleanN = (s.skinName || s.name || '').replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();
    const key = `${cleanW}_${cleanN}`;
    if (!seen.has(key)) {
      seen.add(key);
      res.push({
        ...s,
        weapon: cleanW,
        skinName: cleanN,
        name: `${cleanW} | ${cleanN}`,
        wear: undefined,
        statTrak: false,
      });
    }
  }
  return res;
}

const cleanSkins = getCleanWeaponSkins(allSkins);
console.log(`Clean unique weapons count: ${cleanSkins.length}`);

// SVG crate generator with unique 3D CS2 style and theme colors
function generateSvgCrate(title, color1, color2, accent, iconSymbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="grad_body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181926" />
      <stop offset="40%" stop-color="#12131c" />
      <stop offset="100%" stop-color="#08090f" />
    </linearGradient>
    <linearGradient id="grad_accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="50%" stop-color="${color2}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
    <radialGradient id="grad_glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color1}" stop-opacity="0.5" />
      <stop offset="60%" stop-color="${color2}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <circle cx="256" cy="256" r="230" fill="url(#grad_glow)" />

  <g transform="translate(0, 10)">
    <!-- Base crate shadow -->
    <ellipse cx="256" cy="425" rx="190" ry="28" fill="#000000" opacity="0.75" filter="url(#glow)" />

    <!-- 3D Crate Body -->
    <path d="M76 170 L256 90 L436 170 L436 360 L256 440 L76 360 Z" fill="url(#grad_body)" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />

    <!-- Top facet -->
    <path d="M76 170 L256 90 L436 170 L256 250 Z" fill="#202234" opacity="0.9" />
    <!-- Left facet -->
    <path d="M76 170 L256 250 L256 440 L76 360 Z" fill="#13141f" />
    <!-- Right facet -->
    <path d="M256 250 L436 170 L436 360 L256 440 Z" fill="#0b0c14" />

    <!-- Neon Accent Straps -->
    <path d="M126 148 L256 206 L386 148" fill="none" stroke="url(#grad_accent)" stroke-width="8" filter="url(#glow)" stroke-linecap="round" />
    <path d="M126 230 L256 288 L386 230" fill="none" stroke="url(#grad_accent)" stroke-width="6" opacity="0.8" />
    <path d="M126 310 L256 368 L386 310" fill="none" stroke="url(#grad_accent)" stroke-width="6" opacity="0.6" />

    <!-- Vertical Side Pillars -->
    <line x1="256" y1="250" x2="256" y2="440" stroke="url(#grad_accent)" stroke-width="4" opacity="0.9" />
    <line x1="76" y1="170" x2="76" y2="360" stroke="#ffffff" stroke-width="2" opacity="0.2" />
    <line x1="436" y1="170" x2="436" y2="360" stroke="#ffffff" stroke-width="2" opacity="0.2" />

    <!-- Center Emblem Badge -->
    <polygon points="256,155 310,185 310,245 256,275 202,245 202,185" fill="#090a12" stroke="url(#grad_accent)" stroke-width="3.5" filter="url(#glow)" />

    <!-- Icon Graphic in center badge -->
    <text x="256" y="224" font-family="sans-serif" font-size="28" font-weight="900" fill="${accent}" text-anchor="middle" filter="url(#glow)">${iconSymbol}</text>

    <!-- Corner Metallic Brackets -->
    <circle cx="95" cy="180" r="4" fill="${color1}" />
    <circle cx="417" cy="180" r="4" fill="${color1}" />
    <circle cx="256" cy="105" r="4" fill="${accent}" />
    <circle cx="256" cy="425" r="4" fill="${color2}" />
  </g>
</svg>`;
}

const NEW_25_SPECS = [
  {
    id: 'case_space_odyssey',
    name: 'Кейс «Космическая Одиссея»',
    subtitle: 'Космические и звездные скины CS2',
    file: 'case_space_odyssey.svg',
    c1: '#8b5cf6', c2: '#3b82f6', acc: '#06b6d4', icon: '🌌',
    price: 850,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('sun in leo') || n.includes('off world') || n.includes('moon in libra') || n.includes('decimator') || n.includes('astral') || n.includes('star') || n.includes('space');
    }
  },
  {
    id: 'case_dragon_breath',
    name: 'Кейс «Дыхание Дракона»',
    subtitle: 'Огненные драконы: Dragon Lore, Dragonfire, Kumicho',
    file: 'case_dragon_breath.svg',
    c1: '#f97316', c2: '#ef4444', acc: '#fbbf24', icon: '🐉',
    price: 3200,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('dragon') || n.includes('drak') || n.includes('fire');
    }
  },
  {
    id: 'case_cyber_samurai',
    name: 'Кейс «Кибер-Самурай»',
    subtitle: 'Аниме, мечи и самурайская честь',
    file: 'case_cyber_samurai.svg',
    c1: '#ec4899', c2: '#ef4444', acc: '#facc15', icon: '⚔️',
    price: 2800,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('temukau') || n.includes('bloodsport') || n.includes('fuji') || n.includes('oni') || n.includes('samurai') || n.includes('traitor') || n.includes('tsunami');
    }
  },
  {
    id: 'case_glitch_protocol',
    name: 'Кейс «Глитч Протокол»',
    subtitle: 'Кибернетические сбои и неоновый код',
    file: 'case_glitch_protocol.svg',
    c1: '#10b981', c2: '#06b6d4', acc: '#a855f7', icon: '💾',
    price: 1600,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('pop') || n.includes('tech') || n.includes('momentum') || n.includes('player two') || n.includes('glitch') || n.includes('mecha');
    }
  },
  {
    id: 'case_atomic_decay',
    name: 'Кейс «Атомный Распад»',
    subtitle: 'Радиация, токсины и ядерная угроза',
    file: 'case_atomic_decay.svg',
    c1: '#84cc16', c2: '#22c55e', acc: '#facc15', icon: '☢️',
    price: 950,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('nuclear') || n.includes('radiation') || n.includes('fallout') || n.includes('toxic') || n.includes('hazard');
    }
  },
  {
    id: 'case_inferno_heat',
    name: 'Кейс «Адское Пламя»',
    subtitle: 'Раскаленный металл и вспышки Blaze',
    file: 'case_inferno_heat.svg',
    c1: '#dc2626', c2: '#ea580c', acc: '#f59e0b', icon: '🔥',
    price: 1100,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('heat') || n.includes('blaze') || n.includes('flame') || n.includes('magma') || n.includes('burn');
    }
  },
  {
    id: 'case_arctic_blizzard',
    name: 'Кейс «Полярная Вьюга»',
    subtitle: 'Белоснежные скины Whiteout и метели',
    file: 'case_arctic_blizzard.svg',
    c1: '#38bdf8', c2: '#818cf8', acc: '#ffffff', icon: '❄️',
    price: 1400,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('whiteout') || n.includes('blizzard') || n.includes('glacier') || n.includes('snow') || n.includes('frost') || n.includes('polar');
    }
  },
  {
    id: 'case_jungle_predator',
    name: 'Кейс «Хищник Джунглей»',
    subtitle: 'Опасные хищники диких тропиков',
    file: 'case_jungle_predator.svg',
    c1: '#15803d', c2: '#65a30d', acc: '#f59e0b', icon: '🐆',
    price: 4800,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('panthera') || n.includes('jungle') || n.includes('tiger') || n.includes('safari') || n.includes('predator') || n.includes('jaguar');
    }
  },
  {
    id: 'case_covert_ops_x',
    name: 'Кейс «Секретные Операции X»',
    subtitle: 'Элитное тайное оружие высшего эшелона',
    file: 'case_covert_ops_x.svg',
    c1: '#e11d48', c2: '#9333ea', acc: '#fbbf24', icon: '🎖️',
    price: 3600,
    filter: s => s.rarity === 'covert' && (s.weapon === 'AK-47' || s.weapon === 'M4A4' || s.weapon === 'AWP' || s.weapon === 'Desert Eagle')
  },
  {
    id: 'case_neon_tokyo',
    name: 'Кейс «Неоновый Токио»',
    subtitle: 'Неоновые улицы Сибуи: Neon Rider & Neo-Noir',
    file: 'case_neon_tokyo.svg',
    c1: '#d946ef', c2: '#06b6d4', acc: '#f43f5e', icon: '🏮',
    price: 1900,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('neon') || n.includes('noir') || n.includes('rider') || n.includes('tokyo');
    }
  },
  {
    id: 'case_viking_valhalla',
    name: 'Кейс «Долина Вальхаллы»',
    subtitle: 'Мифы викингов: Gungnir & Jörmungandr',
    file: 'case_viking_valhalla.svg',
    c1: '#0284c7', c2: '#14b8a6', acc: '#fbbf24', icon: '🛡️',
    price: 12000,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('gungnir') || n.includes('jormungandr') || n.includes('mjolnir') || n.includes('norse') || n.includes('valhalla');
    }
  },
  {
    id: 'case_gold_arabesque',
    name: 'Кейс «Золотой Арабеск»',
    subtitle: 'Чистое золото высшей пробы',
    file: 'case_gold_arabesque.svg',
    c1: '#f59e0b', c2: '#eab308', acc: '#fef08a', icon: '👑',
    price: 7500,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('gold') || n.includes('arabesque') || n.includes('golden') || n.includes('brass');
    }
  },
  {
    id: 'case_midnight_rider',
    name: 'Кейс «Полуночный Гонщик»',
    subtitle: 'Скины ночных кошмаров и темных вод',
    file: 'case_midnight_rider.svg',
    c1: '#6366f1', c2: '#4338ca', acc: '#a855f7', icon: '🌙',
    price: 2100,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('nightwish') || n.includes('dark water') || n.includes('midnight') || n.includes('night stripe');
    }
  },
  {
    id: 'case_retrowave_80s',
    name: 'Кейс «Ретровейв 80-х»',
    subtitle: 'Синтвейв закаты и яркие градиенты Fade',
    file: 'case_retrowave_80s.svg',
    c1: '#ec4899', c2: '#8b5cf6', acc: '#38bdf8', icon: '🌆',
    price: 1750,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('fade') || n.includes('starlight') || n.includes('synth') || n.includes('retro');
    }
  },
  {
    id: 'case_quantum_core',
    name: 'Кейс «Квантовое Ядро»',
    subtitle: 'Квантовые реакторы и ядовитая энергия',
    file: 'case_quantum_core.svg',
    c1: '#10b981', c2: '#14b8a6', acc: '#a3e635', icon: '⚡',
    price: 3400,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('containment') || n.includes('reactor') || n.includes('food chain') || n.includes('quantum') || n.includes('flux');
    }
  },
  {
    id: 'case_crimson_dynasty',
    name: 'Кейс «Багровая Династия»',
    subtitle: 'Кровавая паутина и легендарный Howl',
    file: 'case_crimson_dynasty.svg',
    c1: '#b91c1c', c2: '#991b1b', acc: '#f87171', icon: '🩸',
    price: 4200,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('howl') || n.includes('crimson') || n.includes('redline') || n.includes('code red') || n.includes('bloodsport');
    }
  },
  {
    id: 'case_emerald_palace',
    name: 'Кейс «Изумрудный Дворец»',
    subtitle: 'Королевские изумрудные сокровища CS2',
    file: 'case_emerald_palace.svg',
    c1: '#059669', c2: '#10b981', acc: '#6ee7b7', icon: '💎',
    price: 8900,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('emerald') || n.includes('hydroponic') || n.includes('green') || n.includes('lotus');
    }
  },
  {
    id: 'case_shadow_assassin',
    name: 'Кейс «Теневой Ассасин»',
    subtitle: 'Скрытные матовые клинки и темные винтовки',
    file: 'case_shadow_assassin.svg',
    c1: '#475569', c2: '#334155', acc: '#ef4444', icon: '🥷',
    price: 1250,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('slate') || n.includes('daimyo') || n.includes('conspiracy') || n.includes('shadow') || n.includes('corticera') || n.includes('dark');
    }
  },
  {
    id: 'case_phoenix_rebirth',
    name: 'Кейс «Возрождение Феникса»',
    subtitle: 'Пылающее пламя: Hot Rod, Wildfire, Fire Serpent',
    file: 'case_phoenix_rebirth.svg',
    c1: '#ea580c', c2: '#c2410c', acc: '#fde047', icon: '🦅',
    price: 5500,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('hot rod') || n.includes('wildfire') || n.includes('fire serpent') || n.includes('phoenix') || n.includes('blaze');
    }
  },
  {
    id: 'case_hyper_velocity',
    name: 'Кейс «Гипер-Скорость»',
    subtitle: 'Турбо-спорткары и реактивное ускорение',
    file: 'case_hyper_velocity.svg',
    c1: '#06b6d4', c2: '#0284c7', acc: '#38bdf8', icon: '🏎️',
    price: 2600,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('turbo') || n.includes('coalition') || n.includes('commemoration') || n.includes('speed') || n.includes('wingshot') || n.includes('autotronic');
    }
  },
  {
    id: 'case_abyssal_depths',
    name: 'Кейс «Бездна Океана»',
    subtitle: 'Посейдон и глубины Марианской впадины',
    file: 'case_abyssal_depths.svg',
    c1: '#1e40af', c2: '#1d4ed8', acc: '#60a5fa', icon: '🌊',
    price: 6400,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('poseidon') || n.includes('ocean') || n.includes('abyss') || n.includes('deep') || n.includes('blue phosphor');
    }
  },
  {
    id: 'case_stealth_sniper_v2',
    name: 'Кейс «Снайперский Дозор»',
    subtitle: 'Снайперская элита: Desert Hydra, Silk Tiger, AWP',
    file: 'case_stealth_sniper_v2.svg',
    c1: '#b45309', c2: '#78350f', acc: '#fde68a', icon: '🎯',
    price: 9800,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return (s.weapon === 'AWP' || s.weapon.includes('SSG 08')) && (n.includes('hydra') || n.includes('tiger') || n.includes('blood in the water') || n.includes('wildfire') || n.includes('hyper beast') || n.includes('asiimov'));
    }
  },
  {
    id: 'case_titan_vault',
    name: 'Кейс «Хранилище Титанов»',
    subtitle: 'Священный Грааль: Blue Gem и Dragon Lore',
    file: 'case_titan_vault.svg',
    c1: '#2563eb', c2: '#1d4ed8', acc: '#facc15', icon: '🏛️',
    price: 18000,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('case hardened') || n.includes('dragon lore') || n.includes('howl') || n.includes('titan') || (s.weapon.startsWith('★') && n.includes('blue'));
    }
  },
  {
    id: 'case_candy_rush',
    name: 'Кейс «Карамельный Раш»',
    subtitle: 'Сладкие карамельные скины Candy Apple & Sugar Rush',
    file: 'case_candy_rush.svg',
    c1: '#f43f5e', c2: '#e11d48', acc: '#fda4af', icon: '🍬',
    price: 1150,
    filter: s => {
      const n = (s.weapon + ' ' + s.skinName).toLowerCase();
      return n.includes('candy') || n.includes('sugar') || n.includes('bubblegum') || n.includes('fever dream');
    }
  },
  {
    id: 'case_diamond_jackpot',
    name: 'Кейс «Бриллиантовый Джекпот»',
    subtitle: 'Абсолютный люкс: Сапфиры, Бабочки и Драгон Лоры',
    file: 'case_diamond_jackpot.svg',
    c1: '#0284c7', c2: '#6366f1', acc: '#e0e7ff', icon: '💎',
    price: 25000,
    filter: s => s.priceDc >= 15000 && (s.weapon.startsWith('★') || s.rarity === 'covert' || s.rarity === 'gold')
  }
];

// Generate SVG files and cases
let added = 0;
for (const spec of NEW_25_SPECS) {
  const svgContent = generateSvgCrate(spec.name, spec.c1, spec.c2, spec.acc, spec.icon);
  fs.writeFileSync(path.join(publicCasesDir, spec.file), svgContent, 'utf8');

  // Filter 18 matching skins
  let matched = cleanSkins.filter(spec.filter);
  if (matched.length < 12) {
    // Fallback fill with matching price tier
    const targetP = spec.price;
    const fillers = cleanSkins.filter(s => s.priceDc >= targetP * 0.15 && s.priceDc <= targetP * 4.0);
    matched = [...matched, ...fillers.slice(0, 18 - matched.length)];
  }

  matched.sort((a, b) => a.priceDc - b.priceDc);
  const step = (matched.length - 1) / 17;
  const pickedSkins = [];
  const seenIds = new Set();
  for (let i = 0; i < 18; i++) {
    const idx = Math.min(matched.length - 1, Math.round(i * step));
    const item = matched[idx];
    if (item && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      pickedSkins.push(item);
    }
  }

  const existingIdx = allCases.findIndex(c => c.id === spec.id);
  const caseObj = {
    id: spec.id,
    name: spec.name,
    subtitle: spec.subtitle,
    image: `/cases/${spec.file}`,
    priceDc: spec.price,
    category: 'custom',
    skins: pickedSkins,
  };

  if (existingIdx >= 0) {
    allCases[existingIdx] = caseObj;
  } else {
    allCases.push(caseObj);
  }
  added++;
}

fs.writeFileSync(casesPath, JSON.stringify(allCases, null, 2), 'utf8');
console.log(`Generated ${added} new custom cases with SVG icons! Total cases now: ${allCases.length}`);
