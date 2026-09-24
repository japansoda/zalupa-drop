export interface ConsumableItem {
  id: string;
  name: string;
  nameEn: string;
  rarity: 'contraband' | 'gold' | 'covert' | 'classified';
  description: string;
  descriptionEn: string;
  icon: string;
}

export const LUCK_POTION: ConsumableItem = {
  id: 'potion_luck',
  name: 'Зелье удачи',
  nameEn: 'Luck Potion',
  rarity: 'contraband',
  description: 'Универсальная удача на 3 действия (+15%): кейсы, апгрейдер и контракты',
  descriptionEn: 'Universal luck for 3 actions (+15%): cases, upgrader and contracts',
  icon: 'FlaskConical',
};

export const SAVE_TOKEN: ConsumableItem = {
  id: 'save_token',
  name: 'Жетон сохранения',
  nameEn: 'Guardian Aegis',
  rarity: 'gold',
  description: 'Дарует предмету ангельские крылья и нимб. При неудаче в апгрейдере защищённый скин не сгорает!',
  descriptionEn: 'Grants angelic wings and halo. In case of upgrade failure, the protected skin will not burn!',
  icon: 'ShieldCheck',
};

export const ZEUS_ITEM: ConsumableItem = {
  id: 'zeus_charge',
  name: 'Zeus x27',
  nameEn: 'Zeus x27',
  rarity: 'covert',
  description: 'Стреляет молнией в стрелку барабана, электризует её, даёт реролл и +5% к шансу апгрейда!',
  descriptionEn: 'Fires lightning at the arrow, electrifies it, grants a reroll and +5% upgrade chance!',
  icon: 'Zap',
};

export const HOOK_ITEM: ConsumableItem = {
  id: 'grappling_hook',
  name: 'Крюк-кошка',
  nameEn: 'Grappling Hook',
  rarity: 'classified',
  description: 'Во время прокрута зацепись за карточку предмета (или полоску шанса): 50/50 — притянет выигрыш или сорвётся!',
  descriptionEn: 'Mid-spin, hook an item card (or the chance arc): 50/50 — drags the win in or slips off!',
  icon: 'Anchor',
};

export const CHICKEN_EGG_ITEM: ConsumableItem = {
  id: 'chicken_egg',
  name: 'Куриное яйцо',
  nameEn: 'Chicken Egg',
  rarity: 'gold',
  description: 'Инкубационное яйцо для фермы CS2. Вынашивается 2 часа и вылупляет боевую курицу!',
  descriptionEn: 'Incubation egg for your CS2 chicken farm. Hatches into a CS2 chicken in 2 hours!',
  icon: 'Egg',
};

export function getPotionName(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? LUCK_POTION.nameEn : LUCK_POTION.name;
}

export function getPotionDesc(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? LUCK_POTION.descriptionEn : LUCK_POTION.description;
}

export function getSaveTokenName(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? SAVE_TOKEN.nameEn : SAVE_TOKEN.name;
}

export function getSaveTokenDesc(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? SAVE_TOKEN.descriptionEn : SAVE_TOKEN.description;
}

export function getZeusName(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? ZEUS_ITEM.nameEn : ZEUS_ITEM.name;
}

export function getZeusDesc(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? ZEUS_ITEM.descriptionEn : ZEUS_ITEM.description;
}

export function getHookName(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? HOOK_ITEM.nameEn : HOOK_ITEM.name;
}

export function getHookDesc(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? HOOK_ITEM.descriptionEn : HOOK_ITEM.description;
}

export function getChickenEggName(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? CHICKEN_EGG_ITEM.nameEn : CHICKEN_EGG_ITEM.name;
}

export function getChickenEggDesc(locale: 'ru' | 'en' = 'ru'): string {
  return locale === 'en' ? CHICKEN_EGG_ITEM.descriptionEn : CHICKEN_EGG_ITEM.description;
}

/**
 * Roll rare bonus drop from opening a case.
 * Very low overall chance (approx 3%) for extra consumables.
 */
export function rollCaseBonusDrop(): {
  potion?: boolean;
  saveToken?: boolean;
  zeus?: boolean;
  hook?: boolean;
  chickenEgg?: boolean;
} {
  // Low chance overall to get ANY bonus drop on opening a case: 3.2%
  if (Math.random() > 0.032) {
    return {};
  }

  const roll = Math.random();
  if (roll < 0.20) {
    // 20% of bonus drops -> Luck Potion
    return { potion: true };
  } else if (roll < 0.46) {
    // 26% of bonus drops -> Save Token (Guardian Aegis)
    return { saveToken: true };
  } else if (roll < 0.72) {
    // 26% of bonus drops -> Zeus x27
    return { zeus: true };
  } else if (roll < 0.86) {
    // 14% of bonus drops -> Grappling Hook
    return { hook: true };
  } else {
    // 14% of bonus drops -> Rare Chicken Egg!
    return { chickenEgg: true };
  }
}

/**
 * Roll consolation prize in upgrader on high-price loss.
 * Very low chance (2-5%) and only on losses >= 2,500 DC.
 */
export function rollConsolationPrize(lostAmount: number): {
  potion?: boolean;
  saveToken?: boolean;
  zeus?: boolean;
  hook?: boolean;
} | null {
  if (lostAmount < 2500) return null;

  // Scales gently with lost amount: 2% base up to 5.5% on 100,000 DC
  const chance = Math.min(0.055, 0.02 + (lostAmount / 100000) * 0.035);
  if (Math.random() > chance) return null;

  const roll = Math.random();
  if (roll < 0.27) {
    return { potion: true };
  } else if (roll < 0.60) {
    return { saveToken: true };
  } else if (roll < 0.92) {
    return { zeus: true };
  } else {
    // 8% -> Grappling Hook (самый редкий расходник)
    return { hook: true };
  }
}
