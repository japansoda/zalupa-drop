const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '../src/data/all_cases.json');
const skinsPath = path.join(__dirname, '../src/data/all_skins.json');

const allCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const allSkins = JSON.parse(fs.readFileSync(skinsPath, 'utf8'));

console.log(`Loaded ${allCases.length} cases and ${allSkins.length} skins.`);

// Helper: deduplicate skins by name & weapon (base skin entity)
function getUniqueBaseSkins(skinList) {
  const seen = new Set();
  const res = [];
  for (const s of skinList) {
    const cleanW = (s.weapon || '').replace(/^★\s*StatTrak™\s*/i, '★ ').replace(/^StatTrak™\s*/i, '').trim();
    const cleanN = (s.skinName || s.name || '').replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();
    const key = `${cleanW}_${cleanN}`;
    if (!seen.has(key)) {
      seen.add(key);
      res.push({
        ...s,
        weapon: cleanW,
        skinName: cleanN,
        name: cleanW.startsWith('★') ? `${cleanW} | ${cleanN}` : `${cleanW} | ${cleanN}`,
        wear: undefined,
        statTrak: false,
      });
    }
  }
  return res;
}

const allUniqueSkins = getUniqueBaseSkins(allSkins);

// Strictly firearm weapons & knives (no stickers/charms/patches/agents)
const uniqueWeaponSkins = allUniqueSkins.filter(s => {
  const w = (s.weapon || '').toLowerCase();
  const n = (s.name || '').toLowerCase();
  if (w === 'sticker' || w === 'charm' || w === 'patch' || w === 'agent' || w === 'оперативник') return false;
  if (w.includes('наклейка') || w.includes('брелок') || w.includes('agent') || w.includes('оперативник')) return false;
  if (n.startsWith('agent |') || n.startsWith('оперативник |') || n.startsWith('sticker |') || n.startsWith('charm |')) return false;
  return true;
});

console.log(`Unique base weapon skins available: ${uniqueWeaponSkins.length}`);

// Category and theme curations
function findSkinsByFilter(filterFn, limit = 18, mustInclude = []) {
  const matched = uniqueWeaponSkins.filter(filterFn);
  if (matched.length === 0 && mustInclude.length === 0) return [];
  
  // Combine mustInclude with matched
  const seen = new Set();
  const combined = [];
  
  for (const s of mustInclude) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      combined.push(s);
    }
  }

  // Sort remaining matched by price
  matched.sort((a, b) => a.priceDc - b.priceDc);
  for (const s of matched) {
    if (!seen.has(s.id) && combined.length < limit) {
      seen.add(s.id);
      combined.push(s);
    }
  }

  // If still room, pick spread from matched
  combined.sort((a, b) => a.priceDc - b.priceDc);
  return combined;
}

// Balance case price based on contents and target RTP (~90-95%)
function calculateBalancedPrice(skins, currentPrice, category) {
  if (!skins || skins.length === 0) return currentPrice;
  const prices = skins.map(s => s.priceDc).sort((a, b) => a - b);
  const minP = prices[0];
  const maxP = prices[prices.length - 1];

  if (category === 'budget') {
    if (currentPrice <= 75) return 50;
    if (currentPrice <= 150) return 100;
    if (currentPrice <= 350) return 250;
    if (currentPrice <= 600) return 500;
    if (currentPrice <= 850) return 750;
    return 1000;
  }

  let target = currentPrice;
  if (target < minP * 1.1) {
    target = Math.round(minP * 1.35);
  }
  if (target > maxP * 0.7) {
    target = Math.round(maxP * 0.45);
  }

  // Round to pleasing clean price points
  if (target < 500) target = Math.round(target / 10) * 10;
  else if (target < 2000) target = Math.round(target / 50) * 50;
  else if (target < 10000) target = Math.round(target / 100) * 100;
  else if (target < 50000) target = Math.round(target / 500) * 500;
  else target = Math.round(target / 1000) * 1000;

  return Math.max(50, target);
}

let auditedCount = 0;

