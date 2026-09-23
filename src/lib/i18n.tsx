'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Locale = 'ru' | 'en';

// ─── TRANSLATION DICTIONARY ─────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  ru: {
    // Nav
    'nav.cases': 'Кейсы',
    'nav.upgrader': 'Апгрейдер',
    'nav.contract': 'Контракты',
    'nav.crash': 'Краш',
    'nav.inventory': 'Инвентарь',
    'nav.topup': 'Пополнить',
    'nav.topup.title': 'Бесплатно пополнить виртуальный баланс',
    'sound.enable': 'Включить звук',
    'sound.disable': 'Выключить звук',

    // Home
    'home.title': 'КЕЙСЫ CS2',
    'home.subtitle': 'Открывай кейсы, собирай лучшие скины!',
    'home.catalogDesc': 'Официальные и авторские кейсы с 3D моделями и оригинальной физической рулеткой',
    'home.search': 'Поиск по названию или скину...',
    'home.sort': 'Сортировка',
    'home.sort.priceAsc': 'Цена: Дешевле ↑',
    'home.sort.priceDesc': 'Цена: Дороже ↓',
    'home.sort.popular': 'По популярности',
    'home.sort.alpha': 'По алфавиту (А-Я)',
    'home.all': 'Все',
    'home.filters': 'Фильтры',
    'home.open': 'Открыть',
    'home.items': 'предметов',
    'home.cat.all': 'Все',
    'home.cat.custom': 'Кастомные',
    'home.cat.official': 'Официальные CS2',
    'home.cat.knives': 'Ножи и Перчатки',
    'home.cat.budget': 'Бюджетные',
    'home.cat.highroller': 'Мажор',
    'home.cat.weapons': 'Оружие',
    'home.cat.stickers': 'Наклейки и Агенты',
    'home.empty': 'Ничего не найдено',
    'home.emptyDesc': 'По вашему запросу кейсы не найдены',
    'home.reset': 'Сбросить фильтры',
    'home.loadMore': 'Загрузить еще',
    'home.showing': 'Показано',
    'home.of': 'из',

    // Case
    'case.opening': 'Открытие кейса',
    'case.contents': 'Содержимое кейса',
    'case.openFor': 'Открыть за',
    'case.yourDrop': 'Ваш дроп!',
    'case.claim': 'Забрать',
    'case.sellFor': 'Продать за',
    'case.tryAgain': 'Ещё раз',
    'case.back': 'Назад ко всем кейсам',
    'case.notFound': 'Кейс не найден',
    'case.backHome': 'Вернуться на главную',
    'case.openCost': 'Цена открытия:',
    'case.fairOdds': 'Вероятности соответствуют стандартам CS2',
    'case.fastOpen': 'Быстрое открытие',
    'case.count': 'Количество:',
    'case.openingAction': 'Открываем...',

    // Upgrader
    'upg.skins': 'СКИНЫ',
    'upg.balance': 'БАЛАНС',
    'upg.tokens': 'ТОКЕНЫ',
    'upg.tab.skins': 'СКИHЫ',
    'upg.tab.balance': 'БАЛАНС',
    'upg.tab.consumables': 'РАСХОДНИКИ',
    'upg.chance': 'Шанс',
    'upg.yourBet': 'Ваша ставка',
    'upg.target': 'Цель апгрейда',
    'upg.targetItem': 'Целевой предмет',
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
    'cashback.badgeToken': 'Утешительный приз: Токен апгрейдера',
    'cashback.badgePotion': 'Утешительный приз: Зелье удачи',
    'cashback.badgeCase': 'Утешительный приз: Кешбэк',
    'cashback.spinningCase': 'Крутим кейс',
    'cashback.lostSub': 'Кешбэк за проигрыш ставки',
    'cashback.claimToken': 'Забрать токен в расходники',
    'cashback.claimPotion': 'Забрать зелье в расходники',
    'cashback.claimSkin': 'Забрать в инвентарь',
    'cashback.skip': 'Пропустить ⏭',
    'cashback.maxTarget': 'Макс. цель: до',
    'upg.noSkins': 'Нет скинов дороже текущей ставки. Уменьшите ставку!',
    'upg.showing': 'Показано',
    'upg.of': 'из',
    'upg.scrollMore': 'Скролл для загрузки...',
    'upg.clearAll': 'Очистить все',
    'upg.maxBet': 'Макс. ставка',
    'upg.selectSkin': 'Выберите скин',
    'upg.multiplier': 'Множитель',
    'upg.reset': 'Сбросить',
    'upg.selectUpTo5': 'Выберите до 5 скинов',
    'upg.inInventoryBelow': 'в инвентаре внизу',
    'upg.slot': 'Слот',
    'upg.presetsTitle': 'Шанс',
    'upg.multipliersTitle': 'Множитель',
    'upg.betSum': 'Сумма ставки:',
    'upg.potionTitle': 'Зелье удачи',
    'upg.contraband': 'Контрабанда',
    'upg.potionActive': '+15% шанс активно',
    'upg.potionCharges': 'прокрута',
    'upg.drinkPotion': 'Выпить (+15% на 3 прокрута)',
    'upg.noPotions': 'Нет в запасе (дроп с кейсов)',
    'upg.myTokens': 'Мои токены:',
    'upg.targetUpTo': 'Цель до',
    'upg.noTokensOwned': 'У вас нет токенов. Выбивайте их из кейсов или как утешительный приз!',
    'upg.dcBet': 'Ставка с баланса DC:',
    'upg.spinning': 'Крутим...',
    'upg.selectSkinsBtn': 'Выберите скины',
    'upg.selectTokenBtn': 'Выберите токен',
    'upg.selectTargetBtn': 'Выберите цель',
    'upg.upgradeBtn': 'Улучшить »',
    'upg.winChance': 'Шанс на успех',
    'upg.fastChances': 'Быстрые шансы',
    'upg.myInventory': 'Мой инвентарь',
    'upg.searchMy': 'Поиск по моим скинам...',
    'upg.targetCatalog': 'Каталог для апгрейда',
    'upg.searchCatalog': 'Поиск по каталогу скинов...',
    'upg.potionBadge': '+15% Зелье',
    'upg.potionSaved': 'Зелье сохранено',
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
    'inv.title': 'Ваш Инвентарь',
    'inv.subtitle': 'Все выбитые скины с продажей за DropCoins и ссылками в Steam',
    'inv.items': 'предметов',
    'inv.totalValue': 'Стоимость инвентаря:',
    'inv.sellAll': 'Продать всё',
    'inv.sell': 'Продать за',
    'inv.empty': 'Инвентарь пуст',
    'inv.search': 'Поиск...',
    'inv.emptyHint': 'У вас пока нет выбитых скинов. Откройте пару кейсов, чтобы пополнить инвентарь!',
    'inv.emptyFilter': 'По выбранному фильтру предметов не найдено.',
    'inv.openCases': 'Открыть кейсы',
    'inv.tab.all': 'Все предметы',
    'inv.tab.gold': '★ Ножи',
    'inv.tab.covert': 'Тайное',
    'inv.tab.classified': 'Засекреченное',
    'inv.tab.restricted': 'Запрещенное',
    'inv.tab.milspec': 'Армейское',

    // Contract
    'contract.title': 'Контракт обмена CS2',
    'contract.subtitle': 'Положи от 3 до 10 скинов и подпиши контракт на новый предмет',
    'contract.sign': 'ПОДПИСАТЬ КОНТРАКТ',
    'contract.signing': 'ПОДПИСАНИЕ...',
    'contract.totalValue': 'Стоимость контракта',
    'contract.expectedRtp': 'Ориентировочная ценность',
    'contract.fillCheapest': 'Заполнить дешевыми',
    'contract.clear': 'Очистить',
    'contract.slots': 'Слоты контракта',
    'contract.emptySlot': 'Пустой слот',
    'contract.noItems': 'В инвентаре нет предметов. Откройте пару кейсов!',
    'contract.needMin': 'Добавьте минимум 3 скина для подписания',
    'contract.won': 'Получен предмет по контракту!',
    'contract.toInventory': 'В инвентарь',
    'contract.sell': 'Продать за',
    'contract.potential': 'Диапазон выигрыша',

    // Crash (legacy)
    'crash.title': 'Краш',
    'crash.subtitle': 'Успей забрать виртуальные DC до того, как множитель крашнется',
    'crash.bet': 'Размер ставки:',
    'crash.multiplier': 'Множитель',
    'crash.autoCashout': 'Авто-кешаут',
    'crash.placeBet': 'ПОСТАВИТЬ',
    'crash.cashout': 'ЗАБРАТЬ',
    'crash.waiting': 'Ожидание...',
    'crash.crashed': 'Взрыв на',
    'crash.cashedOut': 'Вы забрали',
    'crash.history': 'История:',

    // Refill
    'refill.title': 'Демо-Пополнение',
    'refill.subtitle': 'Бесплатное восстановление валюты DropCoin (DC)',
    'refill.currentBalance': 'Текущий баланс:',
    'refill.warmup': 'Для разогрева',
    'refill.standard': 'Стандартный пак',
    'refill.highroller': 'Хайроллер',
    'refill.unlimited': 'Безлимит кейсов',
    'refill.bonusTitle': 'Бесплатные расходники',
    'refill.potionsBtn': '+3 Зелья удачи',
    'refill.potionsDesc': '+15% шанс на 3 прокрута',
    'refill.tokensBtn': 'Набор токенов (+1 каждый)',
    'refill.tokensDesc': '7 токенов всех редкостей',
    'refill.disclaimer': 'Это симулятор в целях развлечения и портфолио. Валюта DropCoin (DC) не имеет реальной ценности, не подлежит покупке за рубли/доллары и выводу.',

    // Drop Modal
    'drop.multiTitle': 'ВЫ ВЫБИЛИ {count} ПРЕДМЕТА!',
    'drop.singleTitle': 'ВЫ ВЫБИЛИ ПРЕДМЕТ!',
    'drop.bonusTitle': 'БОНУСНЫЙ ДРОП РАСХОДНИКОВ!',
    'drop.keepBtn': 'Забрать в инвентарь',
    'drop.sellBtn': 'Продать за',

    // LiveDrop
    'live.drops': 'LIVE ДРОПЫ',

    // Footer
    'footer.desc': 'Веб-симулятор кейсов и скинов CS2. Создан в демонстрационных целях (пет-проект). Все права на скины и изображения принадлежат Valve Corporation.',
    'footer.virtual': '100% Виртуальная валюта DC',
    'footer.fair': 'Честный симулятор (RTP 95%)',
    'footer.madeWith': 'Сделано с',
    'footer.forFans': 'для фанатов CS2',

    // Common
    'common.close': 'Закрыть',
    'common.cancel': 'Отмена',
    'common.confirm': 'Подтвердить',
    'common.loading': 'Загрузка...',

    // Rarity
    'rarity.consumer': 'Ширпотреб',
    'rarity.industrial': 'Промышленное',
    'rarity.milspec': 'Армейское',
    'rarity.restricted': 'Запрещенное',
    'rarity.classified': 'Засекреченное',
    'rarity.covert': '★ Тайное',
    'rarity.extraordinary': '★ Экстраординарное',
    'rarity.gold': '★ Редкий особый',
    'rarity.contraband': 'Контрабанда',

    // Wear
    'wear.FN': 'Прямо с завода',
    'wear.MW': 'Немного поношенное',
    'wear.FT': 'После полевых испытаний',
    'wear.WW': 'Поношенное',
    'wear.BS': 'Закаленное в боях',

    // Upgrader page
    'upg.pageTitle': 'Апгрейдер',
    'upg.pageSubtitle': 'Улучшай свои скины в топовые ножи и редкие скины CS2',

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
    'nav.contract': 'Contracts',
    'nav.crash': 'Crash',
    'nav.inventory': 'Inventory',
    'nav.topup': 'Top Up',
    'nav.topup.title': 'Free virtual balance top up',
    'sound.enable': 'Enable sound',
    'sound.disable': 'Disable sound',

    // Home
    'home.title': 'CS2 CASES',
    'home.subtitle': 'Open cases, collect the best skins!',
    'home.catalogDesc': 'Official and custom cases with 3D models and authentic roulette physics',
    'home.search': 'Search by name or skin...',
    'home.sort': 'Sort',
    'home.sort.priceAsc': 'Price: Low to High ↑',
    'home.sort.priceDesc': 'Price: High to Low ↓',
    'home.sort.popular': 'By popularity',
    'home.sort.alpha': 'Alphabetical (A-Z)',
    'home.all': 'All',
    'home.filters': 'Filters',
    'home.open': 'Open',
    'home.items': 'items',
    'home.cat.all': 'All',
    'home.cat.custom': 'Custom',
    'home.cat.official': 'Official CS2',
    'home.cat.knives': 'Knives & Gloves',
    'home.cat.budget': 'Budget',
    'home.cat.highroller': 'Highroller',
    'home.cat.weapons': 'Weapons',
    'home.cat.stickers': 'Stickers & Agents',
    'home.empty': 'Nothing found',
    'home.emptyDesc': 'No cases matched your search query',
    'home.reset': 'Reset filters',
    'home.loadMore': 'Load more',
    'home.showing': 'Showing',
    'home.of': 'of',

    // Case
    'case.opening': 'Opening case',
    'case.contents': 'Case contents',
    'case.openFor': 'Open for',
    'case.yourDrop': 'Your drop!',
    'case.claim': 'Claim',
    'case.sellFor': 'Sell for',
    'case.tryAgain': 'Try again',
    'case.back': 'Back to all cases',
    'case.notFound': 'Case not found',
    'case.backHome': 'Return to home',
    'case.openCost': 'Opening price:',
    'case.fairOdds': 'Probabilities match CS2 standards',
    'case.fastOpen': 'Fast open',
    'case.count': 'Quantity:',
    'case.openingAction': 'Opening...',

    // Upgrader
    'upg.skins': 'SKINS',
    'upg.balance': 'BALANCE',
    'upg.tokens': 'TOKENS',
    'upg.tab.skins': 'SKINS',
    'upg.tab.balance': 'BALANCE',
    'upg.tab.consumables': 'CONSUMABLES',
    'upg.chance': 'Chance',
    'upg.yourBet': 'Your bet',
    'upg.target': 'Upgrade target',
    'upg.targetItem': 'Target item',
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
    'cashback.badgeToken': 'Consolation Prize: Upgrade Token',
    'cashback.badgePotion': 'Consolation Prize: Luck Potion',
    'cashback.badgeCase': 'Consolation Prize: Cashback',
    'cashback.spinningCase': 'Spinning case',
    'cashback.lostSub': 'Cashback for lost bet of',
    'cashback.claimToken': 'Claim token to consumables',
    'cashback.claimPotion': 'Claim potion to consumables',
    'cashback.claimSkin': 'Claim to inventory',
    'cashback.skip': 'Skip ⏭',
    'cashback.maxTarget': 'Max target: up to',
    'upg.noSkins': 'No skins above current bet. Lower your bet!',
    'upg.showing': 'Showing',
    'upg.of': 'of',
    'upg.scrollMore': 'Scroll to load more...',
    'upg.clearAll': 'Clear all',
    'upg.maxBet': 'Max bet',
    'upg.selectSkin': 'Select skin',
    'upg.multiplier': 'Multiplier',
    'upg.reset': 'Reset',
    'upg.selectUpTo5': 'Select up to 5 skins',
    'upg.inInventoryBelow': 'in inventory below',
    'upg.slot': 'Slot',
    'upg.presetsTitle': 'Chance',
    'upg.multipliersTitle': 'Multiplier',
    'upg.betSum': 'Total bet:',
    'upg.potionTitle': 'Luck Potion',
    'upg.contraband': 'Contraband',
    'upg.potionActive': '+15% chance active',
    'upg.potionCharges': 'spins',
    'upg.drinkPotion': 'Drink (+15% for 3 spins)',
    'upg.noPotions': 'Out of stock (case drop)',
    'upg.myTokens': 'My tokens:',
    'upg.targetUpTo': 'Target up to',
    'upg.noTokensOwned': 'You have no tokens. Win them from cases or as a consolation prize!',
    'upg.dcBet': 'Bet from DC balance:',
    'upg.spinning': 'Spinning...',
    'upg.selectSkinsBtn': 'Select skins',
    'upg.selectTokenBtn': 'Select token',
    'upg.selectTargetBtn': 'Select target',
    'upg.upgradeBtn': 'Upgrade »',
    'upg.winChance': 'Success chance',
    'upg.fastChances': 'Quick chances',
    'upg.myInventory': 'My inventory',
    'upg.searchMy': 'Search my skins...',
    'upg.targetCatalog': 'Upgrade catalog',
    'upg.searchCatalog': 'Search skin catalog...',
    'upg.potionBadge': '+15% Potion',
    'upg.potionSaved': 'Potion saved',
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
    'inv.title': 'Your Inventory',
    'inv.subtitle': 'All dropped skins with DC selling and Steam market links',
    'inv.items': 'items',
    'inv.totalValue': 'Inventory value:',
    'inv.sellAll': 'Sell all',
    'inv.sell': 'Sell for',
    'inv.empty': 'Inventory empty',
    'inv.search': 'Search...',
    'inv.emptyHint': 'You do not have any skins yet. Open some cases to fill your inventory!',
    'inv.emptyFilter': 'No items found for the selected filter.',
    'inv.openCases': 'Open cases',
    'inv.tab.all': 'All items',
    'inv.tab.gold': '★ Knives',
    'inv.tab.covert': 'Covert',
    'inv.tab.classified': 'Classified',
    'inv.tab.restricted': 'Restricted',
    'inv.tab.milspec': 'Mil-Spec',

    // Contract
    'contract.title': 'CS2 Trade-Up Contract',
    'contract.subtitle': 'Deposit 3 to 10 skins and sign the contract for a new weapon',
    'contract.sign': 'SIGN CONTRACT',
    'contract.signing': 'SIGNING...',
    'contract.totalValue': 'Contract Value',
    'contract.expectedRtp': 'Estimated Return',
    'contract.fillCheapest': 'Fill Cheapest',
    'contract.clear': 'Clear',
    'contract.slots': 'Contract Slots',
    'contract.emptySlot': 'Empty Slot',
    'contract.noItems': 'No skins in inventory. Open a few cases!',
    'contract.needMin': 'Add at least 3 skins to sign',
    'contract.won': 'Contract item acquired!',
    'contract.toInventory': 'To Inventory',
    'contract.sell': 'Sell for',
    'contract.potential': 'Outcome Range',

    // Crash (legacy)
    'crash.title': 'Crash',
    'crash.subtitle': 'Cash out virtual DC before the multiplier crashes',
    'crash.bet': 'Bet amount:',
    'crash.multiplier': 'Multiplier',
    'crash.autoCashout': 'Auto cashout',
    'crash.placeBet': 'PLACE BET',
    'crash.cashout': 'CASHOUT',
    'crash.waiting': 'Waiting...',
    'crash.crashed': 'Explosion at',
    'crash.cashedOut': 'You cashed out',
    'crash.history': 'History:',

    // Refill
    'refill.title': 'Demo Top Up',
    'refill.subtitle': 'Free DropCoin (DC) virtual currency refill',
    'refill.currentBalance': 'Current balance:',
    'refill.warmup': 'Warm up',
    'refill.standard': 'Standard pack',
    'refill.highroller': 'Highroller',
    'refill.unlimited': 'Unlimited cases',
    'refill.bonusTitle': 'Free Consumables',
    'refill.potionsBtn': '+3 Luck Potions',
    'refill.potionsDesc': '+15% chance for 3 spins',
    'refill.tokensBtn': 'Token Pack (+1 each tier)',
    'refill.tokensDesc': '7 tokens of all rarities',
    'refill.disclaimer': 'This is a simulator for entertainment and portfolio purposes. DropCoin (DC) has no real value and cannot be bought or withdrawn for real money.',

    // Drop Modal
    'drop.multiTitle': 'YOU WON {count} ITEMS!',
    'drop.singleTitle': 'YOU WON AN ITEM!',
    'drop.bonusTitle': 'BONUS CONSUMABLES DROP!',
    'drop.keepBtn': 'Claim to inventory',
    'drop.sellBtn': 'Sell for',

    // LiveDrop
    'live.drops': 'LIVE DROPS',

    // Footer
    'footer.desc': 'Web simulator of CS2 cases and skins. Created for demo purposes (pet project). All rights to skins and images belong to Valve Corporation.',
    'footer.virtual': '100% Virtual DC Currency',
    'footer.fair': 'Fair Simulator (RTP 95%)',
    'footer.madeWith': 'Made with',
    'footer.forFans': 'for CS2 fans',

    // Common
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',

    // Rarity
    'rarity.consumer': 'Consumer Grade',
    'rarity.industrial': 'Industrial Grade',
    'rarity.milspec': 'Mil-Spec',
    'rarity.restricted': 'Restricted',
    'rarity.classified': 'Classified',
    'rarity.covert': '★ Covert',
    'rarity.extraordinary': '★ Extraordinary',
    'rarity.gold': '★ Rare Special',
    'rarity.contraband': 'Contraband',

    // Wear
    'wear.FN': 'Factory New',
    'wear.MW': 'Minimal Wear',
    'wear.FT': 'Field-Tested',
    'wear.WW': 'Well-Worn',
    'wear.BS': 'Battle-Scarred',

    // Upgrader page
    'upg.pageTitle': 'Upgrader',
    'upg.pageSubtitle': 'Upgrade your skins into top knives and rare CS2 items',

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

