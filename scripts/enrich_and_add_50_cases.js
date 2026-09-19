const fs = require('fs');
const path = require('path');
const { create3DCrateSvg } = require('./generate_3d_crate_svgs');

console.log('=== STARTING REFINED CASE ENRICHMENT & DIVERSIFICATION (+50 CASES) ===');

const skinsPath = path.join(__dirname, '../src/data/all_skins.json');
const casesPath = path.join(__dirname, '../src/data/all_cases.json');
const casesDir = path.join(__dirname, '../public/cases');
if (!fs.existsSync(casesDir)) fs.mkdirSync(casesDir, { recursive: true });

const skins = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
console.log(`Loaded ${skins.length} skins and ${cases.length} cases.`);

// Intelligent Diverse Thematic Skin Selector
function collectDiverseSkins(keywords, maxTotal = 45, maxPerPattern = 2) {
  const kw = keywords.map(k => k.toLowerCase());
  const matched = skins.filter(s => {
    // Skip plain stickers unless sticker is in keyword
    if (s.weapon === 'Sticker' && !kw.some(k => k.includes('sticker') || k.includes('наклейка') || k.includes('капсула'))) {
      return false;
    }
    const text = `${s.weapon} ${s.skinName || ''} ${s.name || ''}`.toLowerCase();
    return kw.some(k => text.includes(k));
  });

  // Group by unique weapon + pattern name
  const patternGroups = new Map();
  for (const s of matched) {
    const patternKey = `${s.weapon}___${s.skinName || s.name}`;
    if (!patternGroups.has(patternKey)) {
      patternGroups.set(patternKey, []);
    }
    patternGroups.get(patternKey).push(s);
  }

  const result = [];
  // Round 1: take 1 item from each distinct weapon pattern
  for (const list of patternGroups.values()) {
    result.push(list[0]);
    if (result.length >= maxTotal) break;
  }

  // Round 2: take 2nd variant (different wear or StatTrak) if needed
  if (result.length < maxTotal) {
    for (const list of patternGroups.values()) {
      if (list.length > 1) {
        result.push(list[1]);
        if (result.length >= maxTotal) break;
      }
    }
  }

  // Round 3: take 3rd variant if still below 20
  if (result.length < 25) {
    for (const list of patternGroups.values()) {
      for (let i = 2; i < list.length; i++) {
        result.push(list[i]);
        if (result.length >= maxTotal) break;
      }
      if (result.length >= maxTotal) break;
    }
  }

  return result;
}

// 1. REVAMP & DIVERSIFY EXISTING THEMATIC CUSTOM CASES
console.log('--- 1. ENRICHING ALL EXISTING CUSTOM CASES WITH FULL DIVERSITY ---');

