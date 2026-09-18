"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { CurrencyBadge } from "./ui/CurrencyBadge";
import { Button } from "./ui/Button";
import {
  Package,
  Sparkles,
  TrendingUp,
  CircleDollarSign,
  Briefcase,
  Volume2,
  VolumeX,
  Plus,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const balance = useAppStore((s) => s.balance);
  const inventory = useAppStore((s) => s.inventory);
  const isSoundMuted = useAppStore((s) => s.isSoundMuted);
  const toggleSound = useAppStore((s) => s.toggleSound);
  const setRefillModalOpen = useAppStore((s) => s.setRefillModalOpen);

  const navLinks = [
    { href: "/", label: "Кейсы", icon: Package },
    { href: "/upgrader", label: "Апгрейд", icon: TrendingUp },
    { href: "/crash", label: "Краш", icon: Sparkles },
    { href: "/coinflip", label: "Монетка", icon: CircleDollarSign },
    {
      href: "/inventory",
      label: "Инвентарь",
      icon: Briefcase,
      badge: inventory.length > 0 ? inventory.length : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-purple-500/50 shadow-md group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center p-1">
              <img
                src="/logo.png"
                alt="Zalupa Drop Logo"
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-wider text-white uppercase group-hover:text-purple-400 transition-colors">
                  Zalupa Drop
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  CS2 Sim
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
                Безопасный симулятор кейсов
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-violet-600/20 text-white border border-violet-500/40 shadow-[0_0_15px_rgba(124,58,237,0.25)]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded-full bg-violet-500/30 border border-violet-400/40 text-violet-200 font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Balance & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Balance Pill */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-yellow-500/20 rounded-xl p-1 pl-2 sm:pl-3 shadow-inner">
              <CurrencyBadge amount={balance} size="md" />
              <Button
                variant="gold"
                size="sm"
                onClick={() => setRefillModalOpen(true)}
                className="h-8 px-2.5 rounded-lg text-xs"
                title="Пополнить баланс DC бесплатно"
              >
                <Plus className="w-3.5 h-3.5 mr-0.5" />
                <span className="hidden sm:inline">Пополнить</span>
              </Button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2.5 rounded-xl border transition-all ${
                isSoundMuted
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  : "bg-white/[0.05] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.1]"
              }`}
              title={isSoundMuted ? "Включить звук" : "Отключить звук"}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.08] space-y-1.5 animate-in slide-in-from-top-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                    isActive
                      ? "bg-violet-600/20 text-white border border-violet-500/40"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-400" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-violet-500/30 border border-violet-400/40 text-violet-200">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