export function getCaseName(c?: { name: string; nameEn?: string } | null, locale: Locale = 'ru'): string {
  if (!c) return '';
  if (locale === 'en' && c.nameEn) {
    return c.nameEn;
  }
  return c.name;
}

export function getCaseSubtitle(c?: { subtitle?: string; subtitleEn?: string } | null, locale: Locale = 'ru'): string {
  if (!c) return '';
  if (locale === 'en' && c.subtitleEn) {
    return c.subtitleEn;
  }
  return c.subtitle || '';
}

export function getCaseBadge(badge?: string, badgeEn?: string, locale: Locale = 'ru'): string {
  if (!badge) return '';
  if (locale === 'en') {
    if (badgeEn) return badgeEn;
    const BADGE_MAP: Record<string, string> = {
      'ХИТ': 'HOT',
      'НОВИНКА': 'NEW',
      'ТОП': 'TOP',
      'МАЖОР': 'VIP',
      'ОСОБЫЙ': 'SPECIAL',
      'ХАЛЯВА': 'FREE',
      'РИСК': 'RISK',
      '10% НОЖ': '10% KNIFE',
      '50% ШАНС': '50% CHANCE',
      '100% НОЖ': '100% KNIFE',
    };
    return BADGE_MAP[badge] || badge;
  }
  return badge;
}
