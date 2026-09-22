'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX, Plus, Briefcase, Zap, FileText, Box } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { LogoSvg } from '../ui/LogoSvg';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { balance, inventory, soundEnabled, toggleSound, setRefillOpen, potionsCount, activePotionCharges, drinkPotion, saveTokensCount, zeusCount } = useGameStore();
  const { locale, setLocale, t } = useLanguage();

  const navLinks = [
    { href: '/', label: t('nav.cases'), icon: Box },
    { href: '/upgrader', label: t('nav.upgrader'), icon: Zap },
    { href: '/contract', label: t('nav.contract'), icon: FileText },
    { href: '/inventory', label: t('nav.inventory'), icon: Briefcase, count: inventory.length },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-[#08080a]/95 max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 sm:h-15 flex items-center justify-between gap-2 sm:gap-4">
        {/* Sleek SVG Logo */}
        <Link 
          href="/" 
          onClick={() => sound.playClick()}
          className="flex items-center group py-0.5 shrink-0"
          title={locale === 'ru' ? 'ZALUPA DROP — Главная' : 'ZALUPA DROP — Home'}
        >
          <LogoSvg 
            size="md" 
            className="h-8 sm:h-10 w-auto group-hover:scale-105 transition-transform duration-200" 
          />
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => sound.playClick()}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                    : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-yellow-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`ml-1 text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black text-yellow-400' : 'bg-yellow-400 text-black'
                  }`}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Controls & Balance */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setLocale(locale === 'ru' ? 'en' : 'ru');
            }}
            title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            className="px-2 h-7.5 sm:h-8.5 rounded-lg glass-button flex items-center justify-center font-mono font-black text-[10px] sm:text-xs text-white/80 hover:text-yellow-400 cursor-pointer transition-colors shrink-0"
          >
            {locale === 'ru' ? 'RU' : 'EN'}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? t('sound.disable') : t('sound.enable')}
            className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-lg glass-button flex items-center justify-center text-white/70 hover:text-yellow-400 cursor-pointer shrink-0"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-yellow-400" /> : <VolumeX className="w-3.5 h-3.5 text-white/30" />}
          </button>

          {/* Universal Luck Potion Status & Quick Drink */}
          {activePotionCharges > 0 ? (
            <div
              className="h-7.5 sm:h-8.5 px-2.5 rounded-lg glass-panel border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5 shrink-0 select-none shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title={locale === 'ru' 
                ? `Зелье удачи активно! Осталось ${activePotionCharges} — работает на кейсы, апгрейдер и контракты` 
                : `Luck Potion active! ${activePotionCharges} left — works on cases, upgrader & contracts`}
            >
              <span className="text-xs">🧪</span>
              <span className="font-mono font-bold text-xs text-emerald-400">{activePotionCharges}</span>
            </div>
          ) : potionsCount > 0 ? (
            <button
              type="button"
              onClick={() => drinkPotion()}
              className="h-7.5 sm:h-8.5 px-2.5 rounded-lg glass-button hover:border-emerald-500/30 text-white/80 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              title={locale === 'ru' 
                ? `Выпить зелье удачи +3 заряда. В наличии: ${potionsCount} шт.` 
                : `Drink Luck Potion +3 charges. In stock: ${potionsCount}`}
            >
              <span className="text-xs">🧪</span>
              <span className="font-mono text-[10px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded font-bold">x{potionsCount}</span>
            </button>
          ) : null}

          {/* Guardian Aegis / Save Token Badge */}
          {saveTokensCount > 0 && (
            <div
              className="h-7.5 sm:h-8.5 px-2 sm:px-2.5 rounded-lg glass-panel border border-yellow-500/30 bg-yellow-500/10 flex items-center gap-1 sm:gap-1.5 shrink-0 select-none shadow-[0_0_10px_rgba(234,179,8,0.2)]"
              title={locale === 'ru' 
                ? `Жетон сохранения: ${saveTokensCount} шт. Защищает 1 скин в апгрейдере от сгорания при неудаче` 
                : `Guardian Aegis: ${saveTokensCount} pcs. Protects 1 skin from burning in upgrader on failure`}
            >
              <span className="text-xs">🪽</span>
              <span className="font-mono font-bold text-xs text-yellow-400">x{saveTokensCount}</span>
            </div>
          )}

          {/* Zeus x27 Tactical Shock Badge */}
          {zeusCount > 0 && (
            <div
              className="h-7.5 sm:h-8.5 px-2 sm:px-2.5 rounded-lg glass-panel border border-sky-500/30 bg-sky-500/10 flex items-center gap-1 sm:gap-1.5 shrink-0 select-none shadow-[0_0_10px_rgba(56,189,248,0.2)]"
              title={locale === 'ru' 
                ? `Zeus x27: ${zeusCount} шт. Стреляет молнией в стрелку апгрейдера: реролл + 5% шанс` 
                : `Zeus x27: ${zeusCount} pcs. Fires lightning at upgrader arrow: reroll + 5% chance`}
            >
              <span className="text-xs">⚡</span>
              <span className="font-mono font-bold text-xs text-sky-400">x{zeusCount}</span>
            </div>
          )}

          {/* Balance Widget: on mobile tapping balance opens refill modal */}
          <div 
            onClick={() => {
              sound.playClick();
              setRefillOpen(true);
            }}
            title={t('nav.topup.title')}
            className="flex items-center glass-panel rounded-lg px-2 sm:pl-3 sm:pr-1.5 py-1 border border-white/10 gap-1.5 sm:gap-2.5 shrink-0 cursor-pointer sm:cursor-default active:scale-95 sm:active:scale-100 transition-all"
          >
            <div className="flex items-center gap-1 sm:gap-1.5">
              <DropCoinIcon size={16} />
              <div className="flex flex-col text-right leading-none">
                <span className="font-mono font-black text-xs sm:text-sm text-white tracking-tight">
                  {balance.toLocaleString('ru-RU')}
                </span>
                <span className="text-[7.5px] sm:text-[8px] font-extrabold text-yellow-400 uppercase tracking-wider hidden xs:inline">
                  DC
                </span>
              </div>
            </div>

            {/* Free Demo Refill Button (Desktop only, hidden on mobile) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                setRefillOpen(true);
              }}
              title={t('nav.topup.title')}
              className="hidden sm:flex px-2.5 py-1 rounded-md btn-yellow text-[11px] font-black items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>{t('nav.topup')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
