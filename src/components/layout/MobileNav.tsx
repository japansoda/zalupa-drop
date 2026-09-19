'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Zap, FileText, Briefcase, Plus } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../lib/sound';
import { useLanguage } from '../../lib/i18n';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { inventory, setRefillOpen } = useGameStore();
  const { t } = useLanguage();

  const navItems = [
    { href: '/', label: t('nav.cases') || 'Кейсы', icon: Box },
    { href: '/upgrader', label: t('nav.upgrader') || 'Апгрейд', icon: Zap },
    { href: '/contract', label: t('nav.contract') || 'Контракт', icon: FileText },
    { href: '/inventory', label: t('nav.inventory') || 'Инвентарь', icon: Briefcase, count: inventory.length },
  ];

  return (
    <nav 
      aria-label="Мобильная навигация"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#08080a]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-[calc(env(safe-area-inset-bottom,0px)+6px)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => sound.playClick()}
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl transition-all cursor-pointer select-none active:scale-90 ${
              isActive
                ? 'text-yellow-400 font-black'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <div className="relative flex items-center justify-center mb-1">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-yellow-400' : 'text-white/60'}`} />
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-yellow-400 text-black text-[9px] font-black flex items-center justify-center shadow-sm">
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight leading-none truncate max-w-[65px]">
              {item.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-yellow-400 mt-1 shadow-[0_0_6px_#facc15]" />
            )}
          </Link>
        );
      })}

      {/* Quick Deposit Action */}
      <button
        type="button"
        onClick={() => {
          sound.playClick();
          setRefillOpen(true);
        }}
        className="flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl text-emerald-400 font-bold active:scale-90 transition-all cursor-pointer"
      >
        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <Plus className="w-4 h-4 text-emerald-300 stroke-[3]" />
        </div>
        <span className="text-[10px] text-emerald-300 tracking-tight leading-none">
          {t('nav.topup') || 'Пополнить'}
        </span>
      </button>
    </nav>
  );
};
