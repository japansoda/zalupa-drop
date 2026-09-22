/**
 * Steam & CS2 Catalog Auto-Sync Engine
 * Fetches latest skins, charms, stickers, agents directly from upstream Steam/CS2 depot.
 */
import fs from 'fs';
import path from 'path';

const WEAR_MAP: Record<string, string> = {
  'Factory New': 'FN',
  'Minimal Wear': 'MW',
  'Field-Tested': 'FT',
  'Well-Worn': 'WW',
  'Battle-Scarred': 'BS',
};

const WEAR_LABELS: Record<string, string> = {
  FN: 'Прямо с завода',
  MW: 'Немного поношенное',
  FT: 'После полевых испытаний',
  WW: 'Поношенное',
  BS: 'Закаленное в боях',
};

const RARITY_MAP: Record<string, string> = {
  'rarity_common_weapon': 'consumer',
  'rarity_uncommon_weapon': 'industrial',
  'rarity_rare_weapon': 'milspec',
  'rarity_mythical_weapon': 'restricted',
  'rarity_legendary_weapon': 'classified',
  'rarity_ancient_weapon': 'covert',
  'rarity_contraband_weapon': 'contraband',
  'consumer': 'consumer',
  'industrial': 'industrial',
  'milspec': 'milspec',
  'restricted': 'restricted',
  'classified': 'classified',
  'covert': 'covert',
  'extraordinary': 'extraordinary',
  'gold': 'gold',
  'contraband': 'contraband',
};

