import React from 'react';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { LogoSvg } from '../ui/LogoSvg';
import { useLanguage } from '../../lib/i18n';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-white/10 bg-[#08080a] py-8 mt-16 text-white/50 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <LogoSvg size="sm" />
          <p className="max-w-md text-[11px] leading-relaxed text-white/40 mt-1">
            {t('footer.desc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-white/70">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-yellow-400" />
            <span>{t('footer.virtual')}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>{t('footer.fair')}</span>
          </div>
        </div>

        <div className="text-[11px] text-white/40 flex items-center gap-1">
          <span>{t('footer.madeWith')}</span>
          <Heart className="w-3 h-3 text-yellow-400 fill-yellow-400 inline" />
          <span>{t('footer.forFans')}</span>
        </div>
      </div>
    </footer>
  );
};
