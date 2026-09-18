'use client';

import React from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { LiveDropBar } from '../../components/layout/LiveDropBar';
import { RefillModal } from '../../components/layout/RefillModal';
import { CrashGame } from '../../components/crash/CrashGame';
import { useLanguage } from '../../lib/i18n';
import { Flame } from 'lucide-react';

export default function CrashPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a]">
      <div>
        <Header />
        <LiveDropBar />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shadow-lg">
                <Flame className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {t('crash.title')}
                </h1>
                <p className="text-xs text-white/50 mt-0.5">
                  {t('crash.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <CrashGame />
        </section>
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}