const existingCaseRevamps = {
  case_fade_gradient: {
    name: 'Fade & Градиент',
    sub: 'Все градиентные клинки и скины Fade: AWP, Glock, MAC-10, MP7, R8, ножи, перчатки',
    theme: 'purple',
    banner: 'FADE',
    keywords: ['fade']
  },
  case_doppler_fever: {
    name: 'Doppler Лихорадка',
    sub: 'Волны Допплер: Сапфир, Рубин, Черный жемчуг и Фазы 1-4 на всех клинках',
    theme: 'purple',
    banner: 'DOPPLER',
    keywords: ['doppler']
  },
  case_asiimov_mania: {
    name: 'Кейс Азимов',
    sub: 'Культовая футуристическая коллекция Asiimov и кибернетический арсенал',
    theme: 'asiimov',
    banner: 'ASIIMOV',
    keywords: ['asiimov', 'mecha industries', 'vulcan', 'cyrex', 'fuel injector']
  },
  case_vulcan_fire: {
    name: 'Вулкан и Огонь',
    sub: 'Огненный арсенал: AK-47 Vulcan, Deagle Blaze, Wildfire, Hellfire, Heat',
    theme: 'orange',
    banner: 'VULCAN',
    keywords: ['vulcan', 'blaze', 'wildfire', 'hellfire', 'heat', 'flame', 'firestarter']
  },
  case_dragon_lore_hunt: {
    name: 'Охота на Dragon Lore',
    sub: 'Легендарный AWP Dragon Lore, Kumicho Dragon, Emerald Dragon, Dragonfire',
    theme: 'gold',
    banner: 'DRAGON',
    keywords: ['dragon lore', 'kumicho dragon', 'emerald dragon', 'dragonfire', 'dragon tech', 'awp |']
  },
  case_hyper_beast: {
    name: 'Hyper Beast Зверинец',
    sub: 'Кислотные монстры Скоростной Зверь для AWP, M4A1-S, Nova, Five-SeveN',
    theme: 'purple',
    banner: 'BEAST',
    keywords: ['hyper beast', 'monster mashup', 'tooth fairy', 'prismatic']
  },
  case_printstream_lab: {
    name: 'Printstream Лаборатория',
    sub: 'Перламутровый дизайн Printstream для Deagle, M4A1-S, USP-S и monochrome скины',
    theme: 'asiimov',
    banner: 'PRINTSTREAM',
    keywords: ['printstream', 'whiteout', 'tuxedo', 'mecha industries']
  },
  case_redline: {
    name: 'Красная Линия',
    sub: 'Карбоновые Redline, Bloodsport, Crimson Web, Hot Rod, Code Red',
    theme: 'red',
    banner: 'REDLINE',
    keywords: ['redline', 'bloodsport', 'crimson web', 'hot rod', 'code red', 'candy apple']
  },
  case_case_hardened: {
    name: 'Поверхностная Закалка',
    sub: 'Закаленная синяя сталь Blue Gem: AK-47, Five-SeveN, MAC-10 и клинки',
    theme: 'blue',
    banner: 'BLUE GEM',
    keywords: ['case hardened']
  },
  case_neon_cyber: {
    name: 'Неоновый Киберпанк',
    sub: 'Неоновые шедевры Neon Rider, Neon Revolution, Decimator, Disco Tech',
    theme: 'pink',
    banner: 'NEON',
    keywords: ['neon rider', 'neon revolution', 'decimator', 'disco tech', 'neo-noir']
  },
  case_zalupa: {
    name: 'Мусорка Залупы',
    sub: 'Копеечные ширпотребы и 0.1% шанс на тайную легенду',
    theme: 'green',
    banner: 'ZALUPA',
    keywords: ['safari mesh', 'sand dune', 'predator', 'colony', 'army sheen', 'dragon lore', 'howl']
  },
  case_only_knives: {
    name: 'Только Ножи',
    sub: '100% гарантия получения ножа любого класса и износа',
    theme: 'dark',
    banner: 'KNIVES',
    keywords: ['knife', 'bayonet', 'karambit', 'daggers']
  },
  case_gloves_vip: {
    name: 'Перчатки VIP',
    sub: '100% выбивание редких перчаток Sport, Moto, Specialist, Driver',
    theme: 'purple',
    banner: 'GLOVES',
    keywords: ['gloves', 'wraps']
  },
  case_awp_elite: {
    name: 'AWP & Снайперки',
    sub: 'Dragon Lore, Gungnir, Medusa, Fade, Asiimov, Lightning Strike',
    theme: 'gold',
    banner: 'AWP',
    keywords: ['awp |', 'ssg 08 |']
  },
  case_ak47_universe: {
    name: 'AK-47 Вселенная',
    sub: 'Fire Serpent, Gold Arabesque, Wild Lotus, Vulcan, Fuel Injector, Bloodsport',
    theme: 'gold',
    banner: 'AK-47',
    keywords: ['ak-47 |']
  },
  case_m4_elite: {
    name: 'M4A4 & M4A1-S Элит',
    sub: 'Howl, Printstream, Hot Rod, Icarus Fell, Poseidon, The Emperor',
    theme: 'blue',
    banner: 'M4',
    keywords: ['m4a4 |', 'm4a1-s |']
  },
  case_deagle_oneshot: {
    name: 'Desert Eagle Ваншот',
    sub: 'Blaze, Printstream, Code Red, Emerald Jörmungandr, Golden Koi',
    theme: 'orange',
    banner: 'DEAGLE',
    keywords: ['desert eagle |']
  },
  case_butterfly_dreams: {
    name: 'Бабочка Мечты',
    sub: 'Полная коллекция ножей-бабочек Butterfly Knives',
    theme: 'dark',
    banner: 'BUTTERFLY',
    keywords: ['butterfly knife']
  },
  case_karambit_exclusive: {
    name: 'Керамбит Эксклюзив',
    sub: 'Все серповидные клинки Karambit',
    theme: 'dark',
    banner: 'KARAMBIT',
    keywords: ['karambit']
  },
  case_m9_bayonet: {
    name: 'Штык-нож M9 Элита',
    sub: 'Тактические штык-ножи M9 Bayonet',
    theme: 'dark',
    banner: 'M9 BAYONET',
    keywords: ['m9 bayonet']
  },
  case_talon_tiger: {
    name: 'Нож Коготь Тигр',
    sub: 'Изогнутые клинки Talon Knife с кольцом на рукояти',
    theme: 'dark',
    banner: 'TALON',
    keywords: ['talon knife']
  },
  case_skeleton_deadly: {
    name: 'Скелетный Нож Призрак',
    sub: 'Один из самых желанных ножей CS2 Skeleton Knife',
    theme: 'dark',
    banner: 'SKELETON',
    keywords: ['skeleton knife']
  },
  case_stiletto_mafia: {
    name: 'Стилет Итальянский',
    sub: 'Быстродействующий автоматический клинок Stiletto Knife',
    theme: 'dark',
    banner: 'STILETTO',
    keywords: ['stiletto knife']
  },
  case_nomad_survival: {
    name: 'Нож Бродяга Номад',
    sub: 'Любимый нож s1mple Nomad Knife во всех расцветках',
    theme: 'dark',
    banner: 'NOMAD',
    keywords: ['nomad knife']
  },
  case_ursus_brutal: {
    name: 'Нож Медведь Урсус',
    sub: 'Простой и надежный японский клинок Ursus Knife',
    theme: 'dark',
    banner: 'URSUS',
    keywords: ['ursus knife']
  },
  case_paracord_ranger: {
    name: 'Паракорд Рейнджер',
    sub: 'Полевой клинок Paracord Knife с оплеткой рукояти',
    theme: 'dark',
    banner: 'PARACORD',
    keywords: ['paracord knife']
  },
  case_survival_tactics: {
    name: 'Нож Выживания Охотник',
    sub: 'Тактический клинок Survival Knife со стропорезом',
    theme: 'dark',
    banner: 'SURVIVAL',
    keywords: ['survival knife']
  },
  case_kukri_storm: {
    name: 'Кукри Шторм',
    sub: 'Новейший непальский клинок Kukri Knife из Kilowatt',
    theme: 'gold',
    banner: 'KUKRI',
    keywords: ['kukri knife']
  },
  case_flip_knife: {
    name: 'Складной Нож Элегант',
    sub: 'Элегантные складные ножи Flip Knife',
    theme: 'dark',
    banner: 'FLIP',
    keywords: ['flip knife']
  },
  case_huntsman_tactical: {
    name: 'Охотничий Нож Тактик',
    sub: 'Агрессивные зубчатые охотничьи ножи Huntsman',
    theme: 'dark',
    banner: 'HUNTSMAN',
    keywords: ['huntsman knife']
  },
  case_bowie_titan: {
    name: 'Нож Боуи Титан',
    sub: 'Массивный тесак Bowie Knife с тяжелым лезвием',
    theme: 'dark',
    banner: 'BOWIE',
    keywords: ['bowie knife']
  },
  case_shadow_daggers: {
    name: 'Тычковые Ножи',
    sub: 'Двойные клинки Shadow Daggers всех расцветок',
    theme: 'dark',
    banner: 'DAGGERS',
    keywords: ['shadow daggers']
  },
  case_gut_knife_club: {
    name: 'Нож с крюком',
    sub: 'Бюджетные клинки Gut Knife для любителей классики',
    theme: 'dark',
    banner: 'GUT',
    keywords: ['gut knife']
  },
  case_damascus_steel: {
    name: 'Дамасская Сталь',
    sub: 'Кованая многослойная дамасская сталь на клинках',
    theme: 'dark',
    banner: 'STEEL',
    keywords: ['damascus steel']
  },
  case_emerald_dream: {
    name: 'Изумрудный Рай',
    sub: 'Gamma Doppler Изумруд и перчатки Emerald Web',
    theme: 'green',
    banner: 'EMERALD',
    keywords: ['emerald', 'gamma doppler']
  },
  case_marble_fade_god: {
    name: 'Мраморный Градиент',
    sub: 'Трехцветные ножи Marble Fade Огонь и Лед',
    theme: 'purple',
    banner: 'MARBLE',
    keywords: ['marble fade']
  },
  case_gamma_frenzy: {
    name: 'Гамма Волны',
    sub: 'Коллекция клинков Gamma Doppler Фазы 1-4',
    theme: 'green',
    banner: 'GAMMA',
    keywords: ['gamma doppler']
  }
};

