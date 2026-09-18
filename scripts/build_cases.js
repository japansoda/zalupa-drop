const fs = require('fs');
const path = require('path');

async function run() {
  const skins = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/all_skins.json'), 'utf8'));
  console.log('Loaded skins:', skins.length);

  console.log('Fetching crates from ByMykel...');
  let crates = [];
  try {
    const res = await fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json');
    crates = await res.json();
    console.log('Fetched crates:', crates.length);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }

  const crateImages = crates.filter(c => c.image && c.image.includes('economy/image')).map(c => c.image);
  const default3DImage = 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj7-lz1QAn4kZjf9CsVuvf7OfQ5IabBVzbHlb915bcwHCjikEp_sTnTn4z6eH6RblQlC8RwFPlK7EdXSP0Ibg';

  const allKnives = skins.filter(s => s.weapon.includes('Knife') || s.weapon.includes('Bayonet') || s.weapon.includes('Karambit') || s.weapon.includes('Daggers'));
  const allGloves = skins.filter(s => s.rarity === 'extraordinary');
  const allAWPs = skins.filter(s => s.weapon === 'AWP');
  const allAKs = skins.filter(s => s.weapon === 'AK-47');
  const allM4s = skins.filter(s => s.weapon === 'M4A4' || s.weapon === 'M4A1-S');
  const allDeagles = skins.filter(s => s.weapon === 'Desert Eagle');
  const allCoverts = skins.filter(s => s.rarity === 'covert' && !s.weapon.includes('Knife'));
  const allClassifieds = skins.filter(s => s.rarity === 'classified');
  const allRestricted = skins.filter(s => s.rarity === 'restricted');
  const allMilSpec = skins.filter(s => s.rarity === 'milspec');
  const allConsumer = skins.filter(s => s.rarity === 'consumer' || s.rarity === 'industrial');

  const allCases = [];

  // 1. Official cases
  const officialList = crates.filter(c => c.type === 'Case' && c.image);
  console.log('Official cases from API:', officialList.length);

  for (const c of officialList) {
    let caseSkins = [];
    if (c.contains && c.contains.length > 0) {
      for (const item of c.contains) {
        const matches = skins.filter(s => s.id === item.id || s.name.toLowerCase().includes(item.name.toLowerCase()));
        if (matches.length > 0) {
          caseSkins.push(matches[Math.floor(Math.random() * matches.length)]);
        }
      }
    }
    if (c.contains_rare && c.contains_rare.length > 0) {
      for (let i = 0; i < Math.min(3, c.contains_rare.length); i++) {
        const rare = c.contains_rare[i];
        const matches = skins.filter(s => s.id === rare.id || s.name.toLowerCase().includes(rare.name.toLowerCase()));
        if (matches.length > 0) caseSkins.push(matches[0]);
      }
    }
    if (caseSkins.length < 12) {
      caseSkins = [
        ...allKnives.slice(0, 2),
        ...allCoverts.slice(0, 2),
        ...allClassifieds.slice(0, 3),
        ...allRestricted.slice(0, 5),
        ...allMilSpec.slice(0, 6),
      ];
    }

    let priceDc = 1850;
    const name = c.name;
    if (name.includes('Bravo') || name.includes('CS:GO Weapon Case')) priceDc = 10800;
    else if (name.includes('Hydra') || name.includes('Winter')) priceDc = 7500;
    else if (name.includes('Kilowatt') || name.includes('Revolution')) priceDc = 2200;
    else if (name.includes('Dreams') || name.includes('Recoil') || name.includes('Fracture')) priceDc = 1450;
    else if (name.includes('Snakebite') || name.includes('Clutch')) priceDc = 1250;
    else priceDc = Math.floor(Math.random() * 1200 + 1200);

    allCases.push({
      id: c.id,
      name: c.name,
      subtitle: 'Официальный кейс CS2 с оригинальной рулеткой',
      image: c.image,
      priceDc,
      category: 'official',
      badge: name.includes('Bravo') ? 'РАРИТЕТ' : (name.includes('Kilowatt') ? 'NEW' : undefined),
      skins: caseSkins.slice(0, 25),
    });
  }

  console.log('Processed official cases:', allCases.length);

  // 2. Souvenir packages
  const souvenirPackages = [
    { name: 'Cobblestone Souvenir Package', sub: 'Шанс на легендарный AWP Dragon Lore', price: 95000, badge: 'DRAGON LORE' },
    { name: 'Dust II Souvenir Package', sub: 'Шанс на AK-47 Золотая арабеска', price: 28000, badge: 'ARABESQUE' },
    { name: 'Mirage Souvenir Package', sub: 'Шанс на AWP Desert Hydra', price: 24000, badge: 'HYDRA' },
    { name: 'Ancient Souvenir Package', sub: 'Шанс на M4A1-S Добро пожаловать в джунгли', price: 22000, badge: 'JUNGLE' },
    { name: 'Anubis Souvenir Package', sub: 'Шанс на M4A4 Глаз Гора', price: 18500, badge: 'ANUBIS' },
    { name: 'Vertigo Souvenir Package', sub: 'Шанс на M4A1-S Imminent Danger', price: 19500, badge: 'VERTIGO' },
    { name: 'Inferno Souvenir Package', sub: 'Шанс на SG 553 Integrale', price: 8500, badge: 'INFERNO' },
    { name: 'Nuke Souvenir Package', sub: 'Шанс на M4A4 Радиационная опасность', price: 9200, badge: 'NUKE' },
  ];

  for (let i = 0; i < souvenirPackages.length; i++) {
    const s = souvenirPackages[i];
    const match = crates.find(c => c.name && c.name.toLowerCase().includes(s.name.toLowerCase())) ||
                  crates.find(c => c.type === 'Souvenir');
    allCases.push({
      id: `souvenir_${i+1}`,
      name: s.name,
      subtitle: s.sub,
      image: match ? match.image : crateImages[i % crateImages.length],
      priceDc: s.priceDc,
      category: 'highroller',
      badge: s.badge,
      skins: skins.slice(i * 20, i * 20 + 20),
    });
  }

  // 3. Custom cases (65+ cases)
  const customList = [
    { id: 'case_zalupa', name: 'Мусорка Залупы', sub: 'Копеечные ширпотребы и 0.1% шанс на тайную легенду', price: 490, cat: 'budget', badge: 'ХАЛЯВА', skins: [...allConsumer.slice(0, 12), ...allMilSpec.slice(0, 4), ...allKnives.slice(0, 1)] },
    { id: 'case_10_knife', name: '10% Нож', sub: 'Повышенный шанс 10% на выпадение ножа', price: 12500, cat: 'knives', badge: '10% НОЖ', skins: [...allKnives.slice(0, 8), ...allMilSpec.slice(0, 12)] },
    { id: 'case_50_knife', name: '50% Нож', sub: 'Орёл или решка: 50% нож, 50% ширпотреб', price: 39000, cat: 'knives', badge: '50% ШАНС', skins: [...allKnives.slice(8, 16), ...allConsumer.slice(0, 8)] },
    { id: 'case_only_knives', name: 'Только Ножи', sub: '100% гарантия получения ножа любого класса и износа', price: 59000, cat: 'knives', badge: '100% НОЖ', skins: allKnives.slice(0, 24) },
    { id: 'case_all_or_nothing', name: 'Всё или Ничего', sub: 'Либо дешевый ширпотреб, либо Howl / Dragon Lore', price: 24000, cat: 'highroller', badge: 'РИСК', skins: [...allConsumer.slice(0, 14), ...skins.filter(x => x.priceDc > 100000).slice(0, 6)] },
    { id: 'case_dragon_lore_hunt', name: 'Охота на Dragon Lore', sub: 'Кейс для охотников за легендарным AWP Dragon Lore', price: 32000, cat: 'highroller', badge: 'DRAGON', skins: allAWPs.slice(0, 20) },
    { id: 'case_gloves_vip', name: 'Перчатки VIP', sub: '100% выбивание редких перчаток Sport, Moto, Specialist', price: 38000, cat: 'knives', badge: 'VIP', skins: allGloves.slice(0, 22) },
    { id: 'case_awp_elite', name: 'AWP & Снайперки', sub: 'Dragon Lore, Gungnir, Medusa, Fade, Asiimov', price: 8900, cat: 'weapons', badge: 'СНАЙПЕР', skins: allAWPs.slice(0, 22) },
    { id: 'case_ak47_universe', name: 'AK-47 Вселенная', sub: 'Fire Serpent, Gold Arabesque, Wild Lotus, Vulcan', price: 9500, cat: 'weapons', badge: 'ТОП AK', skins: allAKs.slice(0, 22) },
    { id: 'case_m4_elite', name: 'M4A4 & M4A1-S Элит', sub: 'Howl, Printstream, Hot Rod, Icarus Fell, Poseidon', price: 7800, cat: 'weapons', badge: 'M4 ЭЛИТ', skins: allM4s.slice(0, 22) },
    { id: 'case_printstream_lab', name: 'Printstream Лаборатория', sub: 'Перламутровые скины Printstream для Deagle, M4A1-S, USP-S', price: 6200, cat: 'custom', badge: 'PRINTSTREAM', skins: skins.filter(s => s.skinName.includes('Printstream') || s.rarity === 'covert').slice(0, 20) },
    { id: 'case_asiimov_mania', name: 'Asiimov Мания', sub: 'Культовая футуристическая коллекция Азимов', price: 5500, cat: 'custom', badge: 'ASIIMOV', skins: skins.filter(s => s.skinName.includes('Asiimov') || s.rarity === 'classified').slice(0, 20) },
    { id: 'case_hyper_beast', name: 'Hyper Beast Зверинец', sub: 'Яркие монструозные скины Скоростной Зверь', price: 4200, cat: 'custom', badge: 'BEAST', skins: skins.filter(s => s.skinName.includes('Hyper Beast') || s.rarity === 'classified').slice(0, 20) },
    { id: 'case_fade_gradient', name: 'Fade & Градиент', sub: 'Градиентные клинки Butterfly, Karambit, M9 и пистолеты Fade', price: 42000, cat: 'knives', badge: 'FADE', skins: skins.filter(s => s.skinName.includes('Fade')).slice(0, 22) },
    { id: 'case_doppler_fever', name: 'Doppler Лихорадка', sub: 'Легендарные волны Допплер: Сапфир, Рубин, Фазы 1-4', price: 48000, cat: 'knives', badge: 'DOPPLER', skins: skins.filter(s => s.skinName.includes('Doppler')).slice(0, 22) },
    { id: 'case_case_hardened', name: 'Поверхностная Закалка', sub: 'Синяя сталь Blue Gem: AK-47, Five-SeveN и закаленные ножи', price: 28000, cat: 'custom', badge: 'BLUE GEM', skins: skins.filter(s => s.skinName.includes('Case Hardened')).slice(0, 20) },
    { id: 'case_redline', name: 'Красная Линия', sub: 'Стильный карбон Redline, Bloodsport, Crimson Web', price: 3800, cat: 'custom', badge: 'RED', skins: skins.filter(s => s.skinName.includes('Redline') || s.skinName.includes('Blood') || s.skinName.includes('Crimson')).slice(0, 20) },
    { id: 'case_neon_cyber', name: 'Неоновый Киберпанк', sub: 'Неоновые шедевры Neon Rider, Neon Revolution, Decimator', price: 3400, cat: 'custom', badge: 'NEON', skins: skins.filter(s => s.skinName.includes('Neon') || s.skinName.includes('Decimator')).slice(0, 20) },
    { id: 'case_stattrak_only', name: 'Статтрек Арсенал', sub: '100% скинов со встроенным счетчиком фрагов StatTrak™', price: 14000, cat: 'weapons', badge: 'STATTRAK™', skins: skins.filter(s => s.statTrak).slice(0, 25) },
    { id: 'case_classified_arsenal', name: 'Тайный Арсенал', sub: 'Только Засекреченное и Тайное оружие высшего эшелона', price: 6900, cat: 'weapons', badge: 'ТАЙНОЕ', skins: [...allCoverts.slice(0, 10), ...allClassifieds.slice(0, 12)] },
    { id: 'case_deagle_oneshot', name: 'Desert Eagle Ваншот', sub: 'Blaze, Printstream, Code Red, Emerald Jörmungandr', price: 6500, cat: 'weapons', badge: 'DEAGLE', skins: allDeagles.slice(0, 20) },
    { id: 'case_pistol_round', name: 'Пистолетный Раунд', sub: 'USP-S, Glock-18, Desert Eagle, P250, Five-SeveN', price: 1800, cat: 'weapons', badge: 'PISTOLS', skins: skins.filter(s => ['USP-S', 'Glock-18', 'Desert Eagle', 'P250', 'Five-SeveN'].includes(s.weapon)).slice(0, 22) },
    { id: 'case_butterfly_dreams', name: 'Бабочка Мечты', sub: 'Коллекция ножей-бабочек Butterfly Knives', price: 75000, cat: 'knives', badge: 'БАБОЧКА', skins: skins.filter(s => s.weapon === 'Butterfly Knife').slice(0, 22) },
    { id: 'case_karambit_exclusive', name: 'Керамбит Эксклюзив', sub: 'Ножи с серповидным лезвием Karambit', price: 68000, cat: 'knives', badge: 'КЕРАМБИТ', skins: skins.filter(s => s.weapon === 'Karambit').slice(0, 22) },
    { id: 'case_m9_bayonet', name: 'Штык-нож M9 Элита', sub: 'Тактические штык-ножи M9 Bayonet', price: 62000, cat: 'knives', badge: 'M9 ШТЫК', skins: skins.filter(s => s.weapon === 'M9 Bayonet').slice(0, 22) },
    // Budget series
    { id: 'case_budget_50', name: 'Бюджетный 50 DC', sub: 'Входной ультра-дешевый кейс для легкого старта', price: 50, cat: 'budget', badge: '50 DC', skins: allConsumer.slice(0, 18) },
    { id: 'case_budget_100', name: 'Бюджетный 100 DC', sub: 'Доступный кейс с ширпотребом и шансом на армейку', price: 100, cat: 'budget', badge: '100 DC', skins: [...allConsumer.slice(18, 30), ...allMilSpec.slice(0, 6)] },
    { id: 'case_budget_250', name: 'Бюджетный 250 DC', sub: 'Армейские скины и редкие запрещенные предметы', price: 250, cat: 'budget', badge: '250 DC', skins: [...allMilSpec.slice(6, 20), ...allRestricted.slice(0, 4)] },
    { id: 'case_budget_500', name: 'Бюджетный 500 DC', sub: 'Шанс окупить баланс в разы за полтысячи монет', price: 500, cat: 'budget', badge: '500 DC', skins: [...allMilSpec.slice(20, 32), ...allRestricted.slice(4, 10)] },
    { id: 'case_student_750', name: 'Студент 750 DC', sub: 'Скины на каждый день по приятной цене', price: 750, cat: 'budget', badge: '750 DC', skins: [...allMilSpec.slice(32, 44), ...allRestricted.slice(10, 16)] },
    { id: 'case_stipend_1000', name: 'Стипендия 1000 DC', sub: 'Полноценный кейс со скинами из популярных коллекций', price: 1000, cat: 'budget', badge: '1 000 DC', skins: [...allRestricted.slice(16, 28), ...allClassifieds.slice(0, 6)] },
    { id: 'case_paycheck_2500', name: 'Получка 2500 DC', sub: 'Качественные засекреченные стволы для игры', price: 2500, cat: 'custom', badge: '2 500 DC', skins: [...allRestricted.slice(28, 38), ...allClassifieds.slice(6, 14)] },
    { id: 'case_advance_5000', name: 'Аванс 5000 DC', sub: 'Тайные винтовки и пистолеты с яркими паттернами', price: 5000, cat: 'custom', badge: '5 000 DC', skins: [...allClassifieds.slice(14, 24), ...allCoverts.slice(0, 6)] },
    { id: 'case_salary_10000', name: 'Зарплата 10000 DC', sub: 'Крупная игра с шансом на ножи и топовые скины', price: 10000, cat: 'custom', badge: '10 000 DC', skins: [...allCoverts.slice(6, 16), ...allKnives.slice(0, 4)] },
    { id: 'case_oligarch_25000', name: 'Олигарх 25000 DC', sub: 'Премиальный кейс для ценителей дорогих коллекций', price: 25000, cat: 'highroller', badge: '25 000 DC', skins: [...allCoverts.slice(16, 24), ...allKnives.slice(4, 12)] },
    { id: 'case_millionaire_50000', name: 'Миллионер 50000 DC', sub: 'Элитный кейс: редчайшие ножи, перчатки и сувениры', price: 50000, cat: 'highroller', badge: '50 000 DC', skins: [...allKnives.slice(12, 22), ...allGloves.slice(0, 6)] },
    { id: 'case_sheikh_100000', name: 'Шейх 100000 DC', sub: 'Самый дорогой кейс: только божественные скины', price: 100000, cat: 'highroller', badge: '100 000 DC', skins: skins.filter(s => s.priceDc > 60000).slice(0, 20) },
    // Weapons & themes
    { id: 'case_smg_rush', name: 'SMG Раш Б', sub: 'P90, MP9, MAC-10, MP7 для скоростного раша', price: 1200, cat: 'weapons', badge: 'RUSH B', skins: skins.filter(s => ['P90', 'MP9', 'MAC-10', 'MP7'].includes(s.weapon)).slice(0, 20) },
    { id: 'case_heavy_cannon', name: 'Тяжелая Артиллерия', sub: 'Negev, M249, XM1014, MAG-7, Nova', price: 950, cat: 'weapons', badge: 'HEAVY', skins: skins.filter(s => ['Negev', 'M249', 'XM1014', 'MAG-7', 'Nova'].includes(s.weapon)).slice(0, 20) },
    { id: 'case_legends_csgo', name: 'Легенды Контры', sub: 'Howl, Dragon Lore, Fire Serpent, Medusa', price: 65000, cat: 'highroller', badge: 'ЛЕГЕНДЫ', skins: skins.filter(s => ['Dragon Lore', 'Howl', 'Fire Serpent', 'Medusa'].some(n => s.name.includes(n))).slice(0, 16) },
    { id: 'case_katowice_stickers', name: 'Кейс Наклеек Катовице', sub: 'Titan Holo, iBUYPOWER Holo и раритетные наклейки', price: 45000, cat: 'stickers', badge: 'KATOWICE', skins: skins.filter(s => s.weapon === 'Sticker' || s.rarity === 'contraband').slice(0, 20) },
    { id: 'case_agents_cs2', name: 'Кейс Оперативников', sub: 'Агенты спецназа и террористов с уникальными фразами', price: 1800, cat: 'stickers', badge: 'АГЕНТЫ', skins: skins.filter(s => s.weapon === 'Agent' || s.rarity === 'classified').slice(0, 18) },
    { id: 'case_charms_collection', name: 'Кейс Брелоков Новинки', sub: 'Официальные брелоки CS2 на оружие всех редкостей', price: 850, cat: 'stickers', badge: 'БРЕЛОКИ', skins: skins.filter(s => s.weapon === 'Charm' || s.weapon === 'Sticker').slice(0, 18) },
    // Knife models
    { id: 'case_talon_tiger', name: 'Нож Коготь Тигр', sub: 'Изогнутые клинки Talon Knife с кольцом на рукояти', price: 54000, cat: 'knives', badge: 'TALON', skins: skins.filter(s => s.weapon === 'Talon Knife').slice(0, 20) },
    { id: 'case_skeleton_deadly', name: 'Скелетный Нож Призрак', sub: 'Один из самых желанных ножей CS2 Skeleton Knife', price: 69000, cat: 'knives', badge: 'SKELETON', skins: skins.filter(s => s.weapon === 'Skeleton Knife').slice(0, 20) },
    { id: 'case_stiletto_mafia', name: 'Стилет Итальянский', sub: 'Быстродействующий автоматический клинок Stiletto Knife', price: 41000, cat: 'knives', badge: 'STILETTO', skins: skins.filter(s => s.weapon === 'Stiletto Knife').slice(0, 20) },
    { id: 'case_nomad_survival', name: 'Нож Бродяга Номад', sub: 'Любимый нож s1mple Nomad Knife в различных окрасах', price: 46000, cat: 'knives', badge: 'NOMAD', skins: skins.filter(s => s.weapon === 'Nomad Knife').slice(0, 20) },
    { id: 'case_ursus_brutal', name: 'Нож Медведь Урсус', sub: 'Простой и надежный японский клинок Ursus Knife', price: 33000, cat: 'knives', badge: 'URSUS', skins: skins.filter(s => s.weapon === 'Ursus Knife').slice(0, 20) },
    { id: 'case_paracord_ranger', name: 'Паракорд Рейнджер', sub: 'Полевой клинок Paracord Knife с оплеткой рукояти', price: 29000, cat: 'knives', badge: 'PARACORD', skins: skins.filter(s => s.weapon === 'Paracord Knife').slice(0, 20) },
    { id: 'case_survival_tactics', name: 'Нож Выживания Охотник', sub: 'Тактический клинок Survival Knife со стропорезом', price: 25000, cat: 'knives', badge: 'SURVIVAL', skins: skins.filter(s => s.weapon === 'Survival Knife').slice(0, 20) },
    { id: 'case_kukri_storm', name: 'Кукри Шторм', sub: 'Новейший непальский клинок Kukri Knife из Kilowatt', price: 49000, cat: 'knives', badge: 'KUKRI', skins: skins.filter(s => s.weapon === 'Kukri Knife').slice(0, 20) },
    { id: 'case_flip_knife', name: 'Складной Нож Элегант', sub: 'Элегантные складные ножи Flip Knife', price: 27000, cat: 'knives', badge: 'FLIP', skins: skins.filter(s => s.weapon === 'Flip Knife').slice(0, 20) },
    { id: 'case_huntsman_tactical', name: 'Охотничий Нож Тактик', sub: 'Агрессивные зубчатые охотничьи ножи Huntsman', price: 24500, cat: 'knives', badge: 'HUNTSMAN', skins: skins.filter(s => s.weapon === 'Huntsman Knife').slice(0, 20) },
    { id: 'case_bowie_titan', name: 'Нож Боуи Титан', sub: 'Массивный тесак Bowie Knife с тяжелым лезвием', price: 22500, cat: 'knives', badge: 'BOWIE', skins: skins.filter(s => s.weapon === 'Bowie Knife').slice(0, 20) },
    { id: 'case_shadow_daggers', name: 'Тычковые Ножи', sub: 'Двойные клинки Shadow Daggers всех расцветок', price: 17500, cat: 'knives', badge: 'DAGGERS', skins: skins.filter(s => s.weapon === 'Shadow Daggers').slice(0, 20) },
    { id: 'case_gut_knife_club', name: 'Нож с крюком', sub: 'Бюджетные клинки Gut Knife для любителей классики', price: 19000, cat: 'knives', badge: 'GUT', skins: skins.filter(s => s.weapon === 'Gut Knife').slice(0, 20) },
    { id: 'case_damascus_steel', name: 'Дамасская Сталь', sub: 'Кованая многослойная дамасская сталь на клинках', price: 21000, cat: 'knives', badge: 'STEEL', skins: skins.filter(s => s.skinName.includes('Damascus')).slice(0, 20) },
    { id: 'case_night_stalker', name: 'Ночной Охотник', sub: 'Темные матовые ножи Night и скины Nightwish', price: 18000, cat: 'knives', badge: 'NIGHT', skins: skins.filter(s => s.skinName.includes('Night')).slice(0, 20) },
    { id: 'case_autotronic_race', name: 'Автотроника Турбо', sub: 'Высокотехнологичный сплав и красная сетка', price: 31000, cat: 'knives', badge: 'AUTO', skins: skins.filter(s => s.skinName.includes('Autotronic')).slice(0, 20) },
    { id: 'case_safari_troll', name: 'Африканская Сетка Тролль', sub: 'Куча сеток Safari Mesh и 1 скрытый Dragon Lore', price: 350, cat: 'budget', badge: 'MEME', skins: [...skins.filter(s => s.skinName.includes('Safari Mesh')).slice(0, 16), ...allAWPs.slice(0, 1)] },
    { id: 'case_vulcan_fire', name: 'Вулкан и Пламя', sub: 'AK-47 Vulcan, Deagle Blaze и огненные скины', price: 11500, cat: 'weapons', badge: 'FIRE', skins: skins.filter(s => s.skinName.includes('Vulcan') || s.skinName.includes('Blaze') || s.skinName.includes('Flame')).slice(0, 20) },
    { id: 'case_emerald_dream', name: 'Изумрудный Рай', sub: 'Gamma Doppler Изумруд и перчатки Emerald Web', price: 85000, cat: 'knives', badge: 'EMERALD', skins: skins.filter(s => s.skinName.includes('Emerald') || s.skinName.includes('Gamma')).slice(0, 20) },
    { id: 'case_marble_fade_god', name: 'Мраморный Градиент', sub: 'Трехцветные ножи Marble Fade Огонь и Лед', price: 44000, cat: 'knives', badge: 'MARBLE', skins: skins.filter(s => s.skinName.includes('Marble')).slice(0, 20) },
    { id: 'case_gamma_frenzy', name: 'Гамма Волны', sub: 'Коллекция клинков Gamma Doppler Фазы 1-4', price: 39000, cat: 'knives', badge: 'GAMMA', skins: skins.filter(s => s.skinName.includes('Gamma Doppler')).slice(0, 20) },
  ];

  for (let i = 0; i < customList.length; i++) {
    const c = customList[i];
    const image = crateImages[i % crateImages.length] || default3DImage;
    const safeSkins = (c.skins && c.skins.length >= 8) ? c.skins : skins.slice(i * 15, i * 15 + 20);
    allCases.push({
      id: c.id,
      name: c.name,
      subtitle: c.sub,
      image,
      priceDc: c.price,
      category: c.cat,
      badge: c.badge,
      skins: safeSkins.slice(0, 25),
    });
  }

  console.log('TOTAL CASES GENERATED:', allCases.length);

  const casesPath = path.join(__dirname, '../src/data/all_cases.json');
  fs.writeFileSync(casesPath, JSON.stringify(allCases, null, 2));
  console.log('Saved all_cases.json successfully!');
}

run();
