'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LiveDropBar } from '../components/layout/LiveDropBar';
import { RefillModal } from '../components/layout/RefillModal';
import { DropCoinIcon } from '../components/ui/DropCoinIcon';
import { LogoSvg } from '../components/ui/LogoSvg';
import { CASES_DATABASE } from '../data/cases';
import { sound } from '../lib/sound';
import { ChevronRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a]">
      <div>
        <Header />
        <LiveDropBar />

        {/* Hero Section with Big Logo */}
        <section className="relative overflow-hidden py-8 sm:py-12 px-4">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
            <div className="py-2">
              <LogoSvg size="xl" className="w-80 sm:w-[480px] md:w-[600px] h-auto drop-shadow-[0_0_40px_rgba(250,204,21,0.3)] hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        </section>

        {/* Cases Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 rounded-full bg-yellow-400" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  КАТАЛОГ КЕЙСОВ CS2 ({CASES_DATABASE.length})
                </h2>
                <p className="text-xs text-white/50">
                  Официальные кейсы CS2 с физической рулеткой
                </p>
              </div>
            </div>
          </div>

          {/* Cases Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CASES_DATABASE.map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/case/${caseItem.id}`}
                onClick={() => sound.playClick()}
                className="group relative rounded-3xl glass-card border border-white/10 p-5 flex flex-col justify-between hover:border-yellow-400/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.2)] transition-all duration-200"
              >
                {caseItem.badge && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-yellow-400 text-black font-black text-[10px] uppercase tracking-wider shadow-md">
                    {caseItem.badge}
                  </div>
                )}

                <div className="relative w-full h-44 flex items-center justify-center my-2">
                  <img
                    src={caseItem.image}
                    alt={caseItem.name}
                    referrerPolicy="no-referrer"
                    className="w-36 h-36 object-contain group-hover:scale-105 transition-transform duration-200 filter drop-shadow-xl"
                  />
                </div>

                <div className="flex flex-col mb-4">
                  <h3 className="font-black text-lg text-white group-hover:text-yellow-400 transition-colors">
                    {caseItem.name}
                  </h3>
                  <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                    {caseItem.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 py-2 border-t border-b border-white/5 mb-4 overflow-hidden">
                  {caseItem.skins.slice(0, 5).map((skin, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 p-1 shrink-0 flex items-center justify-center"
                      title={skin.name}
                    >
                      <img 
                        src={skin.image} 
                        alt={skin.name} 
                        referrerPolicy="no-referrer" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  ))}
                  {caseItem.skins.length > 5 && (
                    <span className="text-[10px] text-white/50 font-bold ml-1">
                      +{caseItem.skins.length - 5}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DropCoinIcon size={20} />
                    <span className="font-mono font-black text-white text-lg group-hover:text-yellow-400 transition-colors">
                      {caseItem.priceDc.toLocaleString('ru-RU')} DC
                    </span>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-black transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}