for (const [cid, revamp] of Object.entries(existingCaseRevamps)) {
  const existing = cases.find(c => c.id === cid);
  if (existing) {
    if (revamp.name) existing.name = revamp.name;
    if (revamp.sub) existing.subtitle = revamp.sub;
    const newSkins = collectDiverseSkins(revamp.keywords, 45, 2);
    if (newSkins.length >= 8) {
      existing.skins = newSkins;
    }
    existing._theme = revamp.theme;
    existing._banner = revamp.banner;
  }
}

// 2. 50 NEW THEMATIC CUSTOM CASES
console.log('--- 2. GENERATING 50 NEW DIVERSE THEMED CUSTOM CASES ---');

const new50CasesList = [
  {
    id: 'case_anime_waifu',
    name: 'Аниме & Вайфу',
    subtitle: 'M4A4 Temukau, Player Two, Neo-Noir, Kumicho Dragon, Bullet Queen',
    priceDc: 4200,
    category: 'custom',
    badge: 'ANIME',
    theme: 'pink',
    banner: 'ANIME',
    keywords: ['temukau', 'player two', 'neo-noir', 'kumicho dragon', 'bullet queen', 'mount fuji', 'fairy tale', 'kiss♥love']
  },
  {
    id: 'case_neo_noir_syndicate',
    name: 'Нео-Нуар Синдикат',
    subtitle: 'Коллекция стильного комикс-нуара для AWP, M4A4, USP-S, Glock-18',
    priceDc: 6800,
    category: 'custom',
    badge: 'NEO-NOIR',
    theme: 'purple',
    banner: 'NEO-NOIR',
    keywords: ['neo-noir']
  },
  {
    id: 'case_gold_luxury',
    name: 'Золотой Люкс',
    subtitle: 'Премиум скины из чистого золота: Arabesque, Golden Koi, Gold Brick, The Prince',
    priceDc: 55000,
    category: 'highroller',
    badge: 'GOLD',
    theme: 'gold',
    banner: 'GOLD',
    keywords: ['gold arabesque', 'golden koi', 'gold brick', 'the prince', 'copper galaxy', 'royal paladin', 'brass']
  },
  {
    id: 'case_mythic_lore',
    name: 'Мифический Лор',
    subtitle: 'Шанс на Dragon Lore, Gungnir, Medusa, Desert Hydra, Eye of Horus, Fire Serpent',
    priceDc: 150000,
    category: 'highroller',
    badge: 'MYTHIC',
    theme: 'gold',
    banner: 'MYTHIC',
    keywords: ['dragon lore', 'gungnir', 'medusa', 'desert hydra', 'eye of horus', 'fire serpent']
  },
  {
    id: 'case_monster_beast',
    name: 'Звери & Монстры',
    subtitle: 'M4A4 Howl, Wild Lotus, Kraken, Dragonfire, Monster Mashup, Tooth Fairy, Jaguar',
    priceDc: 7200,
    category: 'custom',
    badge: 'MONSTER',
    theme: 'red',
    banner: 'MONSTER',
    keywords: ['howl', 'wild lotus', 'kraken', 'dragonfire', 'monster mashup', 'tooth fairy', 'jaguar', 'panthera onca']
  },
  {
    id: 'case_cyberpunk_2077',
    name: 'Киберпанк 2077',
    subtitle: 'AK-47 Head Shot, Disco Tech, In Living Color, Mount Fuji, Visions, Chromatic',
    priceDc: 5400,
    category: 'custom',
    badge: 'CYBER',
    theme: 'pink',
    banner: 'CYBER',
    keywords: ['head shot', 'disco tech', 'in living color', 'mount fuji', 'visions', 'chromatic aberration']
  },
  {
    id: 'case_all_red_inventory',
    name: 'Красный Инвентарь',
    subtitle: 'Сборка чисто красного сета: Howl, Bloodsport, Redline, Hot Rod, Crimson Web',
    priceDc: 16500,
    category: 'weapons',
    badge: 'RED SET',
    theme: 'red',
    banner: 'ALL RED',
    keywords: ['howl', 'bloodsport', 'redline', 'hot rod', 'candy apple', 'autotronic', 'crimson web', 'slaughter', 'code red']
  },
  {
    id: 'case_all_blue_inventory',
    name: 'Синий Инвентарь',
    subtitle: 'Сборка небесно-синего сета: Gungnir, Blue Gem, Blue Phosphor, Frontside Misty, Poseidon',
    priceDc: 15500,
    category: 'weapons',
    badge: 'BLUE SET',
    theme: 'blue',
    banner: 'ALL BLUE',
    keywords: ['gungnir', 'case hardened', 'sun in leo', 'cobalt disruption', 'blue phosphor', 'frontside misty', 'poseidon', 'icarus fell']
  },
  {
    id: 'case_all_green_inventory',
    name: 'Зеленый Инвентарь',
    subtitle: 'Сборка зеленого сета: Emerald, Fire Serpent, Containment Breach, Jörmungandr',
    priceDc: 12000,
    category: 'weapons',
    badge: 'GREEN',
    theme: 'green',
    banner: 'GREEN',
    keywords: ['emerald', 'fire serpent', 'green marine', 'containment breach', 'jörmungandr', 'nuclear threat', 'bamboo garden']
  },
  {
    id: 'case_all_purple_inventory',
    name: 'Фиолетовый Инвентарь',
    subtitle: 'Сборка фиолетового сета: Ultraviolet, Lightning Strike, Nightwish, Black Lotus',
    priceDc: 13500,
    category: 'weapons',
    badge: 'PURPLE',
    theme: 'purple',
    banner: 'PURPLE',
    keywords: ['ultraviolet', 'lightning strike', 'purple ddpat', 'featherweight', 'nightwish', 'black lotus', 'baroque purple']
  },
  {
    id: 'case_all_white_inventory',
    name: 'Белоснежный Инвентарь',
    subtitle: 'Чисто белые скины: Printstream, Whiteout, Mecha Industries, Tuxedo, Hypnotic',
    priceDc: 14500,
    category: 'weapons',
    badge: 'WHITE',
    theme: 'asiimov',
    banner: 'WHITE',
    keywords: ['printstream', 'whiteout', 'mecha industries', 'tuxedo', 'hypnotic', 'kami', 'arctic camo']
  },
  {
    id: 'case_all_black_inventory',
    name: 'Черный Стелс',
    subtitle: 'Матовые стелс-скины: Slate, Night, Dark Water, Carbon Fiber, Black Tie',
    priceDc: 11000,
    category: 'weapons',
    badge: 'STEALTH',
    theme: 'dark',
    banner: 'STEALTH',
    keywords: ['slate', 'night', 'dark water', 'carbon fiber', 'black tie', 'elite build']
  },
  {
    id: 'case_king_pistols',
    name: 'Король Пистолетов',
    subtitle: 'Glock Fade, Deagle Blaze, USP Kill Confirmed, Orion, P250 Whiteout',
    priceDc: 9200,
    category: 'weapons',
    badge: 'PISTOL',
    theme: 'gold',
    banner: 'PISTOLS',
    keywords: ['glock-18 | fade', 'desert eagle | blaze', 'usp-s | kill confirmed', 'usp-s | orion', 'whiteout', 'five-seven | hyper beast', 'desert eagle | printstream']
  },
  {
    id: 'case_awp_king',
    name: 'AWP Властелин',
    subtitle: 'Dragon Lore, Gungnir, Medusa, Desert Hydra, The Prince, Lightning Strike, Fade, Oni Taiji',
    priceDc: 38000,
    category: 'weapons',
    badge: 'AWP GOD',
    theme: 'gold',
    banner: 'AWP KING',
    keywords: ['awp | dragon lore', 'awp | gungnir', 'awp | medusa', 'awp | desert hydra', 'awp | the prince', 'awp | lightning strike', 'awp | fade', 'awp | oni taiji', 'awp | wildfire', 'awp | graphite', 'awp | hyper beast', 'awp | asiimov']
  },
  {
    id: 'case_ak47_emperor',
    name: 'AK-47 Император',
    subtitle: 'Wild Lotus, Gold Arabesque, Fire Serpent, Vulcan, Hydroponic, Fuel Injector, Bloodsport',
    priceDc: 34000,
    category: 'weapons',
    badge: 'AK-47',
    theme: 'gold',
    banner: 'AK EMPEROR',
    keywords: ['ak-47 | wild lotus', 'ak-47 | gold arabesque', 'ak-47 | fire serpent', 'ak-47 | vulcan', 'ak-47 | hydroponic', 'ak-47 | fuel injector', 'ak-47 | bloodsport', 'ak-47 | case hardened', 'ak-47 | redline', 'ak-47 | slate', 'ak-47 | neon revolution', 'ak-47 | nightwish']
  },
  {
    id: 'case_m4_clash',
    name: 'Битва M4A4 и M4A1-S',
    subtitle: 'Howl, Poseidon, Imminent Danger, Welcome to the Jungle, Blue Phosphor, Printstream, Hot Rod',
    priceDc: 29000,
    category: 'weapons',
    badge: 'M4 CLASH',
    theme: 'blue',
    banner: 'M4 CLASH',
    keywords: ['m4a4 | howl', 'm4a4 | poseidon', 'm4a1-s | imminent danger', 'm4a1-s | welcome to the jungle', 'm4a1-s | blue phosphor', 'm4a1-s | printstream', 'm4a1-s | hot rod', 'm4a1-s | icarus fell', 'm4a1-s | golden coil', 'm4a4 | the emperor', 'm4a4 | neo-noir', 'm4a4 | desolate space']
  },
  {
    id: 'case_smg_god',
    name: 'Бог Скорострелок',
    subtitle: 'MP9 Wild Lily, MP9 Hot Rod, MAC-10 Hot Snakes, Gold Brick, P90 Run and Hide, MP7 Fade',
    priceDc: 3200,
    category: 'weapons',
    badge: 'SMG',
    theme: 'orange',
    banner: 'SMG GOD',
    keywords: ['mp9 | wild lily', 'mp9 | hot rod', 'mac-10 | hot snakes', 'mac-10 | gold brick', 'p90 | run and hide', 'mp7 | fade', 'p90 | death by kitty', 'mac-10 | neon rider', 'mp9 | starlight protector']
  },
  {
    id: 'case_shotgun_heavy',
    name: 'Дробовики & Пулеметы',
    subtitle: 'MAG-7 Cinquedea, XM1014 Frostborre, Nova Baroque Orange, Negev Mjölnir, M249 Downtown',
    priceDc: 1650,
    category: 'weapons',
    badge: 'HEAVY',
    theme: 'military',
    banner: 'HEAVY',
    keywords: ['mag-7 | cinquedea', 'xm1014 | frostborre', 'nova | baroque orange', 'negev | mjölnir', 'm249 | downtown', 'xm1014 | tranquilidade', 'mag-7 | justice']
  },
  {
    id: 'case_kilowatt_electric',
    name: 'Kilowatt Электрошок',
    subtitle: 'Zeus x27 Olympus, AK-47 Inheritance, AWP Chrome Cannon, M4A1-S Black Lotus, Kukri',
    priceDc: 6500,
    category: 'custom',
    badge: 'KILOWATT',
    theme: 'gold',
    banner: 'KILOWATT',
    keywords: ['zeus x27 | olympus', 'ak-47 | inheritance', 'awp | chrome cannon', 'm4a1-s | black lotus', 'kukri knife', 'usp-s | jawbreaker']
  },
  {
    id: 'case_dreams_nightmares',
    name: 'Грезы и Кошмары',
    subtitle: 'AK-47 Nightwish, MP9 Starlight Protector, Melondrama, Rapid Eye Movement, Ticket to Hell',
    priceDc: 4800,
    category: 'custom',
    badge: 'DREAMS',
    theme: 'purple',
    banner: 'DREAMS',
    keywords: ['ak-47 | nightwish', 'mp9 | starlight protector', 'dual berettas | melondrama', 'famas | rapid eye movement', 'usp-s | ticket to hell']
  },
  {
    id: 'case_recoil_master',
    name: 'Мастер Отдачи',
    subtitle: 'USP-S Printstream, AK-47 Ice Coaled, AWP Chromatic Aberration, Sawed-Off Kiss♥Love',
    priceDc: 5200,
    category: 'custom',
    badge: 'RECOIL',
    theme: 'blue',
    banner: 'RECOIL',
    keywords: ['usp-s | printstream', 'ak-47 | ice coaled', 'awp | chromatic aberration', 'sawed-off | kiss♥love', 'sg 553 | dragon tech']
  },
  {
    id: 'case_revolution_vibe',
    name: 'Вайб Революции',
    subtitle: 'M4A4 Temukau, AK-47 Head Shot, AWP Duality, P90 Neoqueen, MAC-10 Sakkaku',
    priceDc: 5900,
    category: 'custom',
    badge: 'REVOLUTION',
    theme: 'pink',
    banner: 'REVOLUTION',
    keywords: ['m4a4 | temukau', 'ak-47 | head shot', 'awp | duality', 'p90 | neoqueen', 'mac-10 | sakkaku', 'ump-45 | wild child']
  },
  {
    id: 'case_fracture_anarchy',
    name: 'Разлом Анархия',
    subtitle: 'Desert Eagle Printstream, AK-47 Legion of Anubis, Glock-18 Vogue, M4A4 Tooth Fairy',
    priceDc: 4500,
    category: 'custom',
    badge: 'FRACTURE',
    theme: 'orange',
    banner: 'FRACTURE',
    keywords: ['desert eagle | printstream', 'ak-47 | legion of anubis', 'glock-18 | vogue', 'm4a4 | tooth fairy', 'mag-7 | monster call']
  },
  {
    id: 'case_prisma_color',
    name: 'Призма Всплеск Цвета',
    subtitle: 'M4A4 The Emperor, Five-SeveN Angry Mob, AWP Atheris, Desert Eagle Light Rail',
    priceDc: 4300,
    category: 'custom',
    badge: 'PRISMA',
    theme: 'blue',
    banner: 'PRISMA',
    keywords: ['m4a4 | the emperor', 'five-seven | angry mob', 'awp | atheris', 'desert eagle | light rail', 'ak-47 | phantom disruptor', 'mac-10 | disco tech']
  },
  {
    id: 'case_danger_zone',
    name: 'Запретная Зона',
    subtitle: 'AK-47 Asiimov, AWP Neo-Noir, Desert Eagle Mecha Industries, MP5-SD Gauss',
    priceDc: 4600,
    category: 'custom',
    badge: 'DANGER',
    theme: 'orange',
    banner: 'DANGER',
    keywords: ['ak-47 | asiimov', 'awp | neo-noir', 'desert eagle | mecha industries', 'mp5-sd | gauss', 'glock-18 | oxide blaze']
  },
  {
    id: 'case_clutch_moment',
    name: 'Клатч Раунд',
    subtitle: 'M4A4 Neo-Noir, MP7 Bloodsport, USP-S Cortex, AWP Mortis, Nova Wild Six',
    priceDc: 3900,
    category: 'custom',
    badge: 'CLUTCH',
    theme: 'red',
    banner: 'CLUTCH',
    keywords: ['m4a4 | neo-noir', 'mp7 | bloodsport', 'usp-s | cortex', 'awp | mortis', 'nova | wild six']
  },
  {
    id: 'case_horizon_sunrise',
    name: 'Горизонт Рассвет',
    subtitle: 'AK-47 Neon Rider, Desert Eagle Code Red, M4A1-S Nightmare, FAMAS Eye of Athena',
    priceDc: 4100,
    category: 'custom',
    badge: 'HORIZON',
    theme: 'pink',
    banner: 'HORIZON',
    keywords: ['ak-47 | neon rider', 'desert eagle | code red', 'm4a1-s | nightmare', 'famas | eye of athena', 'glock-18 | warhawk']
  },
  {
    id: 'case_spectrum_rainbow',
    name: 'Спектр Радуга',
    subtitle: 'AK-47 Bloodsport, USP-S Neo-Noir, M4A1-S Decimator, AWP Fever Dream',
    priceDc: 4700,
    category: 'custom',
    badge: 'SPECTRUM',
    theme: 'purple',
    banner: 'SPECTRUM',
    keywords: ['ak-47 | bloodsport', 'usp-s | neo-noir', 'm4a1-s | decimator', 'awp | fever dream', 'cz75-auto | xiangliu']
  },
  {
    id: 'case_glove_collector',
    name: 'Коллекция Перчаток',
    subtitle: '100% перчатки: Sport Gloves Vice, Pandora Box, Amphibious, Hedge Maze, Superconductor',
    priceDc: 89000,
    category: 'knives',
    badge: 'GLOVES',
    theme: 'purple',
    banner: 'GLOVES',
    keywords: ['sport gloves', 'gloves']
  },
  {
    id: 'case_specialist_ops',
    name: 'Перчатки Specialist',
    subtitle: 'Specialist Gloves: Crimson Kimono, Fade, Emerald Web, Foundation, Mogul, Tiger Strike',
    priceDc: 78000,
    category: 'knives',
    badge: 'SPECIALIST',
    theme: 'red',
    banner: 'SPECIALIST',
    keywords: ['specialist gloves']
  },
  {
    id: 'case_moto_racer',
    name: 'Перчатки Moto Гонщик',
    subtitle: 'Moto Gloves: Spearmint, POW!, Polygon, Smoke Out, Blood Pressure, Finish Line, Cool Mint',
    priceDc: 68000,
    category: 'knives',
    badge: 'MOTO',
    theme: 'green',
    banner: 'MOTO',
    keywords: ['moto gloves']
  },
  {
    id: 'case_driver_class',
    name: 'Перчатки Водителя Driver',
    subtitle: 'Driver Gloves: King Snake, Imperial Fluor, Snow Leopard, Crimson Weave, Lunar Weave',
    priceDc: 62000,
    category: 'knives',
    badge: 'DRIVER',
    theme: 'dark',
    banner: 'DRIVER',
    keywords: ['driver gloves']
  },
  {
    id: 'case_hand_wraps_rebel',
    name: 'Обмотки Рук Hand Wraps',
    subtitle: 'Hand Wraps: Cobalt Skulls, Overprint, CAUTION!, Slaughter, Leather, Giraffe',
    priceDc: 54000,
    category: 'knives',
    badge: 'WRAPS',
    theme: 'orange',
    banner: 'WRAPS',
    keywords: ['hand wraps']
  },
  {
    id: 'case_bloodsport_arena',
    name: 'Арена Bloodsport',
    subtitle: 'Спортивный агрессивный дизайн Bloodsport для AK-47, MP7, SCAR-20 и красные клинки',
    priceDc: 8200,
    category: 'custom',
    badge: 'BLOODSPORT',
    theme: 'red',
    banner: 'BLOODSPORT',
    keywords: ['bloodsport', 'crimson web', 'slaughter', 'redline']
  },
  {
    id: 'case_mecha_future',
    name: 'Меха Будущее',
    subtitle: 'Высокотехнологичный сплав Mecha Industries, Vulcan, Asiimov, Cyber Security',
    priceDc: 7500,
    category: 'custom',
    badge: 'MECHA',
    theme: 'asiimov',
    banner: 'MECHA',
    keywords: ['mecha industries', 'vulcan', 'cyber security', 'cyrex', 'fuel injector']
  },
  {
    id: 'case_oni_samurai',
    name: 'Они Самурай',
    subtitle: 'Японская мифология: AWP Oni Taiji, Kumicho Dragon, Galil Kami, Bloodsport, Mount Fuji',
    priceDc: 11500,
    category: 'custom',
    badge: 'SAMURAI',
    theme: 'red',
    banner: 'SAMURAI',
    keywords: ['oni taiji', 'kumicho dragon', 'kami', 'mount fuji', 'bloodsport', 'sunset storm']
  },
  {
    id: 'case_water_frost',
    name: 'Вода & Лед',
    subtitle: 'Морозная свежесть Frontside Misty, Ice Coaled, Shallow Grave, Water Elemental, Frostborre',
    priceDc: 5600,
    category: 'custom',
    badge: 'FROST',
    theme: 'blue',
    banner: 'FROST',
    keywords: ['frontside misty', 'ice coaled', 'water elemental', 'frostborre', 'shallow grave', 'blue phosphor']
  },
  {
    id: 'case_toxic_hazard',
    name: 'Токсичная Радиация',
    subtitle: 'Ядерные заражения: Nuclear Threat, Nuclear Garden, Bone Machine, Bioleak, Eco',
    priceDc: 6900,
    category: 'custom',
    badge: 'TOXIC',
    theme: 'green',
    banner: 'TOXIC',
    keywords: ['nuclear threat', 'nuclear garden', 'bone machine', 'bioleak', 'eco', 'containment breach']
  },
  {
    id: 'case_retro_synth',
    name: 'Ретро Синтвейв',
    subtitle: 'Неоновые волны 80-х: MAC-10 Neon Rider, Signal, Pulse, High Beam, Decimator',
    priceDc: 3700,
    category: 'custom',
    badge: 'SYNTH',
    theme: 'pink',
    banner: 'SYNTH',
    keywords: ['neon rider', 'signal', 'pulse', 'high beam', 'decimator', 'disco tech']
  },
  {
    id: 'case_ancient_egypt',
    name: 'Древний Египет',
    subtitle: 'Золото фараонов: M4A4 Eye of Horus, AK-47 Legion of Anubis, Desert Blossom, Sundown',
    priceDc: 14500,
    category: 'custom',
    badge: 'EGYPT',
    theme: 'gold',
    banner: 'EGYPT',
    keywords: ['eye of horus', 'legion of anubis', 'desert blossom', 'sundown', 'mud-spec', 'copper galaxy']
  },
  {
    id: 'case_norse_viking',
    name: 'Скандинавские Боги',
    subtitle: 'Северные реликвии: AWP Gungnir, Negev Mjölnir, Emerald Jörmungandr, Flame Jörmungandr',
    priceDc: 85000,
    category: 'highroller',
    badge: 'NORSE',
    theme: 'blue',
    banner: 'NORSE',
    keywords: ['gungnir', 'mjölnir', 'jörmungandr', 'astral jörmungandr']
  },
  {
    id: 'case_st_marc_tropical',
    name: 'Сен-Марк Тропики',
    subtitle: 'Райские тропические скины: AK-47 Wild Lotus, MP9 Wild Lily, Synth Leaf, Sea Calico',
    priceDc: 92000,
    category: 'highroller',
    badge: 'ST. MARC',
    theme: 'green',
    banner: 'ST. MARC',
    keywords: ['wild lotus', 'wild lily', 'synth leaf', 'sea calico', 'bamboo garden', 'teal blossom']
  },
  {
    id: 'case_canals_venice',
    name: 'Каналы Венеции',
    subtitle: 'Итальянская роскошь: AWP The Prince, MAG-7 Cinquedea, Baroque Purple, Red Filigree',
    priceDc: 68000,
    category: 'highroller',
    badge: 'CANALS',
    theme: 'gold',
    banner: 'CANALS',
    keywords: ['the prince', 'cinquedea', 'baroque purple', 'red filigree', 'stained glass', 'canals']
  },
  {
    id: 'case_rising_sun_japan',
    name: 'Восходящее Солнце',
    subtitle: 'Редчайшие японские скины: AUG Akihabara Accept, Hydroponic, Sunset Storm, Neon Kimono',
    priceDc: 74000,
    category: 'highroller',
    badge: 'JAPAN',
    theme: 'red',
    banner: 'JAPAN',
    keywords: ['akihabara accept', 'hydroponic', 'sunset storm', 'neon kimono', 'bamboo print', 'midnight lily']
  },
  {
    id: 'case_gods_monsters',
    name: 'Боги и Чудовища',
    subtitle: 'Античный пантеон: M4A4 Poseidon, AWP Medusa, M4A1-S Icarus Fell, Emerald Dragon, Chronos',
    priceDc: 82000,
    category: 'highroller',
    badge: 'GODS',
    theme: 'blue',
    banner: 'GODS',
    keywords: ['poseidon', 'medusa', 'icarus fell', 'emerald dragon', 'chronos', 'minotaur', 'pandora']
  },
  {
    id: 'case_chop_shop',
    name: 'Автомастерская Chop Shop',
    subtitle: 'Стритрейсинг: M4A1-S Hot Rod, Glock-18 Twilight Galaxy, SG 553 Bulldozer, Urban Rubble',
    priceDc: 18500,
    category: 'weapons',
    badge: 'CHOP SHOP',
    theme: 'red',
    banner: 'CHOP SHOP',
    keywords: ['hot rod', 'twilight galaxy', 'bulldozer', 'urban rubble', 'whiteout']
  },
  {
    id: 'case_alpha_military',
    name: 'Спецназ Альфа',
    subtitle: 'Тактическая коллекция Alpha: MP9 Bulldozer, Glock-18 Fade, FAMAS Spitfire, SCAR Emerald',
    priceDc: 12500,
    category: 'weapons',
    badge: 'ALPHA',
    theme: 'military',
    banner: 'ALPHA',
    keywords: ['bulldozer', 'fade', 'spitfire', 'emerald', 'damascus steel', 'anodized navy']
  },
  {
    id: 'case_assault_ops',
    name: 'Штурм Ассалт',
    subtitle: 'Классическая операция Assault: Glock Fade, MP9 Bulldozer, AUG Hot Rod, Anodized Navy',
    priceDc: 13500,
    category: 'weapons',
    badge: 'ASSAULT',
    theme: 'dark',
    banner: 'ASSAULT',
    keywords: ['fade', 'bulldozer', 'hot rod', 'anodized navy', 'silver']
  },
  {
    id: 'case_milspec_mania',
    name: 'Армейское Золото',
    subtitle: 'Лучшие Mil-Spec скины с бешеным ROI: Blue Phosphor, Dark Water, Hypnotic, Copper Galaxy',
    priceDc: 1200,
    category: 'budget',
    badge: 'MIL-SPEC',
    theme: 'gold',
    banner: 'MIL-SPEC',
    keywords: ['blue phosphor', 'dark water', 'hypnotic', 'copper galaxy', 'tuxedo', 'emerald jörmungandr', 'emerald']
  },
  {
    id: 'case_secret_service_007',
    name: 'Секретная Служба 007',
    subtitle: 'Арсенал спецагента: USP-S Orion, глушители M4A1-S, Silent Deagles, агенты спецслужб',
    priceDc: 8900,
    category: 'custom',
    badge: 'AGENT 007',
    theme: 'dark',
    banner: 'AGENT 007',
    keywords: ['orion', 'm4a1-s', 'desert eagle', 'agent', 'operator', 'slate', 'dark water']
  }
];

