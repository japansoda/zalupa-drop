import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allSkinsPath = path.resolve(__dirname, '../src/data/all_skins.json');
const allCasesPath = path.resolve(__dirname, '../src/data/all_cases.json');
const livePricesPath = path.resolve(__dirname, '../src/data/live_market_prices.json');
const collectorPricesPath = path.resolve(__dirname, '../src/data/collector_prices.json');

const skins = JSON.parse(fs.readFileSync(allSkinsPath, 'utf8'));
const cases = JSON.parse(fs.readFileSync(allCasesPath, 'utf8'));
const livePrices = JSON.parse(fs.readFileSync(livePricesPath, 'utf8'));
const collectorPrices = JSON.parse(fs.readFileSync(collectorPricesPath, 'utf8'));

const COMBINED_PRICES = { ...livePrices, ...collectorPrices };

const WEAR_MAP = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred'
};

const WEAR_RATES = {
  FN: 1.6,
  MW: 1.25,
  FT: 1.0,
  WW: 0.82,
  BS: 0.68
};

const STATTRAK_RATE = 1.95;

function isWearable(skin) {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();
  if (w.includes('charm') || w.includes('брелок') || n.includes('charm |')) return false;
  if (w.includes('agent') || w.includes('оперативник') || n.includes('agent |')) return false;
  if (w.includes('sticker') || w.includes('наклейка') || n.includes('sticker |')) return false;
  if (w.includes('patch') || n.includes('patch |') || w.includes('music kit') || w.includes('pin')) return false;
  return true;
}

function isStatTrakable(skin) {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();
  if (!isWearable(skin)) return false;
  if (w.includes('gloves') || w.includes('wraps') || w.includes('перчатки') || w.includes('обмотки')) return false;
  return true;
}

function getHash(skin) {
  const wearable = isWearable(skin);
  const isCharm = !wearable && ((skin.weapon || '').toLowerCase().includes('charm') || (skin.name || '').toLowerCase().includes('charm'));
  const isAgent = !wearable && ((skin.weapon || '').toLowerCase().includes('agent') || (skin.weapon || '').toLowerCase().includes('оперативник'));
  const isSticker = !wearable && ((skin.weapon || '').toLowerCase().includes('sticker') || (skin.name || '').toLowerCase().includes('sticker'));

  let cleanName = skin.name || (skin.weapon && skin.skinName ? `${skin.weapon} | ${skin.skinName}` : skin.skinName || skin.weapon || '');
  cleanName = cleanName.replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '★ ').trim();
  cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();

  if (isSticker) {
    if (!cleanName.startsWith('Sticker |') && !cleanName.startsWith('Наклейка |')) {
      cleanName = `Sticker | ${cleanName}`;
    }
    return cleanName;
  }

  if (isCharm) {
    if (!cleanName.startsWith('Charm |') && !cleanName.startsWith('Брелок |')) {
      cleanName = `Charm | ${cleanName}`;
    }
    return cleanName;
  }

  if (isAgent) {
    return cleanName;
  }

  const rawW = (skin.weapon || '').toLowerCase();
  const rawN = (cleanName || '').toLowerCase();
  const isKnifeOrGlove =
    cleanName.startsWith('★') ||
    rawW.includes('knife') ||
    rawW.includes('bayonet') ||
    rawW.includes('karambit') ||
    rawW.includes('daggers') ||
    rawW.includes('gloves') ||
    rawW.includes('wraps') ||
    rawN.includes('knife') ||
    rawN.includes('bayonet') ||
    rawN.includes('karambit') ||
    rawN.includes('daggers') ||
    rawN.includes('gloves') ||
    rawN.includes('wraps');

  if (isKnifeOrGlove && !cleanName.startsWith('★')) {
    cleanName = `★ ${cleanName}`;
  }

  const wear = skin.wear ? WEAR_MAP[skin.wear.toUpperCase()] : null;
  const isSt = Boolean(skin.statTrak && isStatTrakable(skin));

  let marketName = cleanName;
  if (isKnifeOrGlove) {
    if (isSt) marketName = cleanName.replace(/^★\s*/, '★ StatTrak™ ');
  } else if (isSt) {
    marketName = `StatTrak™ ${cleanName}`;
  }

  if (wear && wearable) {
    marketName = `${marketName} (${wear})`;
  }

  return marketName;
}

