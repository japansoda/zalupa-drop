const fs = require('fs');
const path = require('path');
const { create3DCrateSvg } = require('./generate_3d_crate_svgs');

async function run() {
  console.log('--- 1. LOADING BASE SKINS & WEAPONS ---');
  const skinsPath = path.join(__dirname, '../src/data/all_skins.json');
  const currentSkins = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));

  // Keep all weapons, knives, gloves (filter out any old malformed stickers)
  const weaponSkins = currentSkins.filter(s => 
    s.weapon !== 'Sticker' && 
    s.weapon !== 'Наклейка' && 
    !(s.name && s.name.startsWith('Sticker |')) &&
    !(s.name && s.name.startsWith('StatTrak™ Sticker |'))
  );
  console.log(`Clean weapon & knife skins count: ${weaponSkins.length}`);

  console.log('--- 2. FETCHING STICKERS, AGENTS, CHARMS, PATCHES ---');
  const [stickersRaw, agentsRaw, keychainsRaw, patchesRaw, cratesRaw] = await Promise.all([
    fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json').then(r => r.json()).catch(() => []),
    fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json').then(r => r.json()).catch(() => []),
    fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/keychains.json').then(r => r.json()).catch(() => []),
    fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/patches.json').then(r => r.json()).catch(() => []),
    fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json').then(r => r.json()).catch(() => []),
  ]);

  console.log(`Fetched: ${stickersRaw.length} stickers, ${agentsRaw.length} agents, ${keychainsRaw.length} charms, ${patchesRaw.length} patches, ${cratesRaw.length} crates.`);

  // 2A. PROCESS STICKERS WITH AUTHENTIC PRICES AND NO STATTRAK
  const processedStickers = [];
  for (const st of stickersRaw) {
    if (!st.image || !st.image.startsWith('http')) continue;
    const name = st.name || '';
    const effect = st.effect || null;
    const isKatowice14 = name.includes('Katowice 2014');
    const isKatowice15 = name.includes('Katowice 2015');
    const isCologne14 = name.includes('Cologne 2014');
    const isKrakow17 = name.includes('Krakow 2017');
    const isBoston18 = name.includes('Boston 2018');

    // Rarity mapping
    let rarity = 'milspec';
    const rName = (st.rarity?.name || '').toLowerCase();
    if (rName.includes('extraordinary') || effect === 'Gold') rarity = 'extraordinary';
    else if (rName.includes('exotic') || effect === 'Foil') rarity = 'classified';
    else if (rName.includes('remarkable') || effect === 'Holo' || effect === 'Glitter') rarity = 'restricted';
    else if (rName.includes('high grade')) rarity = 'milspec';

    // Realistic Price Calculation
    let priceDc = 150;
    if (isKatowice14) {
      if (name.includes('Titan (Holo)')) priceDc = 6500000;
      else if (name.includes('iBUYPOWER (Holo)')) priceDc = 7500000;
      else if (name.includes('Reason Gaming (Holo)') || name.includes('Vox Eminor (Holo)')) priceDc = 3800000;
      else if (name.includes('Team Dignitas (Holo)') || name.includes('Team LDLC (Holo)') || name.includes('Natus Vincere (Holo)')) priceDc = 2200000;
      else if (effect === 'Holo') priceDc = 1200000;
      else priceDc = Math.floor(Math.random() * 80000 + 45000); // Paper Katowice 2014
    } else if (isKatowice15) {
      if (effect === 'Holo') priceDc = Math.floor(Math.random() * 120000 + 35000);
      else if (effect === 'Foil') priceDc = Math.floor(Math.random() * 45000 + 15000);
      else priceDc = Math.floor(Math.random() * 8000 + 2000);
    } else if (isKrakow17 || isBoston18) {
      if (effect === 'Gold') {
        if (name.includes('s1mple')) priceDc = 450000;
        else if (name.includes('kennyS')) priceDc = 280000;
        else priceDc = Math.floor(Math.random() * 150000 + 40000);
      } else if (effect === 'Foil') priceDc = Math.floor(Math.random() * 25000 + 5000);
      else priceDc = Math.floor(Math.random() * 3000 + 500);
    } else if (effect === 'Gold') {
      priceDc = Math.floor(Math.random() * 35000 + 6000);
    } else if (effect === 'Holo') {
      priceDc = Math.floor(Math.random() * 15000 + 1200);
    } else if (effect === 'Foil') {
      priceDc = Math.floor(Math.random() * 9000 + 800);
    } else if (effect === 'Glitter') {
      priceDc = Math.floor(Math.random() * 3500 + 350);
    } else if (effect === 'Lenticular') {
      priceDc = Math.floor(Math.random() * 8000 + 1500);
    } else {
      priceDc = Math.floor(Math.random() * 400 + 30);
    }

    processedStickers.push({
      id: st.id,
      name: st.name,
      weapon: 'Sticker',
      skinName: st.name.replace(/^Sticker \| /, ''),
      rarity: rarity,
      wear: 'FN',
      wearLabel: '',
      image: st.image,
      priceUsd: Number((priceDc / 100).toFixed(2)),
      priceDc: priceDc,
      steamMarketUrl: `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(st.name)}`,
      statTrak: false,
      effect: effect,
    });
  }
  console.log(`Processed ${processedStickers.length} clean stickers with realistic prices & effects.`);

  // 2B. PROCESS AGENTS
  const processedAgents = [];
  for (const ag of agentsRaw) {
    if (!ag.image) continue;
    let r = 'milspec';
    const rName = (ag.rarity?.name || '').toLowerCase();
    let priceDc = 1200;
    if (rName.includes('master')) { r = 'covert'; priceDc = Math.floor(Math.random() * 12000 + 6500); }
    else if (rName.includes('superior')) { r = 'classified'; priceDc = Math.floor(Math.random() * 5000 + 2800); }
    else if (rName.includes('exceptional')) { r = 'restricted'; priceDc = Math.floor(Math.random() * 2500 + 1500); }
    else { r = 'milspec'; priceDc = Math.floor(Math.random() * 1200 + 800); }

    processedAgents.push({
      id: ag.id,
      name: ag.name,
      weapon: 'Agent',
      skinName: ag.name,
      rarity: r,
      wear: 'FN',
      wearLabel: '',
      image: ag.image,
      priceUsd: Number((priceDc / 100).toFixed(2)),
      priceDc: priceDc,
      steamMarketUrl: `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(ag.name)}`,
      statTrak: false,
    });
  }
  console.log(`Processed ${processedAgents.length} agents.`);

  // 2C. PROCESS CHARMS & PATCHES
  const processedCharms = keychainsRaw.map(k => ({
    id: k.id,
    name: k.name,
    weapon: 'Charm',
    skinName: k.name.replace(/^Charm \| /, ''),
    rarity: 'restricted',
    wear: 'FN',
    wearLabel: '',
    image: k.image,
    priceUsd: 12.5,
    priceDc: Math.floor(Math.random() * 3000 + 650),
    steamMarketUrl: `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(k.name)}`,
    statTrak: false,
  }));

  const processedPatches = patchesRaw.map(p => ({
    id: p.id,
    name: p.name,
    weapon: 'Patch',
    skinName: p.name.replace(/^Patch \| /, ''),
    rarity: 'milspec',
    wear: 'FN',
    wearLabel: '',
    image: p.image,
    priceUsd: 5.0,
    priceDc: Math.floor(Math.random() * 1800 + 350),
    steamMarketUrl: `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(p.name)}`,
    statTrak: false,
  }));

  // Combine full database
  const fullDatabase = [
    ...weaponSkins,
    ...processedStickers,
    ...processedAgents,
    ...processedCharms,
    ...processedPatches,
  ];

  console.log(`TOTAL DATABASE ITEMS: ${fullDatabase.length}`);
  fs.writeFileSync(skinsPath, JSON.stringify(fullDatabase));
  console.log('Saved all_skins.json successfully!');

  // --- 3. GENERATE 3D SVG ICONS FOR ALL CUSTOM CASES ---
  console.log('--- 3. GENERATING 3D SVG ICONS FOR CUSTOM CASES ---');
  const casesPath = path.join(__dirname, '../src/data/all_cases.json');
  const allCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  const casesDir = path.join(__dirname, '../public/cases');
  if (!fs.existsSync(casesDir)) fs.mkdirSync(casesDir, { recursive: true });

  for (const c of allCases) {
    if (c.category !== 'official' && c.category !== 'stickers') {
      // It's a custom case! Generate its 3D SVG icon
      const cid = c.id;
      let config = {
        topColor1: '#374151', topColor2: '#1f2937',
        leftColor1: '#111827', leftColor2: '#030712',
        rightColor1: '#1f2937', rightColor2: '#111827',
        accentColor: '#facc15',
        emblemSvg: '<polygon points="0,-12 4,-3 14,-3 6,3 9,12 0,6 -9,12 -6,3 -14,-3 -4,-3" fill="#facc15" stroke="#000" stroke-width="0.8" />',
      };

      if (cid.includes('zalupa')) {
        config = {
          topColor1: '#84cc16', topColor2: '#4d7c0f',
          leftColor1: '#1c1917', leftColor2: '#0c0a09',
          rightColor1: '#292524', rightColor2: '#1c1917',
          accentColor: '#facc15', hazardStripes: true,
          emblemSvg: '<circle cx="0" cy="0" r="10" fill="#facc15" /><path d="M-6,-4 L6,4 M-6,4 L6,-4" stroke="#000" stroke-width="2.5" />'
        };
      } else if (cid.includes('knife') || cid.includes('blade') || cid.includes('karambit') || cid.includes('butterfly') || cid.includes('m9') || cid.includes('talon') || cid.includes('skeleton')) {
        config = {
          topColor1: '#27272a', topColor2: '#18181b',
          leftColor1: '#09090b', leftColor2: '#000000',
          rightColor1: '#18181b', rightColor2: '#09090b',
          accentColor: '#f59e0b',
          emblemSvg: '<path d="M-8,8 L8,-8 M-8,-8 L8,8" stroke="#facc15" stroke-width="2.5" stroke-linecap="round" />'
        };
      } else if (cid.includes('gloves')) {
        config = {
          topColor1: '#581c87', topColor2: '#3b0764',
          leftColor1: '#2e1065', leftColor2: '#0f051d',
          rightColor1: '#3b0764', rightColor2: '#2e1065',
          accentColor: '#e9d5ff',
          emblemSvg: '<rect x="-8" y="-8" width="16" height="16" rx="4" fill="#a855f7" stroke="#fff" stroke-width="1" />'
        };
      } else if (cid.includes('dragon')) {
        config = {
          topColor1: '#854d0e', topColor2: '#422006',
          leftColor1: '#1c1917', leftColor2: '#0c0a09',
          rightColor1: '#292524', rightColor2: '#1c1917',
          accentColor: '#f97316',
          emblemSvg: '<polygon points="0,-12 8,2 0,10 -8,2" fill="#ea580c" stroke="#fde047" stroke-width="1" />'
        };
      } else if (cid.includes('asiimov')) {
        config = {
          topColor1: '#f8fafc', topColor2: '#cbd5e1',
          leftColor1: '#0f172a', leftColor2: '#020617',
          rightColor1: '#1e293b', rightColor2: '#0f172a',
          accentColor: '#f97316', hazardStripes: true,
          emblemSvg: '<polygon points="0,-10 9,-5 9,5 0,10 -9,5 -9,-5" fill="#f97316" stroke="#fff" stroke-width="1" />'
        };
      } else if (cid.includes('printstream')) {
        config = {
          topColor1: '#ffffff', topColor2: '#e2e8f0',
          leftColor1: '#1e293b', leftColor2: '#0f172a',
          rightColor1: '#334155', rightColor2: '#1e293b',
          accentColor: '#38bdf8',
          emblemSvg: '<rect x="-8" y="-8" width="16" height="16" fill="#fff" stroke="#38bdf8" stroke-width="1.5" />'
        };
      } else if (cid.includes('fade') || cid.includes('doppler')) {
        config = {
          topColor1: '#c026d3', topColor2: '#701a75',
          leftColor1: '#18181b', leftColor2: '#09090b',
          rightColor1: '#27272a', rightColor2: '#18181b',
          accentColor: '#f43f5e',
          emblemSvg: '<circle cx="0" cy="0" r="9" fill="#f43f5e" stroke="#fbbf24" stroke-width="1.5" />'
        };
      } else if (cid.includes('stattrak')) {
        config = {
          topColor1: '#27272a', topColor2: '#18181b',
          leftColor1: '#09090b', leftColor2: '#000000',
          rightColor1: '#18181b', rightColor2: '#09090b',
          accentColor: '#f97316', digitalLed: true,
          emblemSvg: '<rect x="-10" y="-5" width="20" height="10" fill="#f97316" rx="2" />'
        };
      }

      const svgContent = create3DCrateSvg(config);
      const svgPath = path.join(casesDir, `${cid}.svg`);
      fs.writeFileSync(svgPath, svgContent);
      c.image = `/cases/${cid}.svg`;
    }
  }

  // --- 4. INGEST ALL OFFICIAL STICKER CAPSULES ---
  console.log('--- 4. INGESTING ALL VANILLA STICKER CAPSULES ---');
  const stickerCapsules = cratesRaw.filter(c => (c.type === 'Sticker Capsule' || c.type === 'Autograph Capsule') && c.image);
  console.log(`Found ${stickerCapsules.length} official sticker & autograph capsules.`);

  for (const sc of stickerCapsules) {
    // Collect stickers inside this capsule
    let capSkins = [];
    if (sc.contains && sc.contains.length > 0) {
      for (const item of sc.contains) {
        const found = processedStickers.find(s => s.id === item.id || s.name.toLowerCase().includes(item.name.toLowerCase()));
        if (found) capSkins.push(found);
      }
    }
    if (capSkins.length < 5) {
      capSkins = processedStickers.filter(s => s.name.includes(sc.name.replace(/Sticker Capsule|Autograph Capsule/g, '').trim())).slice(0, 18);
      if (capSkins.length < 5) capSkins = processedStickers.slice(0, 15);
    }

    let priceDc = 450;
    const name = sc.name;
    if (name.includes('2014')) priceDc = 350000;
    else if (name.includes('2015')) priceDc = 45000;
    else if (name.includes('2016') || name.includes('2017')) priceDc = 12000;
    else if (name.includes('2018') || name.includes('2019')) priceDc = 5500;
    else if (name.includes('Antwerp') || name.includes('Stockholm')) priceDc = 1500;
    else priceDc = Math.floor(Math.random() * 800 + 400);

    allCases.push({
      id: sc.id,
      name: sc.name,
      subtitle: 'Официальная капсула CS2 с наклейками',
      image: sc.image,
      priceDc: priceDc,
      category: 'stickers',
      badge: name.includes('2014') ? 'РАРИТЕТ' : undefined,
      skins: capSkins.slice(0, 25),
    });
  }

  console.log(`TOTAL ALL CASES (WITH ALL STICKER CAPSULES): ${allCases.length}`);
  fs.writeFileSync(casesPath, JSON.stringify(allCases, null, 2));
  console.log('Saved all_cases.json successfully!');
}

run().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
