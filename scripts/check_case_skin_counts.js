const fs = require('fs');
const path = require('path');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/all_cases.json'), 'utf8'));

function getGroupedCount(caseItem) {
  const map = new Map();
  for (const s of (caseItem.skins || [])) {
    const key = `${s.weapon || ''}___${s.skinName || s.name}`;
    map.set(key, true);
  }
  return map.size;
}

const under15 = [];
cases.forEach(c => {
  const count = getGroupedCount(c);
  if (count < 15) {
    under15.push({ id: c.id, name: c.name, count, totalItems: (c.skins || []).length });
  }
});

console.log(`Total cases: ${cases.length}`);
console.log(`Cases with < 15 unique skin groups: ${under15.length}`);
under15.forEach(c => {
  console.log(`- [${c.id}] "${c.name}": ${c.count} unique skins (${c.totalItems} total variant items)`);
});