function calculatePrice(skin) {
  const hash = getHash(skin);
  const direct = COMBINED_PRICES[hash];
  if (direct && direct > 0) {
    return { priceDc: direct, priceUsd: Number((direct * 0.01).toFixed(2)) };
  }

  const wearable = isWearable(skin);
  if (!wearable) {
    const fallbackDirect = COMBINED_PRICES[skin.name] || COMBINED_PRICES[skin.skinName] || 0;
    if (fallbackDirect > 0) {
      return { priceDc: fallbackDirect, priceUsd: Number((fallbackDirect * 0.01).toFixed(2)) };
    }
    const p = skin.priceDc || 100;
    return { priceDc: p, priceUsd: Number((p * 0.01).toFixed(2)) };
  }

  // Wearable item: try base FT
  const cleanW = (skin.weapon || '').replace(/^★\s*StatTrak™\s*/i, '★ ').replace(/^StatTrak™\s*/i, '').trim();
  const cleanN = (skin.skinName || skin.name || '')
    .replace(/^★\s*StatTrak™\s*/i, '★ ')
    .replace(/^StatTrak™\s*/i, '')
    .replace(/\s*\([^)]*\)$/, '')
    .trim();

  const ftHash = getHash({ weapon: cleanW, skinName: cleanN, wear: 'FT', statTrak: false });
  let baseFt = COMBINED_PRICES[ftHash] || 0;

  if (baseFt <= 0) {
    // try MW / FN in combined
    const fnHash = getHash({ weapon: cleanW, skinName: cleanN, wear: 'FN', statTrak: false });
    if (COMBINED_PRICES[fnHash]) {
      baseFt = Math.round(COMBINED_PRICES[fnHash] / WEAR_RATES.FN);
    } else {
      const mwHash = getHash({ weapon: cleanW, skinName: cleanN, wear: 'MW', statTrak: false });
      if (COMBINED_PRICES[mwHash]) {
        baseFt = Math.round(COMBINED_PRICES[mwHash] / WEAR_RATES.MW);
      }
    }
  }

  if (baseFt <= 0) {
    baseFt = skin.priceDc || 100;
    if (skin.wear && WEAR_RATES[skin.wear]) {
      baseFt = Math.round(baseFt / WEAR_RATES[skin.wear]);
    }
  }

  const wearKey = skin.wear ? skin.wear.toUpperCase() : 'FT';
  const wearRate = WEAR_RATES[wearKey] || 1.0;
  const isSt = Boolean(skin.statTrak && isStatTrakable(skin));
  const stRate = isSt ? STATTRAK_RATE : 1.0;

  const priceDc = Math.max(1, Math.round(baseFt * wearRate * stRate));
  const priceUsd = Number((priceDc * 0.01).toFixed(2));

  return { priceDc, priceUsd };
}

console.log('--- REPRICING SKINS DATABASE ---');
let updatedSkinsCount = 0;
for (const s of skins) {
  const newPrice = calculatePrice(s);
  if (newPrice.priceDc !== s.priceDc) {
    updatedSkinsCount++;
  }
  s.priceDc = newPrice.priceDc;
  s.priceUsd = newPrice.priceUsd;
}
console.log(`Updated ${updatedSkinsCount} skins in all_skins.json`);
fs.writeFileSync(allSkinsPath, JSON.stringify(skins, null, 2));

console.log('--- REPRICING CASES DATABASE ---');
let updatedCaseSkinsCount = 0;
for (const c of cases) {
  for (const s of (c.skins || [])) {
    const newPrice = calculatePrice(s);
    if (newPrice.priceDc !== s.priceDc) {
      updatedCaseSkinsCount++;
    }
    s.priceDc = newPrice.priceDc;
    s.priceUsd = newPrice.priceUsd;
  }
}
console.log(`Updated ${updatedCaseSkinsCount} skins across cases in all_cases.json`);
fs.writeFileSync(allCasesPath, JSON.stringify(cases, null, 2));

console.log('--- VERIFICATION SAMPLES ---');
const sampleNames = [
  'Sticker | Titan (Holo) | Katowice 2014',
  'Sticker | iBUYPOWER (Holo) | Katowice 2014',
  'AWP | Dragon Lore',
  'AK-47 | Gold Arabesque',
  'AK-47 | Wild Lotus',
  'AWP | Gungnir',
  'M4A4 | Howl',
  "★ Sport Gloves | Pandora's Box",
  "★ Moto Gloves | Spearmint",
  "★ Sport Gloves | Vice"
];

for (const name of sampleNames) {
  const match = skins.find(s => s.name?.includes(name) || s.skinName?.includes(name));
  if (match) {
    console.log(`${match.name} [${match.wear || 'N/A'}]: ${match.priceDc} DC ($${match.priceUsd})`);
  }
}
