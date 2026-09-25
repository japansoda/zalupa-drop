const fs = require('fs');
const path = require('path');

const allCasesPath = path.join(__dirname, '../src/data/all_cases.json');
const allSkinsPath = path.join(__dirname, '../src/data/all_skins.json');

const allCases = JSON.parse(fs.readFileSync(allCasesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(allSkinsPath, 'utf8'));

function getGroupedCount(skins) {
  const map = new Map();
  for (const s of (skins || [])) {
    const key = `${s.weapon || ''}___${s.skinName || s.name}`;
    map.set(key, true);
  }
  return map.size;
}

// Popular cool skins to pad cases if they fall below 15
const poolSkins = allSkins.filter(s => {
  // pick good recognizable skins
  return !s.name.includes('Souvenir') && s.priceDc > 50 && s.priceDc < 50000;
});

let updatedCount = 0;

for (const c of allCases) {
  // Skip souvenir packages
  if (c.id.startsWith('souvenir_')) continue;

  let uCount = getGroupedCount(c.skins);
  if (uCount < 15) {
    const existingKeys = new Set((c.skins || []).map(s => `${s.weapon || ''}___${s.skinName || s.name}`));
    const existingIds = new Set((c.skins || []).map(s => s.id));

    // Determine target rarities based on existing case contents
    const rarities = (c.skins || []).map(s => s.rarity);
    
    // Find candidate skins matching rarities in the case
    for (const candidate of poolSkins) {
      if (uCount >= 16) break;
      const key = `${candidate.weapon || ''}___${candidate.skinName || candidate.name}`;
      if (!existingKeys.has(key) && !existingIds.has(candidate.id)) {
        if (rarities.includes(candidate.rarity)) {
          c.skins.push(candidate);
          existingKeys.add(key);
          existingIds.add(candidate.id);
          uCount++;
        }
      }
    }

    // If still < 15, add any nice candidate
    for (const candidate of poolSkins) {
      if (uCount >= 16) break;
      const key = `${candidate.weapon || ''}___${candidate.skinName || candidate.name}`;
      if (!existingKeys.has(key) && !existingIds.has(candidate.id)) {
        c.skins.push(candidate);
        existingKeys.add(key);
        existingIds.add(candidate.id);
        uCount++;
      }
    }

    console.log(`[${c.id}] "${c.name}" padded to ${uCount} unique skins (Total ${c.skins.length} items)`);
    updatedCount++;
  }
}

console.log(`Padded ${updatedCount} cases to >= 15 unique skins.`);
fs.writeFileSync(allCasesPath, JSON.stringify(allCases, null, 2), 'utf8');
