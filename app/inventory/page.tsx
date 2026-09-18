"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { RARITY_MAP, RarityTier, InventoryItem } from "@/lib/types";
import { CurrencyBadge } from "@/components/ui/CurrencyBadge";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "@/components/ui/RarityBadge";
import {
  Briefcase,
  ExternalLink,
  DollarSign,
  Trash2,
  Search,
  Filter,
  Package,
  Trophy,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";

export default function InventoryPage() {
  const inventory = useAppStore((s) => s.inventory);
  const stats = useAppStore((s) => s.stats);
  const sellItem = useAppStore((s) => s.sellItem);
  const sellAllItems = useAppStore((s) => s.sellAllItems);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"price_desc" | "price_asc" | "newest">("price_desc");

  // Total inventory valuation
  const totalValuation = inventory.reduce((sum, item) => sum + item.priceDC, 0);

  // Filtering
  const filteredItems = inventory
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.weapon.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity =
        selectedRarity === "all" || item.rarity === selectedRarity;
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      if (sortBy === "price_desc") return b.priceDC - a.priceDC;
      if (sortBy === "price_asc") return a.priceDC - b.priceDC;
      return b.acquiredAt - a.acquiredAt;
    });

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span>Личный инвентарь игрока</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
            Мой инвентарь
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Всего предметов: <span className="text-white font-bold">{inventory.length}</span>
          </p>
        </div>

        {/* Valuation & Bulk Sell */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 border border-white/[0.08] p-3 sm:p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 uppercase font-bold">
              Общая стоимость инвентаря:
            </span>
            <CurrencyBadge amount={totalValuation} size="lg" />
          </div>

          {inventory.length > 0 && (
            <Button
              variant="gold"
              size="md"
              onClick={() => {
                if (confirm(`Вы действительно хотите продать все предметы за ${totalValuation} DC?`)) {
                  sellAllItems();
                }
              }}
              leftIcon={<DollarSign className="w-4 h-4" />}
            >
              Продать всё
            </Button>
          )}
        </div>
      </div>

      {/* Profile & Simulator Statistics Widget */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Package className="w-4 h-4 text-purple-400" />
            <span>Открыто кейсов</span>
          </div>
          <span className="text-2xl font-black text-white mt-2">
            {stats.casesOpened}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Успешных апгрейдов</span>
          </div>
          <span className="text-2xl font-black text-emerald-400 mt-2">
            {stats.upgradesWon} / {stats.upgradesAttempted}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Лучший дроп</span>
          </div>
          <span className="text-xs font-bold text-yellow-400 truncate mt-2">
            {stats.bestDrop ? stats.bestDrop.name : "Пока нет"}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Всего заработано</span>
          </div>
          <span className="text-xl font-black text-cyan-300 mt-2">
            {new Intl.NumberFormat("ru-RU").format(stats.totalEarnedDC)} DC
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-white/[0.08] p-3 rounded-2xl backdrop-blur-xl">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по скинам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Filters and Sorters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {/* Rarity selector */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Все редкости</option>
            <option value="special">★ Экстраординарное (Ножи)</option>
            <option value="covert">Тайное (Covert)</option>
            <option value="classified">Засекреченное (Classified)</option>
            <option value="restricted">Запрещенное (Restricted)</option>
            <option value="milspec">Армейское (Mil-Spec)</option>
            <option value="consumer">Ширпотреб</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="price_desc">Сначала дорогие</option>
            <option value="price_asc">Сначала дешевые</option>
            <option value="newest">Сначала новые</option>
          </select>
        </div>
      </div>

      {/* Skins Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 space-y-4 rounded-3xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">Инвентарь пуст</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {inventory.length === 0
              ? "Вы пока не открыли ни одного кейса. Перейдите в каталог и начните игру!"
              : "По выбранным фильтрам ничего не найдено."}
          </p>
          {inventory.length === 0 && (
            <Link href="/">
              <Button variant="primary" size="md">
                Открыть первый кейс
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const config = RARITY_MAP[item.rarity] || RARITY_MAP.consumer;
            return (
              <div
                key={item.instanceId}
                className="group relative flex flex-col justify-between rounded-2xl border bg-slate-900/60 hover:bg-slate-800/80 p-4 backdrop-blur-xl shadow-glass transition-all duration-300 overflow-hidden"
                style={{ borderColor: `${config.color}40` }}
              >
                {/* Rarity background glow */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
                  style={{ backgroundColor: config.color }}
                />

                {/* Top Info */}
                <div className="flex items-center justify-between gap-1 z-10">
                  <RarityBadge rarity={item.rarity} wear={item.wear} size="sm" />
                  <CurrencyBadge amount={item.priceDC} size="sm" />
                </div>

                {/* Skin Preview */}
                <div className="relative w-full h-32 flex items-center justify-center my-3 z-10">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Skin Title */}
                <div className="z-10 text-center mb-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase truncate block">
                    {item.weapon}
                  </span>
                  <h4
                    className="text-sm font-black truncate block"
                    style={{ color: config.color }}
                  >
                    {item.skinName}
                  </h4>
                </div>

                {/* Action Buttons */}
                <div className="z-10 pt-3 border-t border-white/[0.08] space-y-2">
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => sellItem(item.instanceId)}
                    className="w-full text-xs h-8"
                    leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                  >
                    Продать за {item.priceDC} DC
                  </Button>

                  <a
                    href={item.steamMarketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[11px] h-7 text-slate-400 hover:text-white"
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Открыть в Steam
                    </Button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
