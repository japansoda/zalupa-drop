"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCaseById, rollSkinFromCase } from "@/lib/data/cases";
import { useAppStore } from "@/lib/store/useAppStore";
import { RouletteReel } from "@/components/case/RouletteReel";
import { DropModal } from "@/components/case/DropModal";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { Button } from "@/components/ui/Button";
import { RARITY_MAP, Skin, InventoryItem } from "@/lib/types";
import {
  ArrowLeft,
  Zap,
  Package,
  Layers,
} from "lucide-react";

export default function CasePage() {
  const params = useParams();
  const caseId = params?.id as string;
  const caseItem = getCaseById(caseId);

  const balance = useAppStore((s) => s.balance);
  const deductBalance = useAppStore((s) => s.deductBalance);
  const addBalance = useAppStore((s) => s.addBalance);
  const addDropToInventory = useAppStore((s) => s.addDropToInventory);
  const recordCaseOpen = useAppStore((s) => s.recordCaseOpen);
  const setRefillModalOpen = useAppStore((s) => s.setRefillModalOpen);

  const [openCount, setOpenCount] = useState<number>(1);
  const [fastMode, setFastMode] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [targetSkin, setTargetSkin] = useState<Skin | null>(null);

  // Drop Modal State
  const [isDropModalOpen, setIsDropModalOpen] = useState<boolean>(false);
  const [wonSkins, setWonSkins] = useState<Skin[]>([]);
  const [createdInventoryItems, setCreatedInventoryItems] = useState<InventoryItem[]>([]);
  const [soldIndices, setSoldIndices] = useState<number[]>([]);

  if (!caseItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <h2 className="text-3xl font-black text-white">Кейс не найден</h2>
        <p className="text-slate-400">Кажется, данный кейс был удален или ссылка неверна.</p>
        <Link href="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Вернуться к кейсам
          </Button>
        </Link>
      </div>
    );
  }

  const totalCost = caseItem.priceDC * openCount;
  const hasEnoughBalance = balance >= totalCost;

  const handleStartOpen = () => {
    if (isSpinning) return;

    if (!hasEnoughBalance) {
      setRefillModalOpen(true);
      return;
    }

    const deducted = deductBalance(totalCost);
    if (!deducted) return;

    // Roll winners
    const winners: Skin[] = [];
    for (let i = 0; i < openCount; i++) {
      const rolled = rollSkinFromCase(caseItem);
      winners.push(rolled);
      recordCaseOpen(caseItem.priceDC, rolled);
    }

    // Set first winner for reel animation
    setTargetSkin(winners[0]);
    setWonSkins(winners);
    setSoldIndices([]);
    setIsSpinning(true);
  };

  const handleFinishRoulette = (singleWinner: Skin) => {
    setIsSpinning(false);

    // Save all won items to user inventory
    const newItems: InventoryItem[] = wonSkins.map((s) =>
      addDropToInventory(s, "case")
    );
    setCreatedInventoryItems(newItems);
    setIsDropModalOpen(true);
  };

  // Modal actions
  const handleKeepAll = () => {
    setIsDropModalOpen(false);
  };

  const handleSellItem = (index: number) => {
    if (soldIndices.includes(index)) return;
    const invItem = createdInventoryItems[index];
    const skin = wonSkins[index];
    if (!skin) return;

    // Credit balance
    addBalance(skin.priceDC);
    // Remove from inventory store if created
    if (invItem) {
      useAppStore.getState().removeInventoryItem(invItem.instanceId);
    }
    setSoldIndices([...soldIndices, index]);
  };

  const handleSellAll = () => {
    wonSkins.forEach((skin, idx) => {
      if (!soldIndices.includes(idx)) {
        handleSellItem(idx);
      }
    });
    setIsDropModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад ко всем кейсам</span>
        </Link>

        <CurrencyBadge amount={caseItem.priceDC} size="md" />
      </div>

      {/* Case Header & Hero */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
          {caseItem.name}
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          {caseItem.description}
        </p>
      </div>

      {/* Roulette Reel */}
      <div className="relative">
        <RouletteReel
          caseItem={caseItem}
          isSpinning={isSpinning}
          fastMode={fastMode}
          onFinish={handleFinishRoulette}
          targetSkin={targetSkin}
        />
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-900/80 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-xl max-w-2xl mx-auto">
        {/* Open Count Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.06]">
          {[1, 2, 3, 5].map((count) => (
            <button
              key={count}
              disabled={isSpinning}
              onClick={() => setOpenCount(count)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                openCount === count
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              x{count}
            </button>
          ))}
        </div>

        {/* Fast Mode Toggle */}
        <button
          disabled={isSpinning}
          onClick={() => setFastMode(!fastMode)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            fastMode
              ? "bg-amber-500/20 text-yellow-300 border-yellow-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              : "bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white"
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${fastMode ? "text-yellow-400 fill-yellow-400" : ""}`} />
          <span>Быстро</span>
        </button>

        {/* Open Button */}
        <Button
          variant={hasEnoughBalance ? "gold" : "danger"}
          size="lg"
          disabled={isSpinning}
          onClick={handleStartOpen}
          className="w-full sm:w-auto px-8"
          leftIcon={<Package className="w-5 h-5" />}
        >
          {isSpinning
            ? "Открываем..."
            : hasEnoughBalance
            ? `Открыть за ${totalCost} DC`
            : "Недостаточно DC (Пополнить)"}
        </Button>
      </div>

      {/* Drops in this case */}
      <section className="space-y-4 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Содержимое кейса</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Всего {caseItem.skins.length} предметов
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...caseItem.skins]
            .sort((a, b) => b.priceDC - a.priceDC)
            .map((skin) => {
              const config = RARITY_MAP[skin.rarity] || RARITY_MAP.consumer;
              return (
                <div
                  key={skin.id}
                  className="group relative flex flex-col justify-between p-3 rounded-xl border bg-slate-900/60 hover:bg-slate-800/80 transition-all backdrop-blur-md overflow-hidden"
                  style={{ borderColor: `${config.color}35` }}
                >
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: config.color }}
                  />

                  <div className="relative w-full h-24 flex items-center justify-center my-1">
                    <img
                      src={skin.imageUrl}
                      alt={skin.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="z-10 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase truncate block">
                      {skin.weapon}
                    </span>
                    <span
                      className="text-xs font-bold truncate block leading-tight"
                      style={{ color: config.color }}
                    >
                      {skin.skinName}
                    </span>
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                      <span className="text-[10px] text-slate-400">{skin.wear}</span>
                      <span className="text-[11px] font-bold text-yellow-400">
                        {skin.priceDC} DC
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Drop Reveal Modal */}
      <DropModal
        isOpen={isDropModalOpen}
        wonSkins={wonSkins}
        onKeepAll={handleKeepAll}
        onSellAll={handleSellAll}
        onSellItem={handleSellItem}
        soldIndices={soldIndices}
      />
    </div>
  );
}