function normalizeRarity(rawRarity: any, isSpecial: boolean): string {
  if (isSpecial) return 'gold';
  if (!rawRarity) return 'milspec';
  const id = typeof rawRarity === 'object' ? rawRarity.id || rawRarity.name : String(rawRarity);
  const lower = id.toLowerCase();
  for (const [key, val] of Object.entries(RARITY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'milspec';
}

function computeBasePrice(rarity: string, isKnifeOrGlove: boolean, statTrak: boolean, wear: string) {
  let baseUsd = 5;
  switch (rarity) {
    case 'consumer': baseUsd = 0.15; break;
    case 'industrial': baseUsd = 0.85; break;
    case 'milspec': baseUsd = 3.5; break;
    case 'restricted': baseUsd = 14; break;
    case 'classified': baseUsd = 55; break;
    case 'covert': baseUsd = 180; break;
    case 'extraordinary':
    case 'gold': baseUsd = 350; break;
    case 'contraband': baseUsd = 2500; break;
  }
  if (isKnifeOrGlove) baseUsd = Math.max(baseUsd, 220);

  const wearMult: Record<string, number> = { FN: 1.5, MW: 1.2, FT: 1.0, WW: 0.85, BS: 0.75 };
  const mult = wearMult[wear] || 1.0;
  let priceUsd = baseUsd * mult;
  if (statTrak) priceUsd *= 1.35;
  const priceDc = Math.round(priceUsd * 100);
  return { priceUsd: Math.round(priceUsd * 100) / 100, priceDc };
}

export async function syncAllSkins(dryRun = false) {
  const skinsPath = path.resolve(process.cwd(), 'src/data/all_skins.json');
  
  let existingSkins: any[] = [];
  if (fs.existsSync(skinsPath)) {
    try {
      existingSkins = JSON.parse(fs.readFileSync(skinsPath, 'utf-8'));
    } catch (e: any) {
      console.warn('[SteamSync] Failed to read existing all_skins.json:', e.message);
    }
  }

  const existingMap = new Map<string, any>();
  for (const s of existingSkins) {
    existingMap.set(s.id, s);
    const key = `${s.name}_${s.wear || ''}_${Boolean(s.statTrak)}`;
    existingMap.set(key, s);
  }

  const endpoints = [
    { type: 'skins', url: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json' },
    { type: 'keychains', url: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/keychains.json' },
    { type: 'stickers', url: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json' },
    { type: 'agents', url: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json' },
  ];

  let addedCount = 0;
  const mergedList = [...existingSkins];
  const seenIds = new Set(existingSkins.map(s => s.id));

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { headers: { 'User-Agent': 'resilient-tesla-sync/1.0' } });
      if (!res.ok) continue;
      const items = await res.json();

      if (ep.type === 'skins') {
        for (const item of items) {
          const weapon = item.weapon?.name || (typeof item.weapon === 'string' ? item.weapon : 'Weapon');
          const skinName = item.pattern?.name || item.name?.split('|')[1]?.trim() || item.name;
          const isKnifeOrGlove = (item.category?.id === 'sfui_invpanel_filter_melee') || 
                                (item.category?.id === 'sfui_invpanel_filter_gloves') || 
                                item.name?.startsWith('★');
          const rarity = normalizeRarity(item.rarity, isKnifeOrGlove);
          const wears = item.wears || [{ id: 'FN', name: 'Factory New' }];
          const hasStatTrak = Boolean(item.stattrak);

          for (const w of wears) {
            const wearCode = WEAR_MAP[w.name] || w.id || 'FN';
            const wearLabel = WEAR_LABELS[wearCode] || 'Прямо с завода';

            const nonStName = isKnifeOrGlove 
              ? (item.name.startsWith('★') ? item.name : `★ ${item.name}`)
              : item.name;
            const nonStKey = `${nonStName}_${wearCode}_false`;
            
            if (!existingMap.has(nonStKey)) {
              const { priceUsd, priceDc } = computeBasePrice(rarity, isKnifeOrGlove, false, wearCode);
              const marketUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(nonStName + ' (' + (w.name || 'Factory New') + ')')}`;
              const newSkin = {
                id: `steam-${item.id}-${wearCode}-nonst`,
                name: nonStName,
                weapon,
                skinName,
                rarity,
                wear: wearCode,
                wearLabel,
                image: item.image,
                priceUsd,
                priceDc,
                steamMarketUrl: marketUrl,
                statTrak: false,
              };
              if (!seenIds.has(newSkin.id)) {
                mergedList.push(newSkin);
                seenIds.add(newSkin.id);
                existingMap.set(nonStKey, newSkin);
                addedCount++;
              }
            }

            if (hasStatTrak) {
              const stName = isKnifeOrGlove 
                ? (item.name.startsWith('★') ? item.name.replace(/^★\s*/, '★ StatTrak™ ') : `★ StatTrak™ ${item.name}`)
                : `StatTrak™ ${item.name}`;
              const stKey = `${stName}_${wearCode}_true`;

              if (!existingMap.has(stKey)) {
                const { priceUsd, priceDc } = computeBasePrice(rarity, isKnifeOrGlove, true, wearCode);
                const marketUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(stName + ' (' + (w.name || 'Factory New') + ')')}`;
                const newSkinSt = {
                  id: `steam-${item.id}-${wearCode}-st`,
                  name: stName,
                  weapon,
                  skinName,
                  rarity,
                  wear: wearCode,
                  wearLabel,
                  image: item.image,
                  priceUsd,
                  priceDc,
                  steamMarketUrl: marketUrl,
                  statTrak: true,
                };
                if (!seenIds.has(newSkinSt.id)) {
                  mergedList.push(newSkinSt);
                  seenIds.add(newSkinSt.id);
                  existingMap.set(stKey, newSkinSt);
                  addedCount++;
                }
              }
            }
          }
        }
      } else if (ep.type === 'keychains') {
        for (const item of items) {
          const charmName = item.name.startsWith('Charm |') ? item.name : `Charm | ${item.name}`;
          const key = `${charmName}__false`;
          if (!existingMap.has(key)) {
            const rarity = normalizeRarity(item.rarity, false);
            const { priceUsd, priceDc } = computeBasePrice(rarity, false, false, 'FN');
            const marketUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(charmName)}`;
            const newCharm = {
              id: `steam-charm-${item.id || item.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
              name: charmName,
              weapon: 'Charm',
              skinName: item.name.replace(/^Charm\s*\|\s*/i, ''),
              rarity,
              image: item.image,
              priceUsd: Math.max(priceUsd, 2.5),
              priceDc: Math.max(priceDc, 250),
              steamMarketUrl: marketUrl,
              statTrak: false,
            };
            if (!seenIds.has(newCharm.id)) {
              mergedList.push(newCharm);
              seenIds.add(newCharm.id);
              existingMap.set(key, newCharm);
              addedCount++;
            }
          }
        }
      } else if (ep.type === 'stickers') {
        for (const item of items) {
          const stickerName = item.name.startsWith('Sticker |') ? item.name : `Sticker | ${item.name}`;
          const key = `${stickerName}__false`;
          if (!existingMap.has(key)) {
            const rarity = normalizeRarity(item.rarity, false);
            const { priceUsd, priceDc } = computeBasePrice(rarity, false, false, 'FN');
            const marketUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(stickerName)}`;
            const newSticker = {
              id: `steam-sticker-${item.id || item.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
              name: stickerName,
              weapon: 'Sticker',
              skinName: item.name.replace(/^Sticker\s*\|\s*/i, ''),
              rarity,
              image: item.image,
              priceUsd: Math.max(priceUsd, 0.5),
              priceDc: Math.max(priceDc, 50),
              steamMarketUrl: marketUrl,
              statTrak: false,
            };
            if (!seenIds.has(newSticker.id)) {
              mergedList.push(newSticker);
              seenIds.add(newSticker.id);
              existingMap.set(key, newSticker);
              addedCount++;
            }
          }
        }
      } else if (ep.type === 'agents') {
        for (const item of items) {
          const key = `${item.name}__false`;
          if (!existingMap.has(key)) {
            const rarity = normalizeRarity(item.rarity, false);
            const { priceUsd, priceDc } = computeBasePrice(rarity, false, false, 'FN');
            const marketUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.name)}`;
            const newAgent = {
              id: `steam-agent-${item.id || item.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
              name: item.name,
              weapon: 'Agent',
              skinName: item.name,
              rarity,
              image: item.image,
              priceUsd: Math.max(priceUsd, 8.0),
              priceDc: Math.max(priceDc, 800),
              steamMarketUrl: marketUrl,
              statTrak: false,
            };
            if (!seenIds.has(newAgent.id)) {
              mergedList.push(newAgent);
              seenIds.add(newAgent.id);
              existingMap.set(key, newAgent);
              addedCount++;
            }
          }
        }
      }
    } catch (err) {
      console.error(`[SteamSync] Error processing ${ep.type}:`, err);
    }
  }

  if (!dryRun && addedCount > 0) {
    try {
      fs.writeFileSync(skinsPath, JSON.stringify(mergedList, null, 2), 'utf-8');
    } catch (writeErr: any) {
      console.warn('[SteamSync] Could not write to disk (likely serverless):', writeErr.message);
    }
  }

  return { addedCount, totalCount: mergedList.length };
}
