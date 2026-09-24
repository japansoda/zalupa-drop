const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, 'normalized_cases.md');
const allSkinsPath = path.join(__dirname, '../src/data/all_skins.json');
const allCasesPath = path.join(__dirname, '../src/data/all_cases.json');

const md = fs.readFileSync(mdPath, 'utf8');
const allSkins = JSON.parse(fs.readFileSync(allSkinsPath, 'utf8'));
const existingCases = JSON.parse(fs.readFileSync(allCasesPath, 'utf8'));

console.log(`Loaded ${allSkins.length} skins from all_skins.json`);
console.log(`Loaded ${existingCases.length} cases from all_cases.json`);

// Create lookup maps
const skinsByWeaponSkinWearSt = new Map();
const skinsByWeaponSkin = new Map();
const skinsByName = new Map();

for (const s of allSkins) {
  const w = (s.weapon || '').trim().toLowerCase();
  const sn = (s.skinName || '').trim().toLowerCase();
  const wear = (s.wear || '').toUpperCase();
  const st = !!s.statTrak;

  const k1 = `${w}|${sn}|${wear}|${st}`;
  if (!skinsByWeaponSkinWearSt.has(k1)) skinsByWeaponSkinWearSt.set(k1, s);

  const k2 = `${w}|${sn}`;
  if (!skinsByWeaponSkin.has(k2)) skinsByWeaponSkin.set(k2, []);
  skinsByWeaponSkin.get(k2).push(s);

  const k3 = (s.name || '').trim().toLowerCase();
  if (!skinsByName.has(k3)) skinsByName.set(k3, s);
}

