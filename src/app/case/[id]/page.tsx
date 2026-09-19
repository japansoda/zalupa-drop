'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { LiveDropBar } from '../../../components/layout/LiveDropBar';
import { RefillModal } from '../../../components/layout/RefillModal';
import { ReelRoulette } from '../../../components/case/ReelRoulette';
import { CaseSkinGroupCard } from '../../../components/case/CaseSkinGroupCard';
import { DropCoinIcon } from '../../../components/ui/DropCoinIcon';
import { CASES_DATABASE } from '../../../data/cases';
import { sound } from '../../../lib/sound';
import { useLanguage } from '../../../lib/i18n';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { CaseSpecialItemCard } from '../../../components/case/CaseSpecialItemCard';
import { isOfficialCase, isKnifeOrGlove } from '../../../lib/caseSpecials';

export default function CaseOpenPage() {
  const params = useParams();
  const caseId = params?.id as string;
  const { t, locale } = useLanguage();

  const currentCase = CASES_DATABASE.find((c) => c.id === caseId);

  const isOfficial = Boolean(currentCase && isOfficialCase(currentCase.id, currentCase.category));

  const groupedSkins = React.useMemo(() => {
    if (!currentCase?.skins) return [];
    // For official cases: knives are unified into the special item card
    const sourceSkins = isOfficial
      ? currentCase.skins.filter((s) => !isKnifeOrGlove(s))
      : currentCase.skins;

    const map = new Map<string, typeof currentCase.skins>();
    for (const skin of sourceSkins) {
      const key = `${skin.weapon || ''}___${skin.skinName || skin.name}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(skin);
    }
    return Array.from(map.values());
  }, [currentCase, isOfficial]);

  if (!currentCase) {
    return (
      <main className="min-h-screen flex flex-col justify-between bg-[#08080a]">
        <Header />
        <div className="max-w-md mx-auto text-center py-24">
          <h2 className="text-2xl font-bold text-white mb-4">{t('case.notFound')}</h2>
          <Link href="/" className="px-6 py-3 rounded-xl btn-yellow text-black font-bold">
            {t('case.backHome')}
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] max-w-full overflow-x-hidden">
      <div>
        <Header />
        <LiveDropBar />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-yellow-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('case.back')}</span>
          </Link>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3 sm:gap-4 text-left w-full sm:w-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/60 border border-white/10 p-2 shrink-0">
                <img 
                  src={currentCase.image} 
                  alt={currentCase.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight line-clamp-2">
                  {currentCase.name}
                </h1>
                {currentCase.subtitle && (
                  <p className="text-xs text-white/50 line-clamp-1">{currentCase.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl glass-panel border border-white/10 shrink-0">
              <span className="text-xs text-white/60 font-bold">{t('case.openCost')}</span>
              <div className="flex items-center gap-1.5">
                <DropCoinIcon size={20} />
                <span className="font-mono font-black text-base sm:text-lg text-yellow-400">
                  {currentCase.priceDc.toLocaleString('ru-RU')} DC
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <ReelRoulette
            caseId={currentCase.id}
            caseSkins={currentCase.skins}
            casePriceDc={currentCase.priceDc}
            caseName={currentCase.name}
          />
        </section>

        <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                {t('case.contents')} ({groupedSkins.length + (isOfficial ? 1 : 0)} {t('home.items')})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {isOfficial && (
              <CaseSpecialItemCard caseId={currentCase.id} />
            )}
            {groupedSkins.map((variants, idx) => (
              <CaseSkinGroupCard key={variants[0]?.id || idx} variants={variants} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}