for (const def of new50CasesList) {
  let existing = cases.find(c => c.id === def.id);
  const matchedSkins = collectDiverseSkins(def.keywords, 40, 2);
  const safeSkins = (matchedSkins.length >= 8) ? matchedSkins : skins.slice(0, 30);

  if (existing) {
    existing.name = def.name;
    existing.subtitle = def.subtitle;
    existing.priceDc = def.priceDc;
    existing.category = def.category;
    existing.badge = def.badge;
    existing.skins = safeSkins;
    existing._theme = def.theme;
    existing._banner = def.banner;
  } else {
    cases.push({
      id: def.id,
      name: def.name,
      subtitle: def.subtitle,
      image: `/cases/${def.id}.svg`,
      priceDc: def.priceDc,
      category: def.category,
      badge: def.badge,
      skins: safeSkins,
      _theme: def.theme,
      _banner: def.banner
    });
  }
}

// 3. GENERATE 3D SVG CRATES MATCHING PHOTO 2
console.log('--- 3. GENERATING AUTHENTIC CS2 3D CRATE SVGS MATCHING PHOTO 2 ---');

function getThematicEmblem(cid) {
  if (cid.includes('knife') || cid.includes('blade') || cid.includes('karambit') || cid.includes('butterfly') || cid.includes('m9') || cid.includes('talon') || cid.includes('skeleton') || cid.includes('stiletto') || cid.includes('nomad') || cid.includes('ursus') || cid.includes('paracord') || cid.includes('survival') || cid.includes('kukri') || cid.includes('flip') || cid.includes('huntsman') || cid.includes('bowie') || cid.includes('shadow') || cid.includes('gut')) {
    return `<path d="M-10,10 L10,-10 M-10,-10 L10,10" stroke="#facc15" stroke-width="3" stroke-linecap="round" />
            <circle cx="0" cy="0" r="4.5" fill="#ef4444" />`;
  }
  if (cid.includes('gloves') || cid.includes('wraps')) {
    return `<rect x="-10" y="-10" width="20" height="20" rx="4" fill="#a855f7" stroke="#ffffff" stroke-width="1.5" />
            <circle cx="-3" cy="-3" r="2.5" fill="#facc15" /><circle cx="3" cy="-3" r="2.5" fill="#facc15" />`;
  }
  if (cid.includes('dragon')) {
    return `<polygon points="0,-15 10,-2 6,10 0,6 -6,10 -10,-2" fill="#ea580c" stroke="#fde047" stroke-width="1.5" />
            <circle cx="0" cy="-2" r="3" fill="#facc15" />`;
  }
  if (cid.includes('fade')) {
    return `<circle cx="0" cy="0" r="12" fill="#c026d3" stroke="#facc15" stroke-width="2" />
            <circle cx="0" cy="0" r="6" fill="#f43f5e" />`;
  }
  if (cid.includes('doppler')) {
    return `<circle cx="0" cy="0" r="12" fill="#3b82f6" stroke="#ec4899" stroke-width="2" />
            <polygon points="0,-7 6,4 -6,4" fill="#a855f7" />`;
  }
  if (cid.includes('asiimov') || cid.includes('printstream') || cid.includes('mecha')) {
    return `<polygon points="0,-12 11,-6 11,6 0,12 -11,6 -11,-6" fill="#f97316" stroke="#ffffff" stroke-width="1.5" />
            <circle cx="0" cy="0" r="4" fill="#09090b" />`;
  }
  if (cid.includes('anime') || cid.includes('waifu') || cid.includes('synth') || cid.includes('cyber')) {
    return `<path d="M 0,-10 C 6,-16 14,-8 14,0 C 14,8 0,16 0,16 C 0,16 -14,8 -14,0 C -14,-8 -6,-16 0,-10 Z" fill="#ec4899" stroke="#ffffff" stroke-width="1.5" />`;
  }
  if (cid.includes('gold') || cid.includes('sheikh') || cid.includes('oligarch') || cid.includes('millionaire')) {
    return `<polygon points="0,-14 4,-4 14,-4 6,3 9,13 0,7 -9,13 -6,3 -14,-4 -4,-4" fill="#facc15" stroke="#713f12" stroke-width="1.5" />`;
  }
  if (cid.includes('zalupa') || cid.includes('toxic') || cid.includes('hazard')) {
    return `<circle cx="0" cy="0" r="12" fill="#eab308" stroke="#000000" stroke-width="2" />
            <path d="M-6,-6 L6,6 M-6,6 L6,-6" stroke="#000000" stroke-width="3" stroke-linecap="round" />`;
  }
  if (cid.includes('red') || cid.includes('blood') || cid.includes('crimson') || cid.includes('howl')) {
    return `<polygon points="0,-14 12,0 0,14 -12,0" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" />
            <circle cx="0" cy="0" r="4" fill="#facc15" />`;
  }
  if (cid.includes('awp') || cid.includes('sniper')) {
    return `<circle cx="0" cy="0" r="12" fill="none" stroke="#22c55e" stroke-width="2" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="#22c55e" stroke-width="1.5" />
            <line x1="0" y1="-14" x2="0" y2="14" stroke="#22c55e" stroke-width="1.5" />`;
  }

  return `<polygon points="0,-13 4,-4 13,-4 6,3 9,12 0,6 -9,12 -6,3 -13,-4 -4,-4" fill="#facc15" stroke="#854d0e" stroke-width="1" />`;
}

