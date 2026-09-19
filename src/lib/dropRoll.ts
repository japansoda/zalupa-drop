import { SkinEntity, SkinWear } from './types';
import { isWearableItem, isStatTrakableItem, WEAR_NAME_MAP } from './steam';

// Wear probabilities: "чем выше тем реже" (higher quality is rarer)
// FN (8%) < MW (16%) < BS (16%) < WW (22%) < FT (38%)
const WEAR_CHANCES: { wear: SkinWear; chance: number; multiplier: number }[] = [
  { wear: 'FN', chance: 0.08, multiplier: 2.2 },
  { wear: 'MW', chance: 0.16, multiplier: 1.4 },
  { wear: 'FT', chance: 0.38, multiplier: 1.0 },
  { wear: 'WW', chance: 0.22, multiplier: 0.8 },
  { wear: 'BS', chance: 0.16, multiplier: 0.65 },
];

/**
 * Rolls random wear and StatTrak for any skin unboxed from cases or generated on the roulette tape.
 * - Non-wearable items (Charms, Agents, Stickers) never receive wear.
 * - Non-stattrakable items (Gloves, Agents, Charms, Stickers) never receive StatTrak.
 * - Higher wear condition is significantly rarer.
 * - StatTrak is rare (~10% chance).
 */
export function rollWearAndStatTrak(baseSkin: SkinEntity): SkinEntity {
  const result: SkinEntity = { ...baseSkin };

  // Generate a unique instance ID for inventory tracking
  result.id = `${baseSkin.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Clean base name from any existing (Wear) or StatTrak
  let cleanName = baseSkin.name || '';
  cleanName = cleanName.replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '★ ').trim();
  cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();

  let priceMultiplier = 1.0;

  // 1. Wear Quality Roll
  if (isWearableItem(baseSkin)) {
    const rnd = Math.random();
    let accumulated = 0;
    let selectedWear: SkinWear = 'FT';
    let wearMul = 1.0;

    for (const item of WEAR_CHANCES) {
      accumulated += item.chance;
      if (rnd <= accumulated) {
        selectedWear = item.wear;
        wearMul = item.multiplier;
        break;
      }
    }

    result.wear = selectedWear;
    priceMultiplier *= wearMul;
  } else {
    result.wear = undefined;
  }

  // 2. StatTrak Roll (~10% chance in CS2)
  if (isStatTrakableItem(baseSkin)) {
    const rollST = Math.random() < 0.10;
    result.statTrak = rollST;
    if (rollST) {
      priceMultiplier *= 1.7;
    }
  } else {
    result.statTrak = false;
  }

  // 3. Compute final price in DropCoin (DC)
  result.priceDc = Math.max(10, Math.round((baseSkin.priceDc || 100) * priceMultiplier));

  // 4. Construct formatted display name
  const wearEnglish = result.wear ? WEAR_NAME_MAP[result.wear] : null;
  const isKnife = cleanName.startsWith('★');

  if (result.statTrak) {
    if (isKnife) {
      cleanName = cleanName.replace(/^★\s*/, '★ StatTrak™ ');
    } else {
      cleanName = `StatTrak™ ${cleanName}`;
    }
  }

  if (wearEnglish) {
    result.name = `${cleanName} (${wearEnglish})`;
  } else {
    result.name = cleanName;
  }

  return result;
}
