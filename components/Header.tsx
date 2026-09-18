"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { CurrencyBadge } from "./ui/CurrencyBadge";
import { BrandLogo } from "./ui/BrandLogo";
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
    <header className="sticky top-0 z-40 w-full liquid-glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand (Clean Transparent SVG Vector) */}
          <Link href="/" className="group shrink-0">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "liquid-glass bg-violet-600/30 text-white border-violet-400/50 shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-violet-300" : "text-slate-400"}`} />
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
            <div className="flex items-center gap-1.5 liquid-glass-pill rounded-xl p-1 pl-2 sm:pl-3">
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
                  : "liquid-glass-button text-slate-300 hover:text-white"
              }`}
              title={isSoundMuted ? "Включить звук" : "Отключить звук"}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl liquid-glass-button text-slate-300 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.1] space-y-1.5 animate-in slide-in-from-top-2">
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
                      ? "bg-violet-600/30 text-white border border-violet-500/50"
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