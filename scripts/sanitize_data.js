const fs = require('fs');
const path = require('path');

const WEAR_MAP = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
};

function isCharm(skin) {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();
  return w === 'charm' || w === 'брелок' || n.startsWith('charm |') || n.startsWith('брелок |') || n.includes('charm');
}

function isAgent(skin) {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();
  return w === 'agent' || w === 'оперативник' || n.startsWith('agent |') || (skin.category === 'agents');
}

function isSticker(skin) {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();
  return w === 'sticker' || w === 'наклейка' || n.startsWith('sticker |') || n.startsWith('наклейка |');
}

function isGlove(skin) {
  const w = (skin.weapon || '').toLowerCase();
  const n = (skin.name || '').toLowerCase();
  return w.includes('gloves') || w.includes('wraps') || w.includes('перчатки') || w.includes('обмотки') || n.includes('gloves') || n.includes('wraps');
}

function getMarketHashName(skin) {
  const charm = isCharm(skin);
  const agent = isAgent(skin);
  const sticker = isSticker(skin);
  const glove = isGlove(skin);

  let cleanName = (skin.name || '').trim();
  cleanName = cleanName.replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '★ ').trim();
  cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();

  if (sticker) {
    if (!cleanName.startsWith('Sticker |')) {
      cleanName = `Sticker | ${cleanName.replace(/^Наклейка \|\s*/i, '')}`;
    }
    return cleanName;
  }

  if (charm) {
    if (!cleanName.startsWith('Charm |')) {
      cleanName = `Charm | ${cleanName.replace(/^Брелок \|\s*/i, '')}`;
    }
    return cleanName;
  }

  if (agent) {
    // Official Steam market has no "Agent |" prefix for agents
    return cleanName.replace(/^Agent \|\s*/i, '').replace(/^Оперативник \|\s*/i, '');
  }

  const wearCode = (skin.wear || '').toUpperCase();
  const fullWear = WEAR_MAP[wearCode];
  const isKnife = cleanName.startsWith('★') && !glove;
  const isST = Boolean(skin.statTrak && !glove && !charm && !agent && !sticker);

  let result = cleanName;
  if (isKnife) {
    if (isST) {
      result = cleanName.replace(/^★\s*/, '★ StatTrak™ ');
    }
  } else if (glove) {
    // Gloves never have StatTrak
    result = cleanName.startsWith('★') ? cleanName : `★ ${cleanName}`;
  } else if (isST) {
    result = `StatTrak™ ${cleanName}`;
  }

  if (fullWear) {
    result = `${result} (${fullWear})`;
  }

  return result;
}

function getSteamListingUrl(skin) {
  const hash = getMarketHashName(skin);
  return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(hash)}`;
}

// 1. Process all_skins.json
console.log('Loading all_skins.json...');
const allSkins = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/all_skins.json'), 'utf8'));
console.log('Initial all_skins length:', allSkins.length);

const cleanedSkins = [];
const seenSkinKeys = new Set();

for (const skin of allSkins) {
  const charm = isCharm(skin);
  const agent = isAgent(skin);
  const sticker = isSticker(skin);
  const glove = isGlove(skin);

  if (charm || agent || sticker) {
    skin.wear = '';
    skin.wearLabel = '';
    skin.statTrak = false;
  }
  if (glove) {
    skin.statTrak = false;
  }

  skin.steamMarketUrl = getSteamListingUrl(skin);

  // Key for deduplication
  let dedupKey;
  if (charm || agent || sticker) {
    dedupKey = `${skin.weapon}::${skin.skinName || skin.name}::${skin.effect || ''}`;
  } else {
    dedupKey = `${skin.weapon}::${skin.skinName || skin.name}::${skin.wear}::${skin.statTrak ? 'ST' : 'NO'}`;
  }

  if (!seenSkinKeys.has(dedupKey)) {
    seenSkinKeys.add(dedupKey);
    cleanedSkins.push(skin);
  }
}

console.log('Sanitized & deduplicated all_skins length:', cleanedSkins.length);
fs.writeFileSync(
  path.join(__dirname, '../src/data/all_skins.json'),
  JSON.stringify(cleanedSkins, null, 2),
  'utf8'
);
console.log('Successfully written all_skins.json');

// 2. Process all_cases.json
console.log('Loading all_cases.json...');
const allCases = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/all_cases.json'), 'utf8'));
console.log('Initial all_cases length:', allCases.length);

for (const c of allCases) {
  const caseSeenKeys = new Set();
  const caseCleanedSkins = [];

  for (const s of (c.skins || [])) {
    const charm = isCharm(s);
    const agent = isAgent(s);
    const sticker = isSticker(s);
    const glove = isGlove(s);

    if (charm || agent || sticker) {
      s.wear = '';
      s.wearLabel = '';
      s.statTrak = false;
    }
    if (glove) {
      s.statTrak = false;
    }

    s.steamMarketUrl = getSteamListingUrl(s);

    let key;
    if (charm || agent || sticker) {
      key = `${s.weapon}::${s.skinName || s.name}::${s.effect || ''}`;
    } else {
      key = `${s.weapon}::${s.skinName || s.name}::${s.wear}::${s.statTrak ? 'ST' : 'NO'}`;
    }

    if (!caseSeenKeys.has(key)) {
      caseSeenKeys.add(key);
      caseCleanedSkins.push(s);
    }
  }

  c.skins = caseCleanedSkins;
}

fs.writeFileSync(
  path.join(__dirname, '../src/data/all_cases.json'),
  JSON.stringify(allCases, null, 2),
  'utf8'
);
console.log('Successfully sanitized and updated all_cases.json');
