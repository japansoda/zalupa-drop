import React from 'react';
import { Heart } from 'lucide-react';
import { LogoSvg } from '../ui/LogoSvg';
import { useLanguage } from '../../lib/i18n';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

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

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/40">
          <a
            href="https://github.com/japansoda/zalupa-drop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all group"
            title="GitHub Repository — ZALUPA DROP"
          >
            <GithubIcon className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
            <span className="font-semibold">GitHub: japansoda/zalupa-drop</span>
          </a>
          <div className="flex items-center gap-1">
            <span>{t('footer.madeWith')}</span>
            <Heart className="w-3 h-3 text-yellow-400 fill-yellow-400 inline" />
            <span>{t('footer.forFans')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