for (const c of cases) {
  if (c.category !== 'official' && c.category !== 'stickers') {
    const cid = c.id;
    let theme = c._theme || 'gold';
    let banner = c._banner || c.badge || (c.name.split(' ')[0] || 'CS2');

    if (!c._theme) {
      if (cid.includes('knife') || cid.includes('blade') || cid.includes('stiletto') || cid.includes('karambit') || cid.includes('m9') || cid.includes('butterfly')) {
        theme = 'dark';
      } else if (cid.includes('gloves') || cid.includes('fade') || cid.includes('doppler')) {
        theme = 'purple';
      } else if (cid.includes('zalupa') || cid.includes('toxic') || cid.includes('safari') || cid.includes('green')) {
        theme = 'green';
      } else if (cid.includes('red') || cid.includes('blood') || cid.includes('crimson') || cid.includes('autotronic')) {
        theme = 'red';
      } else if (cid.includes('blue') || cid.includes('frost') || cid.includes('water')) {
        theme = 'blue';
      } else if (cid.includes('asiimov') || cid.includes('printstream') || cid.includes('white')) {
        theme = 'asiimov';
      } else if (cid.includes('anime') || cid.includes('cyber') || cid.includes('synth')) {
        theme = 'pink';
      } else if (cid.includes('gold') || cid.includes('sheikh') || cid.includes('oligarch') || cid.includes('millionaire') || cid.includes('souvenir')) {
        theme = 'gold';
      } else {
        theme = 'military';
      }
    }

    const emblemSvg = getThematicEmblem(cid);
    const svgContent = create3DCrateSvg({
      theme,
      emblemSvg,
      bannerText: banner,
      hazardStripes: true,
      digitalLed: cid.includes('stattrak')
    });

    const svgPath = path.join(casesDir, `${cid}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    c.image = `/cases/${cid}.svg`;

    delete c._theme;
    delete c._banner;
  }
}

console.log(`FINAL TOTAL CASES: ${cases.length}`);
fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
console.log('Saved all_cases.json with full diversity & generated CS2 SVGs!');
