'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX, Plus, Briefcase, Zap, Flame, Box } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { DropCoinIcon } from '../ui/DropCoinIcon';
import { LogoSvg } from '../ui/LogoSvg';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { balance, inventory, soundEnabled, toggleSound, setRefillOpen } = useGameStore();
  const { locale, setLocale, t } = useLanguage();

  const navLinks = [
    { href: '/', label: t('nav.cases'), icon: Box },
    { href: '/upgrader', label: t('nav.upgrader'), icon: Zap },
    { href: '/crash', label: t('nav.crash'), icon: Flame },
    { href: '/inventory', label: t('nav.inventory'), icon: Briefcase, count: inventory.length },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-[#08080a]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-22 flex items-center justify-between gap-4">
        {/* Big SVG Logo */}
        <Link 
          href="/" 
          onClick={() => sound.playClick()}
          className="flex items-center group py-1"
          title="ZALUPA DROP — Главная"
        >
          <LogoSvg 
            size="md" 
            className="h-12 sm:h-14 w-auto group-hover:scale-105 transition-transform duration-200" 
          />
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => sound.playClick()}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.35)]'
                    : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-yellow-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`ml-1 text-[11px] font-black px-1.5 py-0.5 rounded-full ${
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
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setLocale(locale === 'ru' ? 'en' : 'ru');
            }}
            title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            className="px-2.5 h-10 rounded-xl glass-button flex items-center justify-center font-mono font-black text-xs text-white/80 hover:text-yellow-400 cursor-pointer transition-colors"
          >
            {locale === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? t('sound.disable') : t('sound.enable')}
            className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-white/70 hover:text-yellow-400 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          </button>

          {/* Balance Widget */}
          <div className="flex items-center glass-panel rounded-xl pl-3.5 pr-1.5 py-1.5 border border-white/10 gap-3">
            <div className="flex items-center gap-1.5">
              <DropCoinIcon size={20} />
              <div className="flex flex-col text-right leading-none">
                <span className="font-mono font-black text-sm sm:text-base text-white tracking-tight">
                  {balance.toLocaleString('ru-RU')}
                </span>
                <span className="text-[9px] font-extrabold text-yellow-400 uppercase tracking-wider">
                  DropCoin
                </span>
              </div>
            </div>

            {/* Free Demo Refill Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setRefillOpen(true);
              }}
              title={t('nav.topup.title')}
              className="px-3 py-1.5 rounded-lg btn-yellow text-xs font-black flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">{t('nav.topup')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 bg-black/60 py-2 px-2">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sound.playClick()}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                isActive ? 'text-yellow-400' : 'text-white/50'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-yellow-400 text-black text-[9px] flex items-center justify-center font-black">
                    {item.count}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
