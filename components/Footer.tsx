import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-slate-950/90 backdrop-blur-xl text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 border border-white/10 p-1 flex items-center justify-center">
                <img src="/logo.png" alt="Zalupa Drop" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-black text-white uppercase tracking-wider">
                Zalupa Drop
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Современный симулятор открытия кейсов, апгрейда и мини-игр CS2. Открывайте кейсы без реальных финансовых рисков и наслаждайтесь азартом!
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Быстрая навигация
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/" className="hover:text-purple-400 transition-colors">
                Кейсы
              </Link>
              <Link href="/upgrader" className="hover:text-purple-400 transition-colors">
                Апгрейдер
              </Link>
              <Link href="/crash" className="hover:text-purple-400 transition-colors">
                Краш
              </Link>
              <Link href="/coinflip" className="hover:text-purple-400 transition-colors">
                Монетка
              </Link>
              <Link href="/inventory" className="hover:text-purple-400 transition-colors">
                Мой инвентарь
              </Link>
            </div>
          </div>

          {/* Legal / Disclaimer */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Дисклеймер симулятора</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Все игровые скины и баланс в DropCoins (DC) являются исключительно виртуальными игровыми ценностями. Никакие реальные деньги, депозиты или вывод средств не поддерживаются. Проект создан в образовательных целях (портфолио). Не связан с Valve Corporation или Counter-Strike.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} Zalupa Drop. Все права защищены.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Сделано с любовью к CS2</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
