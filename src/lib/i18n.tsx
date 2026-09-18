'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Locale = 'ru' | 'en';

// ─── TRANSLATION DICTIONARY ─────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  ru: {
    // Nav
    'nav.cases': 'Кейсы',
    'nav.upgrader': 'Апгрейдер',
    'nav.crash': 'Краш',
    'nav.inventory': 'Инвентарь',
    'nav.topup': 'Пополнить',
    'nav.topup.title': 'Бесплатно пополнить виртуальный баланс',
    'sound.enable': 'Включить звук',
    'sound.disable': 'Выключить звук',

    // Home
    'home.title': 'КЕЙСЫ CS2',
    'home.subtitle': 'Открывай кейсы, собирай лучшие скины!',
    'home.search': 'Поиск кейсов...',
    'home.sort': 'Сортировка',
    'home.sort.priceAsc': 'По цене ↑',
    'home.sort.priceDesc': 'По цене ↓',
    'home.sort.popular': 'По популярности',
    'home.all': 'Все',
    'home.filters': 'Фильтры',
    'home.open': 'Открыть',
    'home.items': 'предметов',

    // Case
    'case.opening': 'Открытие кейса',
    'case.contents': 'Содержимое кейса',
    'case.openFor': 'Открыть за',
    'case.yourDrop': 'Ваш дроп!',
    'case.claim': 'Забрать',
    'case.sellFor': 'Продать за',
    'case.tryAgain': 'Ещё раз',
    'case.back': 'Назад к кейсам',

    // Upgrader
    'upg.skins': 'СКИНЫ',
    'upg.balance': 'БАЛАНС',
    'upg.tokens': 'ТОКЕНЫ',
    'upg.chance': 'Шанс',
    'upg.yourBet': 'Ваша ставка',
    'upg.target': 'Цель апгрейда',
    'upg.upgrade': 'АПГРЕЙД!',
    'upg.win': 'ПОБЕДА!',
    'upg.lose': 'ПРОИГРЫШ!',
    'upg.selectItem': 'Выберите предмет из инвентаря',
    'upg.search': 'Поиск по скинам CS2...',
    'upg.catalog': 'Каталог предметов',
    'upg.chooseTarget': 'Выберите цель',
    'upg.consolation': 'Утешительный приз',
    'upg.skip': 'Пропустить',
    'upg.claim': 'Забрать',
    'upg.freeToken': 'Бесплатный токен',
    'upg.noSkins': 'Нет скинов дороже текущей ставки. Уменьшите ставку!',
    'upg.showing': 'Показано',
    'upg.of': 'из',
    'upg.scrollMore': 'Скролл для загрузки...',
    'upg.clearAll': 'Очистить все',
    'upg.maxBet': 'Макс. ставка',
    'upg.selectSkin': 'Выберите скин',
    'upg.multiplier': 'Множитель',
    // Risk labels
    'risk.veryHigh': 'Очень высокий шанс',
    'risk.high': 'Высокий шанс',
    'risk.medium': 'Средний шанс',
    'risk.risky': 'Рискованный шанс',
    'risk.low': 'Низкий шанс',
    'risk.extreme': 'Экстремальный шанс',
    // Item types
    'type.all': 'Все типы',
    'type.knives': '★ Ножи',
    'type.gloves': '★ Перчатки',
    'type.snipers': 'Снайперские',
    'type.rifles': 'Винтовки',
    'type.pistols': 'Пистолеты',
    'type.smgs': 'ПП',
    'type.heavy': 'Тяжелое',
    'type.stickers': 'Наклейки',
    'type.agents': 'Агенты',
    'type.charms': 'Брелоки',

    // Inventory
    'inv.title': 'Мой инвентарь',
    'inv.items': 'Предметы',
    'inv.totalValue': 'Общая стоимость',
    'inv.sellAll': 'Продать все',
    'inv.sell': 'Продать',
    'inv.empty': 'Инвентарь пуст',
    'inv.search': 'Поиск...',
    'inv.emptyHint': 'Откройте кейсы или выиграйте в апгрейдере, чтобы получить скины!',

    // Crash
    'crash.title': 'КРАШ',
    'crash.bet': 'Ставка',
    'crash.multiplier': 'Множитель',
    'crash.autoCashout': 'Авто-кешаут',
    'crash.placeBet': 'Поставить',
    'crash.cashout': 'Забрать',
    'crash.waiting': 'Ожидание...',
    'crash.crashed': 'КРАШ!',
    'crash.history': 'История',

    // Refill
    'refill.title': 'Пополнение баланса',
    'refill.demo': 'Это демо-режим',
    'refill.demoDesc': 'Все монеты виртуальные и не имеют реальной стоимости',
    'refill.topup': 'Пополнить',
    'refill.close': 'Закрыть',

    // LiveDrop
    'live.drops': 'Прямые дропы',

    // Common
    'common.close': 'Закрыть',
    'common.cancel': 'Отмена',
    'common.confirm': 'Подтвердить',
    'common.loading': 'Загрузка...',

    // Token names
    'token.consumer': 'Ширпотреб Токен',
    'token.industrial': 'Промышленный Токен',
    'token.milspec': 'Армейский Токен',
    'token.restricted': 'Запрещенный Токен',
    'token.classified': 'Засекреченный Токен',
    'token.covert': '★ Тайный Токен',
    'token.gold': '★ Золотой Токен',
  },

  en: {
    // Nav
    'nav.cases': 'Cases',
    'nav.upgrader': 'Upgrader',
    'nav.crash': 'Crash',
    'nav.inventory': 'Inventory',
    'nav.topup': 'Top Up',
    'nav.topup.title': 'Free virtual balance top up',
    'sound.enable': 'Enable sound',
    'sound.disable': 'Disable sound',

    // Home
    'home.title': 'CS2 CASES',
    'home.subtitle': 'Open cases, collect the best skins!',
    'home.search': 'Search cases...',
    'home.sort': 'Sort',
    'home.sort.priceAsc': 'Price ↑',
    'home.sort.priceDesc': 'Price ↓',
    'home.sort.popular': 'By popularity',
    'home.all': 'All',
    'home.filters': 'Filters',
    'home.open': 'Open',
    'home.items': 'items',

    // Case
    'case.opening': 'Opening case',
    'case.contents': 'Case contents',
    'case.openFor': 'Open for',
    'case.yourDrop': 'Your drop!',
    'case.claim': 'Claim',
    'case.sellFor': 'Sell for',
    'case.tryAgain': 'Try again',
    'case.back': 'Back to cases',

    // Upgrader
    'upg.skins': 'SKINS',
    'upg.balance': 'BALANCE',
    'upg.tokens': 'TOKENS',
    'upg.chance': 'Chance',
    'upg.yourBet': 'Your bet',
    'upg.target': 'Upgrade target',
    'upg.upgrade': 'UPGRADE!',
    'upg.win': 'WIN!',
    'upg.lose': 'LOSS!',
    'upg.selectItem': 'Select item from inventory',
    'upg.search': 'Search CS2 skins...',
    'upg.catalog': 'Item catalog',
    'upg.chooseTarget': 'Choose target',
    'upg.consolation': 'Consolation prize',
    'upg.skip': 'Skip',
    'upg.claim': 'Claim',
    'upg.freeToken': 'Free token',
    'upg.noSkins': 'No skins above current bet. Lower your bet!',
    'upg.showing': 'Showing',
    'upg.of': 'of',
    'upg.scrollMore': 'Scroll to load more...',
    'upg.clearAll': 'Clear all',
    'upg.maxBet': 'Max bet',
    'upg.selectSkin': 'Select skin',
    'upg.multiplier': 'Multiplier',
    // Risk labels
    'risk.veryHigh': 'Very high chance',
    'risk.high': 'High chance',
    'risk.medium': 'Medium chance',
    'risk.risky': 'Risky',
    'risk.low': 'Low chance',
    'risk.extreme': 'Extreme risk',
    // Item types
    'type.all': 'All types',
    'type.knives': '★ Knives',
    'type.gloves': '★ Gloves',
    'type.snipers': 'Snipers',
    'type.rifles': 'Rifles',
    'type.pistols': 'Pistols',
    'type.smgs': 'SMGs',
    'type.heavy': 'Heavy',
    'type.stickers': 'Stickers',
    'type.agents': 'Agents',
    'type.charms': 'Charms',

    // Inventory
    'inv.title': 'My Inventory',
    'inv.items': 'Items',
    'inv.totalValue': 'Total value',
    'inv.sellAll': 'Sell all',
    'inv.sell': 'Sell',
    'inv.empty': 'Inventory empty',
    'inv.search': 'Search...',
    'inv.emptyHint': 'Open cases or win in the upgrader to get skins!',

    // Crash
    'crash.title': 'CRASH',
    'crash.bet': 'Bet',
    'crash.multiplier': 'Multiplier',
    'crash.autoCashout': 'Auto cashout',
    'crash.placeBet': 'Place bet',
    'crash.cashout': 'Cash out',
    'crash.waiting': 'Waiting...',
    'crash.crashed': 'CRASHED!',
    'crash.history': 'History',

    // Refill
    'refill.title': 'Balance Top Up',
    'refill.demo': 'This is demo mode',
    'refill.demoDesc': 'All coins are virtual and have no real value',
    'refill.topup': 'Top Up',
    'refill.close': 'Close',

    // LiveDrop
    'live.drops': 'Live drops',

    // Common
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',

    // Token names
    'token.consumer': 'Consumer Token',
    'token.industrial': 'Industrial Token',
    'token.milspec': 'Mil-Spec Token',
    'token.restricted': 'Restricted Token',
    'token.classified': 'Classified Token',
    'token.covert': '★ Covert Token',
    'token.gold': '★ Gold Token',
  },
};

// ─── CONTEXT ─────────────────────────────────────────────────────────

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'ru',
  setLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = 'zalupa-drop-lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'ru' || stored === 'en')) {
      setLocaleState(stored);
      return;
    }
    // Auto-detect from browser
    const browserLang = navigator.language || (navigator as any).userLanguage || 'ru';
    if (browserLang.startsWith('en')) {
      setLocaleState('en');
      localStorage.setItem(STORAGE_KEY, 'en');
    } else {
      localStorage.setItem(STORAGE_KEY, 'ru');
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] || translations.ru[key] || key;
    },
    [locale]
  );

  return (
    <LanguageContext value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext>
  );
};

export const useLanguage = () => useContext(LanguageContext);