// Special alias corrections
function normalizeItem(weapon, skinName, extraCol) {
  let w = weapon.trim();
  let sn = skinName.trim();

  // Type A -> First Class
  if (w.toLowerCase() === 'ak-47' && sn.toLowerCase() === 'type a') {
    sn = 'First Class';
  }

  // Dual Berettas Switchboard -> Switch Board
  if (w.toLowerCase().includes('dual') && sn.toLowerCase() === 'switchboard') {
    sn = 'Switch Board';
  }

  // Брелок Backstab -> Backsplash
  if ((w.toLowerCase() === 'брелок' || w.toLowerCase() === 'charm') && sn.toLowerCase() === 'backstab') {
    sn = 'Backsplash';
  }

  // Strip possible extra backticks or whitespace
  w = w.replace(/`/g, '').trim();
  sn = sn.replace(/`/g, '').trim();

  return { w, sn, extra: (extraCol || '').replace(/`/g, '').trim() };
}

// Wear labels map
const WEAR_LABELS = {
  FN: 'Прямо с завода',
  MW: 'Немного поношенное',
  FT: 'После полевых испытаний',
  WW: 'Поношенное',
  BS: 'Закаленное в боях'
};

function matchSkin(rawWeapon, rawSkinName, extraCol, rarity, wear, statTrak, tablePriceDc) {
  const { w, sn, extra } = normalizeItem(rawWeapon, rawSkinName, extraCol);
  const wLower = w.toLowerCase();
  const snLower = sn.toLowerCase();
  const isSt = (statTrak || '').toLowerCase().includes('stattrak');
  const normWear = wear && wear !== '-' ? wear.toUpperCase() : '';

  // 1. For stickers
  if (wLower === 'sticker' || wLower === 'наклейка') {
    const fullQuery = extra ? `sticker | ${sn} | ${extra}`.toLowerCase() : `sticker | ${sn}`.toLowerCase();
    let found = allSkins.find(s => (s.name || '').toLowerCase() === fullQuery);
    if (!found) {
      found = allSkins.find(s => {
        const n = (s.name || '').toLowerCase();
        return n.startsWith('sticker |') && n.includes(snLower) && (!extra || n.includes(extra.toLowerCase()));
      });
    }
    if (found) {
      return {
        ...found,
        priceDc: tablePriceDc || found.priceDc,
        priceUsd: Math.round(((tablePriceDc || found.priceDc) / 100) * 100) / 100
      };
    }
  }

  // 2. For agents
  if (wLower === 'оперативник' || wLower === 'agent') {
    const fullQuery = extra ? `${sn} | ${extra}`.toLowerCase() : snLower;
    let found = allSkins.find(s => (s.name || '').toLowerCase() === fullQuery);
    if (!found) {
      found = allSkins.find(s => {
        const n = (s.name || '').toLowerCase();
        return (s.weapon === 'Оперативник' || s.weapon === 'Agent') && n.includes(snLower) && (!extra || n.includes(extra.toLowerCase()));
      });
    }
    if (found) {
      return {
        ...found,
        priceDc: tablePriceDc || found.priceDc,
        priceUsd: Math.round(((tablePriceDc || found.priceDc) / 100) * 100) / 100
      };
    }
  }

  // 3. For charms
  if (wLower === 'брелок' || wLower === 'charm') {
    let found = allSkins.find(s => {
      const n = (s.name || '').toLowerCase();
      return (s.weapon === 'Брелок' || s.weapon === 'Charm' || n.startsWith('charm |')) && (n.includes(snLower) || (s.skinName || '').toLowerCase() === snLower);
    });
    if (found) {
      return {
        ...found,
        priceDc: tablePriceDc || found.priceDc,
        priceUsd: Math.round(((tablePriceDc || found.priceDc) / 100) * 100) / 100
      };
    }
  }

  // 4. Exact lookup by weapon + skinName + wear + statTrak
  const exactKey = `${wLower}|${snLower}|${normWear}|${isSt}`;
  if (skinsByWeaponSkinWearSt.has(exactKey)) {
    const found = skinsByWeaponSkinWearSt.get(exactKey);
    return {
      ...found,
      priceDc: tablePriceDc || found.priceDc,
      priceUsd: Math.round(((tablePriceDc || found.priceDc) / 100) * 100) / 100
    };
  }

  // 5. Lookup without statTrak
  const noStKey = `${wLower}|${snLower}|${normWear}|false`;
  if (skinsByWeaponSkinWearSt.has(noStKey)) {
    const base = skinsByWeaponSkinWearSt.get(noStKey);
    return {
      ...base,
      id: isSt ? `${base.id}_st` : base.id,
      name: isSt && !base.name.startsWith('StatTrak™') ? `StatTrak™ ${base.name}` : base.name,
      statTrak: isSt,
      priceDc: tablePriceDc || (isSt ? Math.round(base.priceDc * 1.35) : base.priceDc),
      priceUsd: Math.round(((tablePriceDc || (isSt ? base.priceDc * 1.35 : base.priceDc)) / 100) * 100) / 100
    };
  }

  // 6. Lookup in skinsByWeaponSkin for another wear
  const anyWearKey = `${wLower}|${snLower}`;
  if (skinsByWeaponSkin.has(anyWearKey)) {
    const list = skinsByWeaponSkin.get(anyWearKey);
    const base = list[0];
    const wearCode = normWear || 'FN';
    const wearLbl = WEAR_LABELS[wearCode] || 'Прямо с завода';
    return {
      ...base,
      id: `${base.id}_${wearCode.toLowerCase()}${isSt ? '_st' : ''}`,
      name: isSt && !base.name.startsWith('StatTrak™') ? `StatTrak™ ${base.name}` : base.name,
      wear: wearCode,
      wearLabel: wearLbl,
      statTrak: isSt,
      priceDc: tablePriceDc || base.priceDc,
      priceUsd: Math.round(((tablePriceDc || base.priceDc) / 100) * 100) / 100
    };
  }

  // 7. General search in allSkins
  const found = allSkins.find(s => {
    const sw = (s.weapon || '').toLowerCase();
    const snName = (s.skinName || '').toLowerCase();
    const matchW = sw === wLower || (wLower.includes('knife') && sw.includes('knife')) || (wLower.includes('gloves') && sw.includes('gloves'));
    const matchSn = snName === snLower || (s.name || '').toLowerCase().includes(snLower);
    return matchW && matchSn;
  });

  if (found) {
    const wearCode = normWear || 'FN';
    return {
      ...found,
      id: `${found.id}_custom_${wearCode.toLowerCase()}${isSt ? '_st' : ''}`,
      name: isSt && !found.name.startsWith('StatTrak™') ? `StatTrak™ ${found.name}` : found.name,
      wear: wearCode,
      wearLabel: WEAR_LABELS[wearCode] || found.wearLabel,
      statTrak: isSt,
      priceDc: tablePriceDc || found.priceDc,
      priceUsd: Math.round(((tablePriceDc || found.priceDc) / 100) * 100) / 100
    };
  }

  console.warn(`WARNING: Failed to match skin: [${w}] [${sn}] [${wear}] [${statTrak}]`);
  return null;
}

// Parse markdown cases
const lines = md.split('\n');
const parsedCases = [];

let currentCase = null;
let currentTable = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (line.startsWith('### ')) {
    if (currentCase) {
      currentCase.rawTable = currentTable;
      parsedCases.push(currentCase);
    }
    const titleMatch = line.slice(4).trim();
    let nameRu = titleMatch;
    let nameEn = titleMatch;
    const parenMatch = titleMatch.match(/^(.*?)\s*\((.*?)\)$/);
    if (parenMatch) {
      nameRu = parenMatch[1].trim();
      nameEn = parenMatch[2].trim();
    }
    currentCase = {
      name: nameRu,
      nameEn: nameEn,
      id: '',
      category: '',
      priceDc: 0,
      description: '',
      rawTable: []
    };
    currentTable = [];
    continue;
  }

  if (!currentCase) continue;

  if (line.includes('**ID кейса:**')) {
    const m = line.match(/`([^`]+)`/);
    if (m) currentCase.id = m[1].trim();
    continue;
  }
  if (line.includes('**Категория:**')) {
    const m = line.match(/`([^`]+)`/);
    if (m) currentCase.category = m[1].trim();
    continue;
  }
  if (line.includes('**Цена открытия:**')) {
    const cleanNum = line.replace(/[^\d]/g, '');
    if (cleanNum) currentCase.priceDc = parseInt(cleanNum, 10);
    continue;
  }
  if (line.includes('**Описание:**')) {
    const desc = line.replace(/^-\s*\*\*Описание:\*\*\s*/, '').trim();
    currentCase.description = desc;
    continue;
  }

  if (line.startsWith('|') && !line.includes('---|---') && !line.includes('Название скина')) {
    const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
    if (cells.length >= 6) {
      currentTable.push(cells);
    }
  }
}

if (currentCase) {
  currentCase.rawTable = currentTable;
  parsedCases.push(currentCase);
}

console.log(`Parsed ${parsedCases.length} cases from markdown.`);

// Map of existing cases
const caseMap = new Map();
for (const c of existingCases) {
  caseMap.set(c.id, c);
}

let updatedCount = 0;
let errors = 0;

for (const pCase of parsedCases) {
  if (!pCase.id) {
    console.error(`Case missing ID! Header: ${pCase.name}`);
    errors++;
    continue;
  }

  const existing = caseMap.get(pCase.id);
  if (!existing) {
    console.error(`Case ID ${pCase.id} not found in all_cases.json!`);
    errors++;
    continue;
  }

  // Parse items
  const skins = [];
  for (const row of pCase.rawTable) {
    let num, weapon, skinName, extraCol, rarity, wear, statTrak, priceStr;

    if (row.length === 7) {
      [num, weapon, skinName, rarity, wear, statTrak, priceStr] = row;
      extraCol = '';
    } else if (row.length === 8) {
      [num, weapon, skinName, extraCol, rarity, wear, statTrak, priceStr] = row;
    } else {
      weapon = row[1];
      skinName = row[2];
      rarity = row[3];
      wear = row[4];
      statTrak = row[5];
      priceStr = row[row.length - 1];
    }

    const priceNum = priceStr ? parseInt(priceStr.replace(/[^\d]/g, ''), 10) : 0;
    const item = matchSkin(weapon, skinName, extraCol, rarity, wear, statTrak, priceNum);

    if (item) {
      skins.push(item);
    } else {
      errors++;
      console.error(`Failed matching item in case ${pCase.id}: ${weapon} | ${skinName}`);
    }
  }

  // Update existing case fields
  existing.name = pCase.name || existing.name;
  existing.nameEn = pCase.nameEn || existing.nameEn;
  existing.subtitle = pCase.description || existing.subtitle;
  if (!existing.subtitleEn || existing.subtitleEn === existing.subtitle) {
    existing.subtitleEn = pCase.description;
  }
  existing.priceDc = pCase.priceDc || existing.priceDc;
  if (pCase.category) {
    existing.category = pCase.category;
  }
  existing.skins = skins;

  updatedCount++;
}

console.log(`\nSuccessfully processed ${updatedCount} cases! Errors: ${errors}`);

if (errors === 0) {
  fs.writeFileSync(allCasesPath, JSON.stringify(existingCases, null, 2), 'utf8');
  console.log(`\nSuccessfully saved updated cases database to ${allCasesPath}!`);
} else {
  console.error(`\nAborted saving due to ${errors} errors!`);
}