for (const c of allCases) {
  const id = c.id;
  const name = c.name;

  // 1. AK-47 cases
  if (id === 'case_ak47_universe' || id === 'case_ak47_emperor') {
    const akSkins = findSkinsByFilter(s => s.weapon === 'AK-47', 18);
    if (akSkins.length >= 12) {
      c.skins = akSkins;
      c.priceDc = calculateBalancedPrice(akSkins, 3800, c.category);
      auditedCount++;
    }
  }

  // 2. AWP cases
  else if (id === 'case_awp_elite' || id === 'case_awp_king') {
    const awpSkins = findSkinsByFilter(s => s.weapon === 'AWP' || s.weapon.includes('SSG 08'), 18);
    if (awpSkins.length >= 12) {
      c.skins = awpSkins;
      c.priceDc = calculateBalancedPrice(awpSkins, 4200, c.category);
      auditedCount++;
    }
  }

  // 3. M4 cases
  else if (id === 'case_m4_elite' || id === 'case_m4_clash') {
    const m4Skins = findSkinsByFilter(s => s.weapon === 'M4A4' || s.weapon === 'M4A1-S', 18);
    if (m4Skins.length >= 12) {
      c.skins = m4Skins;
      c.priceDc = calculateBalancedPrice(m4Skins, 3600, c.category);
      auditedCount++;
    }
  }

  // 4. Desert Eagle case
  else if (id === 'case_deagle_oneshot') {
    const deagleSkins = findSkinsByFilter(s => s.weapon === 'Desert Eagle', 18);
    if (deagleSkins.length >= 10) {
      c.skins = deagleSkins;
      c.priceDc = calculateBalancedPrice(deagleSkins, 1800, c.category);
      auditedCount++;
    }
  }

  // 5. Pistols case
  else if (id === 'case_pistol_round' || id === 'case_king_pistols') {
    const pistolWeapons = ['USP-S', 'Glock-18', 'P250', 'Five-SeveN', 'Desert Eagle', 'CZ75-Auto', 'Tec-9', 'Dual Berettas'];
    const pistolSkins = findSkinsByFilter(s => pistolWeapons.includes(s.weapon), 18);
    if (pistolSkins.length >= 15) {
      c.skins = pistolSkins;
      c.priceDc = calculateBalancedPrice(pistolSkins, 950, c.category);
      auditedCount++;
    }
  }

  // 6. SMG cases
  else if (id === 'case_smg_rush' || id === 'case_smg_god') {
    const smgWeapons = ['P90', 'MP9', 'MAC-10', 'MP7', 'UMP-45', 'PP-Bizon', 'MP5-SD'];
    const smgSkins = findSkinsByFilter(s => smgWeapons.includes(s.weapon), 18);
    if (smgSkins.length >= 15) {
      c.skins = smgSkins;
      c.priceDc = calculateBalancedPrice(smgSkins, 450, c.category);
      auditedCount++;
    }
  }

  // 7. Shotguns & Heavy
  else if (id === 'case_heavy_cannon' || id === 'case_shotgun_heavy') {
    const heavyWeapons = ['Nova', 'XM1014', 'MAG-7', 'Sawed-Off', 'M249', 'Negev'];
    const heavySkins = findSkinsByFilter(s => heavyWeapons.includes(s.weapon), 18);
    if (heavySkins.length >= 12) {
      c.skins = heavySkins;
      c.priceDc = calculateBalancedPrice(heavySkins, 350, c.category);
      auditedCount++;
    }
  }

  // 8. Asiimov case
  else if (id === 'case_asiimov_mania' || name.includes('Азимов')) {
    const mustAsiimov = uniqueWeaponSkins.filter(s => s.skinName.includes('Asiimov'));
    const companions = uniqueWeaponSkins.filter(s => s.skinName.includes('Mecha Industries') || s.skinName.includes('Cyrex') || s.skinName.includes('Fuel Injector'));
    const asiimovSkins = findSkinsByFilter(s => false, 18, [...mustAsiimov, ...companions]);
    if (asiimovSkins.length >= 8) {
      c.skins = asiimovSkins;
      c.priceDc = 3200;
      auditedCount++;
    }
  }

  // 9. Redline cases
  else if (id === 'case_redline' || id === 'case_redline_fury' || name.includes('Redline') || name.includes('Красная Линия')) {
    const mustRedline = uniqueWeaponSkins.filter(s => s.skinName === 'Redline');
    const companions = uniqueWeaponSkins.filter(s => s.skinName.includes('Bloodsport') || s.skinName.includes('Cyrex') || s.skinName.includes('Code Red') || (s.skinName.includes('Crimson Web') && s.weapon.startsWith('★')));
    const redlineSkins = findSkinsByFilter(s => false, 18, [...mustRedline, ...companions]);
    if (redlineSkins.length >= 8) {
      c.skins = redlineSkins;
      c.priceDc = 1200;
      auditedCount++;
    }
  }

  // 10. Printstream case
  else if (id === 'case_printstream_lab' || name.includes('Printstream')) {
    const mustPrintstream = uniqueWeaponSkins.filter(s => s.skinName === 'Printstream');
    const companions = uniqueWeaponSkins.filter(s => s.skinName.includes('Whiteout') || s.skinName.includes('Mecha Industries'));
    const printstreamSkins = findSkinsByFilter(s => false, 18, [...mustPrintstream, ...companions]);
    if (printstreamSkins.length >= 6) {
      c.skins = printstreamSkins;
      c.priceDc = 4500;
      auditedCount++;
    }
  }

  // 11. Hyper Beast case
  else if (id === 'case_hyper_beast' || name.includes('Hyper Beast')) {
    const mustHyper = uniqueWeaponSkins.filter(s => s.skinName === 'Hyper Beast');
    const companions = uniqueWeaponSkins.filter(s => s.skinName.includes('Wildfire') || s.skinName.includes('Kraken') || s.skinName.includes('Monster Mashup'));
    const hyperSkins = findSkinsByFilter(s => false, 18, [...mustHyper, ...companions]);
    if (hyperSkins.length >= 6) {
      c.skins = hyperSkins;
      c.priceDc = 2400;
      auditedCount++;
    }
  }

  // 12. Case Hardened
  else if (id === 'case_case_hardened' || name.includes('Поверхностная Закалка')) {
    const chSkins = findSkinsByFilter(s => s.skinName.includes('Case Hardened'), 18);
    if (chSkins.length >= 8) {
      c.skins = chSkins;
      c.priceDc = 6500;
      auditedCount++;
    }
  }

  // 13. Specific Knives
  else if (id === 'case_butterfly_dreams') {
    const bfk = findSkinsByFilter(s => s.weapon === '★ Butterfly Knife', 18);
    if (bfk.length >= 10) {
      c.skins = bfk;
      c.priceDc = 35000;
      auditedCount++;
    }
  } else if (id === 'case_karambit_exclusive') {
    const kara = findSkinsByFilter(s => s.weapon === '★ Karambit', 18);
    if (kara.length >= 10) {
      c.skins = kara;
      c.priceDc = 32000;
      auditedCount++;
    }
  } else if (id === 'case_m9_bayonet') {
    const m9 = findSkinsByFilter(s => s.weapon === '★ M9 Bayonet', 18);
    if (m9.length >= 10) {
      c.skins = m9;
      c.priceDc = 28000;
      auditedCount++;
    }
  } else if (id === 'case_talon_tiger') {
    const talon = findSkinsByFilter(s => s.weapon === '★ Talon Knife', 18);
    if (talon.length >= 10) {
      c.skins = talon;
      c.priceDc = 22000;
      auditedCount++;
    }
  } else if (id === 'case_skeleton_deadly') {
    const skel = findSkinsByFilter(s => s.weapon === '★ Skeleton Knife', 18);
    if (skel.length >= 10) {
      c.skins = skel;
      c.priceDc = 24000;
      auditedCount++;
    }
  } else if (id === 'case_stiletto_mafia') {
    const stiletto = findSkinsByFilter(s => s.weapon === '★ Stiletto Knife', 18);
    if (stiletto.length >= 10) {
      c.skins = stiletto;
      c.priceDc = 18000;
      auditedCount++;
    }
  } else if (id === 'case_only_knives') {
    const knives = findSkinsByFilter(s => s.weapon.startsWith('★') && !s.weapon.includes('Gloves') && !s.weapon.includes('Wraps'), 18);
    if (knives.length >= 15) {
      c.skins = knives;
      c.priceDc = 16000;
      auditedCount++;
    }
  } else if (id === 'case_gloves_vip' || id === 'case_glove_collector') {
    const gloves = findSkinsByFilter(s => s.weapon.includes('Gloves') || s.weapon.includes('Wraps'), 18);
    if (gloves.length >= 12) {
      c.skins = gloves;
      c.priceDc = 15000;
      auditedCount++;
    }
  }

  // 14. 10% Knife & 50% Knife
  else if (id === 'case_10_knife') {
    const knives = uniqueWeaponSkins.filter(s => s.weapon.startsWith('★') && !s.weapon.includes('Gloves'));
    const weapons = uniqueWeaponSkins.filter(s => !s.weapon.startsWith('★') && s.priceDc >= 200 && s.priceDc <= 3000);
    const mixed = [...knives.slice(0, 4), ...weapons.slice(0, 14)];
    c.skins = mixed;
    c.priceDc = 3500;
    auditedCount++;
  } else if (id === 'case_50_knife') {
    const knives = uniqueWeaponSkins.filter(s => s.weapon.startsWith('★') && !s.weapon.includes('Gloves'));
    const weapons = uniqueWeaponSkins.filter(s => !s.weapon.startsWith('★') && s.priceDc >= 500 && s.priceDc <= 5000);
    const mixed = [...knives.slice(0, 9), ...weapons.slice(0, 9)];
    c.skins = mixed;
    c.priceDc = 22000;
    auditedCount++;
  }

  // 15. Salary / Paycheck cases (Strictly firearms, min price balanced)
  else if (id === 'case_paycheck_2500') {
    c.skins = findSkinsByFilter(s => s.priceDc >= 250 && s.priceDc <= 12000, 18);
    c.priceDc = 2500;
    auditedCount++;
  } else if (id === 'case_advance_5000') {
    c.skins = findSkinsByFilter(s => s.priceDc >= 600 && s.priceDc <= 25000, 18);
    c.priceDc = 5000;
    auditedCount++;
  } else if (id === 'case_salary_10000') {
    c.skins = findSkinsByFilter(s => s.priceDc >= 1200 && s.priceDc <= 50000, 18);
    c.priceDc = 10000;
    auditedCount++;
  }

  // 16. Color inventories
  else if (id === 'case_all_red_inventory') {
    c.skins = findSkinsByFilter(s => {
      const n = (s.name + ' ' + s.skinName).toLowerCase();
      return n.includes('red') || n.includes('howl') || n.includes('bloodsport') || n.includes('cyrex') || n.includes('crimson') || n.includes('hot rod') || n.includes('candy');
    }, 18);
    c.priceDc = 2800;
    auditedCount++;
  } else if (id === 'case_all_blue_inventory') {
    c.skins = findSkinsByFilter(s => {
      const n = (s.name + ' ' + s.skinName).toLowerCase();
      return n.includes('blue') || n.includes('sapphire') || n.includes('cobalt') || n.includes('poseidon') || n.includes('sun in leo') || n.includes('frontside');
    }, 18);
    c.priceDc = 2600;
    auditedCount++;
  } else if (id === 'case_all_green_inventory') {
    c.skins = findSkinsByFilter(s => {
      const n = (s.name + ' ' + s.skinName).toLowerCase();
      return n.includes('green') || n.includes('emerald') || n.includes('lotus') || n.includes('containment') || n.includes('hydroponic');
    }, 18);
    c.priceDc = 3200;
    auditedCount++;
  } else if (id === 'case_all_white_inventory') {
    c.skins = findSkinsByFilter(s => {
      const n = (s.name + ' ' + s.skinName).toLowerCase();
      return n.includes('white') || n.includes('printstream') || n.includes('mecha') || n.includes('asiimov') || n.includes('damascus');
    }, 18);
    c.priceDc = 3500;
    auditedCount++;
  } else if (id === 'case_all_black_inventory') {
    c.skins = findSkinsByFilter(s => {
      const n = (s.name + ' ' + s.skinName).toLowerCase();
      return n.includes('black') || n.includes('night') || n.includes('slate') || n.includes('carbon') || n.includes('dark');
    }, 18);
    c.priceDc = 1800;
    auditedCount++;
  }

  // 17. Rebalance general prices for all cases
  c.priceDc = calculateBalancedPrice(c.skins, c.priceDc, c.category);
}

console.log(`Audited and re-aligned ${auditedCount} thematic cases.`);

// Write updated cases
fs.writeFileSync(casesPath, JSON.stringify(allCases, null, 2), 'utf8');
console.log(`Successfully saved all ${allCases.length} cases with rebalanced prices and authentic contents.`);
