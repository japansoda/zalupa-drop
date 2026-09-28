import { SkinEntity, SkinWear, LivePricesMap } from './types';
import { isWearableItem, isStatTrakableItem, WEAR_NAME_MAP } from './steam';
import { getCanonicalPrice } from './marketPricing';

// Wear probabilities: "чем выше тем реже" (higher quality is rarer)
// FN (8%) < MW (16%) < BS (16%) < WW (22%) < FT (38%)
const WEAR_CHANCES: { wear: SkinWear; chance: number }[] = [
  { wear: 'FN', chance: 0.08 },
  { wear: 'MW', chance: 0.16 },
  { wear: 'FT', chance: 0.38 },
  { wear: 'WW', chance: 0.22 },
  { wear: 'BS', chance: 0.16 },
];

/**
 * Rolls random wear and StatTrak for any skin unboxed from cases or generated on the roulette tape.
 * - Non-wearable items (Charms, Agents, Stickers) never receive wear.
 * - Non-stattrakable items (Gloves, Agents, Charms, Stickers) never receive StatTrak.
 * - Higher wear condition is significantly rarer.
 * - StatTrak is rare (~10% chance).
 * - Price is strictly derived from canonical marketplace pricing (unified across site).
 */
export function rollWearAndStatTrak(
  baseSkin: SkinEntity,
  livePrices?: LivePricesMap
): SkinEntity {
  const result: SkinEntity = { ...baseSkin };

  // Generate a unique instance ID for inventory tracking
  result.id = `${baseSkin.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Clean base name from any existing (Wear) or StatTrak
  let cleanName = baseSkin.name || '';
  cleanName = cleanName.replace(/^StatTrak™\s*/i, '').replace(/^★\s*StatTrak™\s*/i, '★ ').trim();
  cleanName = cleanName.replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred|Прямо с завода|Немного поношенное|После полевых испытаний|Поношенное|Закаленное в боях)\)$/i, '').trim();

  // 1. Wear Quality Roll
  if (isWearableItem(baseSkin)) {
    const rnd = Math.random();
    let accumulated = 0;
    let selectedWear: SkinWear = 'FT';

    for (const item of WEAR_CHANCES) {
      accumulated += item.chance;
      if (rnd <= accumulated) {
        selectedWear = item.wear;
        break;
      }
    }

    result.wear = selectedWear;
  } else {
    result.wear = undefined;
  }

  // 2. StatTrak Roll (~10% chance in CS2)
  if (isStatTrakableItem(baseSkin)) {
    const rollST = Math.random() < 0.10;
    result.statTrak = rollST;
  } else {
    result.statTrak = false;
  }

  // 3. Compute canonical marketplace price in DropCoin (DC) and USD
  const canonical = getCanonicalPrice(result, livePrices);
  result.priceDc = canonical.priceDc;
  result.priceUsd = canonical.priceUsd;

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
