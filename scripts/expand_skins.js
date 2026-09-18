const fs = require('fs');
const path = require('path');

async function run() {
  const skinsPath = path.join(__dirname, '../src/data/all_skins.json');
  const baseSkins = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));
  console.log('Base skins:', baseSkins.length);

  const WEARS = [
    { code: 'MW', label: 'Немного поношенное', mult: 0.82 },
    { code: 'FT', label: 'После полевых испытаний', mult: 0.65 },
    { code: 'WW', label: 'Поношенное', mult: 0.52 },
    { code: 'BS', label: 'Закаленное в боях', mult: 0.42 },
  ];

  const expanded = [];
  for (const b of baseSkins) {
    const isGlove = b.rarity === 'extraordinary' || (b.weapon && (b.weapon.includes('Gloves') || b.weapon.includes('Wraps')));
    const isKnife = b.weapon && (b.weapon.includes('Knife') || b.weapon.includes('Bayonet') || b.weapon.includes('Karambit') || b.weapon.includes('Daggers'));
    const isMisc = ['Sticker', 'Agent', 'Charm', 'Pin', 'Patch'].includes(b.weapon);

    expanded.push({ ...b, wear: 'FN', wearLabel: 'Прямо с завода', statTrak: false });
    if (isMisc) continue;

    for (const w of WEARS) {
      const priceDc = Math.max(10, Math.round(b.priceDc * w.mult));
      expanded.push({ ...b, id: `${b.id}_${w.code.toLowerCase()}`, wear: w.code, wearLabel: w.label, priceDc, priceUsd: Number((priceDc/100).toFixed(2)), statTrak: false });
    }

    if (!isGlove) {
      const stWears = [
        { code: 'FN', label: 'Прямо с завода', mult: 1.35 },
        { code: 'MW', label: 'Немного поношенное', mult: 1.11 },
        { code: 'FT', label: 'После полевых испытаний', mult: 0.88 },
        { code: 'BS', label: 'Закаленное в боях', mult: 0.57 },
      ];
      for (const st of stWears) {
        const priceDc = Math.max(15, Math.round(b.priceDc * st.mult));
        const stName = isKnife 
          ? (b.name.startsWith('★ ') ? `★ StatTrak™ ${b.name.slice(2)}` : `★ StatTrak™ ${b.name}`)
          : `StatTrak™ ${b.name}`;
        expanded.push({ ...b, id: `${b.id}_st_${st.code.toLowerCase()}`, name: stName, wear: st.code, wearLabel: st.label, priceDc, priceUsd: Number((priceDc/100).toFixed(2)), statTrak: true });
      }
    }
  }

  console.log('Total expanded skins:', expanded.length);
  fs.writeFileSync(skinsPath, JSON.stringify(expanded));
  console.log('Saved all_skins.json');
}
run();
