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

export default function CaseOpenPage() {
  const params = useParams();
  const caseId = params?.id as string;
  const { t, locale } = useLanguage();

  const currentCase = CASES_DATABASE.find((c) => c.id === caseId);

  const groupedSkins = React.useMemo(() => {
    if (!currentCase?.skins) return [];
    const map = new Map<string, typeof currentCase.skins>();
    for (const skin of currentCase.skins) {
      const key = `${skin.weapon || ''}___${skin.skinName || skin.name}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(skin);
    }
    return Array.from(map.values());
  }, [currentCase]);

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
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a]">
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/10 p-2 shrink-0">
                <img 
                  src={currentCase.image} 
                  alt={currentCase.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {currentCase.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-panel border border-white/10">
              <span className="text-xs text-white/60 font-bold">{t('case.openCost')}</span>
              <div className="flex items-center gap-1.5">
                <DropCoinIcon size={20} />
                <span className="font-mono font-black text-lg text-yellow-400">
                  {currentCase.priceDc.toLocaleString('ru-RU')} DC
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <ReelRoulette
            caseId={currentCase.id}
            caseSkins={currentCase.skins}
            casePriceDc={currentCase.priceDc}
            caseName={currentCase.name}
          />
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {t('case.contents')} ({groupedSkins.length} {t('home.items')})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
