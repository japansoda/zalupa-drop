'use client';

import React from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { LiveDropBar } from '../../components/layout/LiveDropBar';
import { RefillModal } from '../../components/layout/RefillModal';
import { TradeUpContract } from '../../components/contract/TradeUpContract';

export default function ContractPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#08080a] max-w-full overflow-x-hidden">
      <div>
        <Header />
        <LiveDropBar />
        <TradeUpContract />
      </div>

      <Footer />
      <RefillModal />
    </main>
  );
}
