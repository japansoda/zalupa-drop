'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { LiveDropBar } from '../../../components/layout/LiveDropBar';
import { RefillModal } from '../../../components/layout/RefillModal';
import { ReelRoulette } from '../../../components/case/ReelRoulette';
import { DropCoinIcon } from '../../../components/ui/DropCoinIcon';
import { RarityBadge } from '../../../components/ui/RarityBadge';
import { WearBadge } from '../../../components/ui/WearBadge';
import { CASES_DATABASE } from '../../../data/cases';
import { RARITY_CONFIG } from '../../../data/skins';
import { sound } from '../../../lib/sound';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';

export default function CaseOpenPage() {
  const params = useParams();
  const caseId = params?.id as string;

  const currentCase = CASES_DATABASE.find((c) => c.id === caseId);

  if (!currentCase) {
    return (
      <main className="min-h-screen flex flex-col justify-between bg-[#08080a]">
        <Header />
        <div className="max-w-md mx-auto text-center py-24">
          <h2 className="text-2xl font-bold text-white mb-4">Кейс не найден</h2>
          <Link href="/" className="px-6 py-3 rounded-xl btn-yellow text-black font-bold">
            Вернуться на главную
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
            <span>Назад ко всем кейсам</span>
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
                <p className="text-xs text-white/50 mt-0.5">
                  {currentCase.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-panel border border-white/10">
              <span className="text-xs text-white/60 font-bold">Цена открытия:</span>
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
                Содержимое кейса ({currentCase.skins.length} предметов)
              </h2>
            </div>
            <span className="text-xs text-white/50">
              Вероятности соответствуют стандартам CS2
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentCase.skins.map((skin) => {
              const config = RARITY_CONFIG[skin.rarity] || RARITY_CONFIG.milspec;
              return (
                <div
                  key={skin.id}
                  className="rounded-2xl glass-card p-3 flex flex-col justify-between border hover:border-yellow-400/40 transition-all group"
                  style={{ borderBottomWidth: '3px', borderBottomColor: config.color }}
                >
                  <div className="flex items-center justify-between">
                    <WearBadge skin={skin} size="xs" />
                    <RarityBadge rarity={skin.rarity} size="sm" />
                  </div>

                  <div className="w-full h-28 flex items-center justify-center my-2">
                    <img
                      src={skin.image}
                      alt={skin.name}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white truncate">{skin.weapon}</span>
                    <span className="text-[11px] truncate mb-2" style={{ color: config.color }}>
                      {skin.skinName}
                    </span>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <DropCoinIcon size={14} />
                        <span className="font-mono text-xs font-bold text-yellow-400">
                          {skin.priceDc.toLocaleString('ru-RU')}
                        </span>
                      </div>

                      <a
                        href={skin.steamMarketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/30 hover:text-white transition-colors"
                        title="Открыть в Steam"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}
