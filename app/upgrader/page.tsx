"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { useAppStore } from "@/lib/store/useAppStore";
import { SKINS_DATABASE } from "@/lib/data/skins";
import { Skin, InventoryItem, RARITY_MAP } from "@/lib/types";
import { CircularGauge } from "@/components/upgrader/CircularGauge";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "@/components/ui/RarityBadge";
import { OptimizedSkinImage } from "@/components/ui/OptimizedSkinImage";
import { sound } from "@/lib/sound";
import {
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function UpgraderPage() {
  const balance = useAppStore((s) => s.balance);
  const inventory = useAppStore((s) => s.inventory);
  const deductBalance = useAppStore((s) => s.deductBalance);
  const addDropToInventory = useAppStore((s) => s.addDropToInventory);
  const removeInventoryItem = useAppStore((s) => s.removeInventoryItem);
  const recordUpgrade = useAppStore((s) => s.recordUpgrade);
  const setRefillModalOpen = useAppStore((s) => s.setRefillModalOpen);

  const [betMode, setBetMode] = useState<"inventory" | "dc">("inventory");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [customBetDC, setCustomBetDC] = useState<number>(500);

  const [targetSkin, setTargetSkin] = useState<Skin>(SKINS_DATABASE[0]);
  const [searchTarget, setSearchTarget] = useState<string>("");

  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [resultAngle, setResultAngle] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<"idle" | "win" | "loss">("idle");
  const [lastWonSkin, setLastWonSkin] = useState<Skin | null>(null);

  const currentBetValue =
    betMode === "inventory"
      ? selectedInventoryItem
        ? selectedInventoryItem.priceDC
        : 0
      : customBetDC;

  const rawChance =
    targetSkin.priceDC > 0
      ? (currentBetValue / targetSkin.priceDC) * 95
      : 0;
  const chancePercent = Math.min(85, Math.max(1, rawChance));

  const canUpgrade =
    !isRolling &&
    currentBetValue > 0 &&
    (betMode === "inventory" ? selectedInventoryItem !== null : balance >= customBetDC);

  const handleStartUpgrade = () => {
    if (!canUpgrade) {
      if (betMode === "dc" && balance < customBetDC) {
        setRefillModalOpen(true);
      }
      return;
    }

    if (betMode === "dc") {
      const ok = deductBalance(customBetDC);
      if (!ok) return;
    } else if (selectedInventoryItem) {
      removeInventoryItem(selectedInventoryItem.instanceId);
    }

    setOutcome("idle");
    setLastWonSkin(null);

    const isWin = Math.random() * 100 <= chancePercent;
    const winZoneDegrees = (chancePercent / 100) * 360;

    let stopAngle: number;
    if (isWin) {
      stopAngle = Math.random() * (winZoneDegrees - 5) + 2;
    } else {
      stopAngle = Math.random() * (355 - winZoneDegrees) + winZoneDegrees + 2;
    }

    setResultAngle(stopAngle);
    setIsRolling(true);
  };

  const handleFinishUpgrade = (isWin: boolean) => {
    setIsRolling(false);

    if (isWin) {
      setOutcome("win");
      sound.playUpgradeSuccess();
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#ffd700"],
      });

      addDropToInventory(targetSkin, "upgrade");
      setLastWonSkin(targetSkin);
      recordUpgrade(currentBetValue, targetSkin);
    } else {
      setOutcome("loss");
      sound.playUpgradeFail();
      recordUpgrade(currentBetValue, null);
    }

    setSelectedInventoryItem(null);
  };

  const filteredTargets = SKINS_DATABASE.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTarget.toLowerCase()) ||
      s.weapon.toLowerCase().includes(searchTarget.toLowerCase())
  ).sort((a, b) => a.priceDC - b.priceDC);

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-purple-300 text-xs font-bold uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>Апгрейдер Liquid Glass CS2</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
          Апгрейдер <span className="text-purple-400">95% RTP</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto font-medium">
          Поставьте скин из инвентаря или DC и попытайтесь выиграть более ценный предмет!
        </p>
      </div>

      {/* Main Upgrader Arena with Liquid Glass Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Left Column: Source Bet */}
        <div className="rounded-3xl liquid-glass p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Ваша ставка
            </span>
            <div className="flex items-center gap-1 liquid-glass-pill p-1 rounded-xl">
              <button
                disabled={isRolling}
                onClick={() => setBetMode("inventory")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  betMode === "inventory"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Скин
              </button>
              <button
                disabled={isRolling}
                onClick={() => setBetMode("dc")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  betMode === "dc"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Баланс DC
              </button>
            </div>
          </div>

          {/* Selected Item / DC Display */}
          {betMode === "inventory" ? (
            <div className="space-y-3">
              {selectedInventoryItem ? (
                <div
                  className="relative p-4 rounded-2xl border-2 flex flex-col items-center text-center liquid-glass"
                  style={{
                    borderColor: RARITY_MAP[selectedInventoryItem.rarity]?.color || "#4b69ff",
                  }}
                >
                  <button
                    disabled={isRolling}
                    onClick={() => setSelectedInventoryItem(null)}
                    className="absolute top-2 right-2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg liquid-glass-button"
                  >
                    Сменить
                  </button>
                  <div className="w-32 h-24 flex items-center justify-center my-2">
                    <OptimizedSkinImage
                      src={selectedInventoryItem.imageUrl}
                      alt={selectedInventoryItem.name}
                      weaponType={selectedInventoryItem.weapon}
                      rarityColor={RARITY_MAP[selectedInventoryItem.rarity]?.color}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-sm font-bold text-white">
                    {selectedInventoryItem.name}
                  </span>
                  <CurrencyBadge amount={selectedInventoryItem.priceDC} size="md" className="mt-2" />
                </div>
              ) : (
                <div className="p-6 rounded-2xl border-2 border-dashed border-white/20 text-center flex flex-col items-center justify-center space-y-2 min-h-[180px] liquid-glass">
                  <span className="text-xs text-slate-300 font-medium">
                    Выберите предмет из вашего инвентаря ниже:
                  </span>
                  <span className="text-[11px] text-yellow-400/90 font-bold">
                    (В инвентаре: {inventory.length} предметов)
                  </span>
                </div>
              )}

              {/* Quick inventory item selector */}
              {inventory.length > 0 && !selectedInventoryItem && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {inventory.map((item) => (
                    <button
                      key={item.instanceId}
                      disabled={isRolling}
                      onClick={() => setSelectedInventoryItem(item)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/10 liquid-glass-button hover:border-white/25 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-7 shrink-0">
                          <OptimizedSkinImage
                            src={item.imageUrl}
                            alt={item.name}
                            weaponType={item.weapon}
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-yellow-400">
                        {item.priceDC} DC
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <span className="text-xs text-slate-400 font-medium">Сумма ставки</span>
                <div className="flex items-center justify-center">
                  <CurrencyBadge amount={customBetDC} size="xl" />
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[200, 500, 1000, 2500].map((amt) => (
                  <button
                    key={amt}
                    disabled={isRolling}
                    onClick={() => setCustomBetDC(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      customBetDC === amt
                        ? "bg-purple-600 text-white border-purple-400 shadow-md"
                        : "liquid-glass-button text-slate-300"
                    }`}
                  >
                    {amt} DC
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isRolling}
                  onClick={() => setCustomBetDC(Math.max(10, Math.floor(customBetDC / 2)))}
                  className="flex-1 py-2 rounded-xl text-xs font-bold liquid-glass-button text-slate-300"
                >
                  1/2
                </button>
                <button
                  disabled={isRolling}
                  onClick={() => setCustomBetDC(customBetDC * 2)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold liquid-glass-button text-slate-300"
                >
                  2X
                </button>
                <button
                  disabled={isRolling}
                  onClick={() => setCustomBetDC(balance)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/35"
                >
                  MAX
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center Column: Circular Gauge in Liquid Glass */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <CircularGauge
            chancePercent={chancePercent}
            isRolling={isRolling}
            onFinish={handleFinishUpgrade}
            resultAngle={resultAngle}
          />

          <Button
            variant={canUpgrade ? "gold" : "secondary"}
            size="xl"
            disabled={!canUpgrade || isRolling}
            onClick={handleStartUpgrade}
            className="w-full max-w-xs shadow-2xl"
            leftIcon={<TrendingUp className="w-5 h-5" />}
          >
            {isRolling
              ? "Вращаем колесо..."
              : currentBetValue === 0
              ? "Выберите ставку"
              : `Улучшить за ${currentBetValue} DC`}
          </Button>

          {outcome !== "idle" && (
            <div
              className={`p-4 rounded-2xl border text-center animate-in zoom-in-95 w-full max-w-sm liquid-glass shadow-2xl ${
                outcome === "win"
                  ? "border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  : "border-rose-500/50 text-rose-300 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              }`}
            >
              {outcome === "win" ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-black text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>УСПЕШНЫЙ АПГРЕЙД!</span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    {lastWonSkin?.name} добавлен в ваш инвентарь!
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-black text-base">
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>НЕУДАЧА</span>
                  </div>
                  <p className="text-xs text-rose-200">
                    Стрелка остановилась в красной зоне. Ставка сгорела.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Target Skin Selection */}
        <div className="rounded-3xl liquid-glass p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Желаемый скин (Цель)
            </span>
            <CurrencyBadge amount={targetSkin.priceDC} size="sm" />
          </div>

          <div
            className="p-4 rounded-2xl border-2 flex flex-col items-center text-center liquid-glass"
            style={{
              borderColor: RARITY_MAP[targetSkin.rarity]?.color || "#ffd700",
            }}
          >
            <div className="w-36 h-24 flex items-center justify-center my-2">
              <OptimizedSkinImage
                src={targetSkin.imageUrl}
                alt={targetSkin.name}
                weaponType={targetSkin.weapon}
                rarityColor={RARITY_MAP[targetSkin.rarity]?.color}
                className="w-full h-full hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-sm font-bold text-white">{targetSkin.name}</span>
            <div className="flex items-center gap-2 mt-2">
              <RarityBadge rarity={targetSkin.rarity} wear={targetSkin.wear} size="sm" />
            </div>
          </div>

          {/* Search Targets */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск желаемого скина..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              className="w-full liquid-glass-pill rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Target Catalog List */}
          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {filteredTargets.map((skin) => (
              <button
                key={skin.id}
                disabled={isRolling}
                onClick={() => setTargetSkin(skin)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                  targetSkin.id === skin.id
                    ? "bg-purple-600/30 border-purple-400/60 shadow-md"
                    : "border-white/10 liquid-glass-button"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-7 shrink-0">
                    <OptimizedSkinImage
                      src={skin.imageUrl}
                      alt={skin.name}
                      weaponType={skin.weapon}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                    {skin.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-yellow-400">
                  {skin.priceDC} DC
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}