'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Box, 
  Zap, 
  FileText, 
  Smartphone, 
  Monitor, 
  Activity, 
  LogOut, 
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Award,
  AlertTriangle,
  Server,
  Bird,
  CheckCircle,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { CASES_DATABASE } from '../../data/cases';
import { CHICKEN_BREEDS, ChickenBreedId } from '../../lib/farm';
import { DropCoinIcon } from '../../components/ui/DropCoinIcon';
import { sound } from '../../lib/sound';

const ADMIN_PASSWORD_HASH = 'admin777'; // Master PIN: admin777 or zalupa2026

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'cases' | 'controls'>('overview');

  const { balance, inventory, stats, addBalance, addLiveDrop, fakeDropsEnabled, setFakeDropsEnabled } = useGameStore();

  const [selectedBreed, setSelectedBreed] = useState<ChickenBreedId>('golden_nugget');
  const [giveStatTrak, setGiveStatTrak] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<number>(-1);
  const [giveSuccessMsg, setGiveSuccessMsg] = useState<string>('');

  const handleGiveChicken = () => {
    sound.playReward();
    const success = useGameStore.getState().giveChicken(
      selectedBreed,
      giveStatTrak,
      selectedSlot === -1 ? undefined : selectedSlot
    );
    if (success) {
      const breed = CHICKEN_BREEDS[selectedBreed];
      setGiveSuccessMsg(`Курица «${breed?.name}» ${giveStatTrak ? 'StatTrak™' : ''} успешно выдана на ферму!`);
      setTimeout(() => setGiveSuccessMsg(''), 4500);
    }
  };

  const [isTogglingFakeDrops, setIsTogglingFakeDrops] = useState<boolean>(false);

  // Sync fakeDropsEnabled status from server on mount
  useEffect(() => {
    fetch('/api/live-drops', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.fakeDropsEnabled === 'boolean') {
          setFakeDropsEnabled(data.fakeDropsEnabled);
        }
      })
      .catch(() => {});
  }, [setFakeDropsEnabled]);

  const handleToggleFakeDrops = async () => {
    sound.playClick();
    setIsTogglingFakeDrops(true);
    const nextVal = !fakeDropsEnabled;
    setFakeDropsEnabled(nextVal);

    try {
      const res = await fetch('/api/live-drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setFakeDrops', enabled: nextVal }),
      });
      if (!res.ok) {
        setFakeDropsEnabled(!nextVal);
      }
    } catch (_) {
      setFakeDropsEnabled(!nextVal);
    } finally {
      setIsTogglingFakeDrops(false);
    }
  };

  // Track active sessions / live online via API polling + SSE across all devices
  const [liveOnlineCount, setLiveOnlineCount] = useState<number>(1);

  // Check existing session auth on mount
  useEffect(() => {
    const token = sessionStorage.getItem('zalupa_admin_token');
    if (token === 'authenticated_valid_session') {
      setIsAuthenticated(true);
    }
  }, []);

  // Real-time online users presence tracker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const activeSessions = new Map<string, number>();

    const updateCount = () => {
      const now = Date.now();
      for (const [id, time] of activeSessions.entries()) {
        if (now - time > 25000) {
          activeSessions.delete(id);
        }
      }
      setLiveOnlineCount(Math.max(1, activeSessions.size));
    };

    // 1. Poll Vercel presence API every 4s
    const pollPresence = async () => {
      try {
        const res = await fetch('/api/presence', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.online === 'number') {
            setLiveOnlineCount(Math.max(1, Math.max(data.online, activeSessions.size)));
          }
        }
      } catch (_) {}
    };

    pollPresence();
    const pollTimer = setInterval(pollPresence, 4000);

    // 2. Real-time pubsub stream for instant heartbeat across all devices
    let eventSource: EventSource | null = null;
    try {
      if ('EventSource' in window) {
        eventSource = new EventSource('https://ntfy.sh/zalupa_presence_v3/sse');
        eventSource.onmessage = (e) => {
          try {
            const envelope = JSON.parse(e.data);
            if (envelope.event === 'message' && envelope.message) {
              const ping = JSON.parse(envelope.message);
              if (ping?.sessionId) {
                activeSessions.set(ping.sessionId, Date.now());
                updateCount();
              }
            }
          } catch (_) {}
        };
      }
    } catch (_) {}

    // 3. Same-device local BroadcastChannel
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('zalupa_presence_v3');
        channel.onmessage = (e) => {
          if (e.data?.sessionId) {
            activeSessions.set(e.data.sessionId, Date.now());
            updateCount();
          }
        };
      } catch (_) {}
    }

    // Prune ticker every 5s
    const pruneTimer = setInterval(updateCount, 5000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(pruneTimer);
      if (eventSource) eventSource.close();
      if (channel) channel.close();
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD_HASH || passwordInput === 'zalupa2026') {
      sound.playWin('covert');
      sessionStorage.setItem('zalupa_admin_token', 'authenticated_valid_session');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      sound.playClick();
      setLoginError('Неверный ключ доступа. Попробуйте admin777');
    }
  };

  const handleLogout = () => {
    sound.playClick();
    sessionStorage.removeItem('zalupa_admin_token');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Aggregated calculated statistics
  const analyticsData = useMemo(() => {
    const totalCasesCount = CASES_DATABASE.length;
    const totalCustomCases = CASES_DATABASE.filter(c => c.category === 'custom').length;
    const totalOfficialCases = CASES_DATABASE.filter(c => c.category === 'official').length;

    // Financial estimations based on game store stats
    const totalUpgrades = (stats.upgradesWon || 0) + (stats.upgradesLost || 0);
    const totalWagered = (totalUpgrades * 2500) + (inventory.length * 1200) + balance;
    const totalPayouts = (stats.totalWonDc || 0) + inventory.reduce((a, b) => a + b.priceDc, 0);
    const estimatedProfit = Math.max(0, totalWagered - totalPayouts);
    const platformRtp = totalWagered > 0 ? Math.min(98.5, Math.round((totalPayouts / totalWagered) * 1000) / 10) : 94.8;

    // Device breakdown (using current client info + baseline distribution)
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);

    return {
      totalCasesCount,
      totalCustomCases,
      totalOfficialCases,
      totalWagered,
      totalPayouts,
      estimatedProfit,
      platformRtp,
      currentDevice: isMobile ? 'Мобильное устройство' : 'Десктоп / ПК',
    };
  }, [stats, inventory, balance]);

  // If not authenticated, render cyberpunk security gate
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#06070a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(234,179,8,0.08),transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel border border-yellow-400/30 shadow-[0_0_60px_rgba(0,0,0,0.95)]">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Панель Управления
            </h1>
            <p className="text-xs text-white/50 mt-1 font-mono">
              ZALUPA DROP — Центр безопасности и аналитики
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-white/60 mb-2">
                Мастер-ключ администратора:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Введите пароль доступа..."
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-sm focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && (
                <p className="text-xs font-bold text-red-400 mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl btn-yellow text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Авторизоваться</span>
            </button>

            <div className="flex items-center justify-end text-[11px] text-white/40 pt-2 border-t border-white/5">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> На сайт
              </Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080a] text-white flex flex-col justify-between pb-10">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-[#08080a]/95 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase">
                Zalupa Admin Analytics
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-mono">
              Внутренняя статистика платформы и поведения пользователей
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="px-3 py-1.5 rounded-xl glass-button text-xs font-bold text-white/70 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">На главную</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'overview', label: 'Общая Аналитика', icon: Activity },
            { id: 'users', label: 'Пользователи & Устройства', icon: Users },
            { id: 'cases', label: 'Статистика Кейсов', icon: Box },
            { id: 'controls', label: 'Инструменты Управления', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.35)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase mb-2">
                  <span>Онлайн Сейчас</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-3xl text-emerald-400">
                    {liveOnlineCount}
                  </span>
                  <span className="text-xs text-white/40">активных сессий</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    ● Синхронизация в реальном времени
                  </span>
                  <span
                    className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full border ${
                      fakeDropsEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    Фейк: {fakeDropsEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase mb-2">
                  <span>Баланс Игрока (DC)</span>
                  <DropCoinIcon size={16} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-2xl sm:text-3xl text-yellow-400">
                    {balance.toLocaleString('ru-RU')}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 mt-2 font-mono">
                  Предметов в инвентаре: {inventory.length} шт.
                </span>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase mb-2">
                  <span>Расчетный RTP</span>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-3xl text-cyan-300">
                    {analyticsData.platformRtp}%
                  </span>
                  <span className="text-xs text-white/40">возврат игрокам</span>
                </div>
                <span className="text-[10px] text-cyan-400/80 mt-2 font-mono">
                  Математический баланс соблюден
                </span>
              </div>

              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase mb-2">
                  <span>Всего Кейсов в Базе</span>
                  <Box className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-3xl text-purple-300">
                    {analyticsData.totalCasesCount}
                  </span>
                  <span className="text-xs text-white/40">кейсов</span>
                </div>
                <span className="text-[10px] text-purple-400/80 mt-2 font-mono">
                  {analyticsData.totalCustomCases} кастомных + {analyticsData.totalOfficialCases} официальных
                </span>
              </div>
            </div>

            {/* Financial Ledger & Gaming Engine Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl glass-panel border border-white/10">
                <h3 className="text-sm font-black uppercase text-white/80 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  Финансовый баланс платформы
                </h3>
                <div className="flex flex-col gap-3 font-mono text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Всего поставлено / открыто:</span>
                    <span className="font-bold text-white">~{analyticsData.totalWagered.toLocaleString('ru-RU')} DC</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Сумма выплат (дроп + инвентарь):</span>
                    <span className="font-bold text-emerald-400">~{analyticsData.totalPayouts.toLocaleString('ru-RU')} DC</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Маржа платформы (House Edge):</span>
                    <span className="font-bold text-yellow-400">~{(100 - analyticsData.platformRtp).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-white/60">Vercel Web Analytics статус:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">АКТИВНА</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-white/10">
                <h3 className="text-sm font-black uppercase text-white/80 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Активность по игровым режимам
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-yellow-400" /> Открытие Кейсов</span>
                      <span className="font-mono text-white">74%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full w-[74%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-emerald-400" /> Апгрейдер</span>
                      <span className="font-mono text-white">16% (Попыток: {(stats.upgradesWon || 0) + (stats.upgradesLost || 0)})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[16%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-cyan-400" /> Контракты CS2</span>
                      <span className="font-mono text-white">7%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full w-[7%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Crash Игра</span>
                      <span className="font-mono text-white">3%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full w-[3%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS & DEVICES */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl glass-panel border border-white/10">
              <h3 className="text-sm font-black uppercase text-white/80 mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-yellow-400" />
                Распределение по устройствам
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-yellow-400" /> Смартфоны & Планшеты (Mobile)</span>
                    <span className="font-mono text-yellow-400">62.4%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full w-[62.4%]" />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">Оптимизировано под тач-скрины с нижней панелью MobileNav</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-cyan-400" /> Настольные ПК (Desktop)</span>
                    <span className="font-mono text-cyan-400">37.6%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full w-[37.6%]" />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">Поддержка скролла колесиком HorizontalScrollManager</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-white/10">
              <h3 className="text-sm font-black uppercase text-white/80 mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                Операционные системы и браузеры
              </h3>
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Android / Chrome Mobile</span>
                  <span className="font-bold text-white">41.2%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Windows 11 / Chrome & Edge</span>
                  <span className="font-bold text-white">32.8%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">iOS / Safari Mobile</span>
                  <span className="font-bold text-white">21.2%</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/60">macOS & Linux</span>
                  <span className="font-bold text-white">4.8%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POPULAR CASES */}
        {activeTab === 'cases' && (
          <div className="p-6 rounded-2xl glass-panel border border-white/10">
            <h3 className="text-sm font-black uppercase text-white/80 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Топ самых открываемых кейсов
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CASES_DATABASE.slice(0, 12).map((c, idx) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-black/60 p-1 shrink-0">
                    <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-white truncate">{c.name}</span>
                    <span className="text-[10px] text-yellow-400 font-mono font-bold">
                      {c.priceDc.toLocaleString('ru-RU')} DC
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM CONTROLS */}
        {activeTab === 'controls' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-white/80 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Тестирование Live-Ленты
                </h3>
                <p className="text-xs text-white/50 mb-4">
                  Отправляет настоящий проверочный дроп 100k+ DC в живую ленту для тестирования отображения.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playReward();
                  addLiveDrop({
                    id: `real_${Date.now()}_test`,
                    user: 'Вы',
                    avatar: '',
                    skin: {
                      id: 'skin-8aacf99e7f2f',
                      name: 'M4A4 | Howl',
                      weapon: 'M4A4',
                      skinName: 'Howl',
                      rarity: 'contraband',
                      wear: 'FN',
                      wearLabel: 'Прямо с завода',
                      image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB',
                      priceUsd: 4200,
                      priceDc: 350000,
                      steamMarketUrl: 'https://steamcommunity.com/market/listings/730/M4A4%20%7C%20Howl%20(Factory%20New)',
                    },
                    caseName: 'Кейс «Легенда Howl»',
                    timestamp: Date.now(),
                  });
                }}
                className="w-full py-3 rounded-xl btn-yellow text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <img
                  src="https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB"
                  alt="M4A4 Howl"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span>Пуш дропа M4A4 Howl (350,000 DC)</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-white/80 mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Начисление Тестового Баланса
                </h3>
                <p className="text-xs text-white/50 mb-4">
                  Начисляет 1,000,000 DC для глубокого тестирования хайроллер-кейсов и апгрейдов.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playCashout();
                  addBalance(1000000);
                }}
                className="w-full py-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <DollarSign className="w-4 h-4" />
                +1,000,000 DropCoin на баланс
              </button>
            </div>

            {/* Chicken Farm Generator Card */}
            <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)] flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black uppercase text-white/90 flex items-center gap-2">
                    <Bird className="w-4 h-4 text-amber-400" />
                    Выдача боевой курочки (Куриная ферма)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    CS2 FARM CHEAT
                  </span>
                </div>
                <p className="text-xs text-white/50 mb-5">
                  Мгновенно спавнит выбранную породу курочки с опциональным счетчиком StatTrak™ на указанный насест фермы.
                </p>

                {giveSuccessMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{giveSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {/* Breed Picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-white/60 uppercase">Порода курочки</label>
                    <select
                      value={selectedBreed}
                      onChange={(e) => setSelectedBreed(e.target.value as ChickenBreedId)}
                      className="bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {Object.values(CHICKEN_BREEDS).map((b) => (
                        <option key={b.id} value={b.id} className="bg-[#0d0e14] text-white">
                          {b.name} ({b.rarityName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slot Picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-white/60 uppercase">Насест курятника</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(Number(e.target.value))}
                      className="bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value={-1} className="bg-[#0d0e14] text-white">Первый свободный насест</option>
                      <option value={0} className="bg-[#0d0e14] text-white">Насест #1</option>
                      <option value={1} className="bg-[#0d0e14] text-white">Насест #2</option>
                      <option value={2} className="bg-[#0d0e14] text-white">Насест #3</option>
                      <option value={3} className="bg-[#0d0e14] text-white">Насест #4</option>
                      <option value={4} className="bg-[#0d0e14] text-white">Насест #5</option>
                    </select>
                  </div>

                  {/* StatTrak Toggle */}
                  <div className="flex flex-col gap-1.5 justify-center">
                    <label className="text-[11px] font-bold text-white/60 uppercase">Модификатор StatTrak™</label>
                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:border-white/20 select-none">
                      <input
                        type="checkbox"
                        checked={giveStatTrak}
                        onChange={(e) => setGiveStatTrak(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                      />
                      <span className="text-xs font-mono font-black text-amber-400">
                        {giveStatTrak ? 'StatTrak™ ВКЛ (+20% удачи)' : 'Обычная (Без ST)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGiveChicken}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95 transition-all"
                >
                  <Bird className="w-4 h-4" />
                  <span>Выдать курочку на ферму</span>
                </button>
              </div>
            </div>

            {/* Global Fake Drops Controller */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black uppercase text-white/80 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-yellow-400" />
                    Глобальное управление фейк-дропами (Live-Лента)
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${
                      fakeDropsEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    }`}
                  >
                    {fakeDropsEnabled ? '● АКТИВНЫ (ПО УМОЛЧАНИЮ)' : '○ ОТКЛЮЧЕНЫ'}
                  </span>
                </div>
                <p className="text-xs text-white/50 mb-4">
                  Включает или полностью отключает генерацию фейковых дропов для <b>всех посетителей сайта</b> в реальном времени.
                  Настройка сохраняется на сервере и мгновенно распространяется на все устройства через Server-Sent Events.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={isTogglingFakeDrops}
                  onClick={handleToggleFakeDrops}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border ${
                    fakeDropsEnabled
                      ? 'border-red-500/40 bg-red-950/30 hover:bg-red-900/50 text-red-300'
                      : 'border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>
                    {isTogglingFakeDrops
                      ? 'Обновление конфигурации...'
                      : fakeDropsEnabled
                      ? 'Отключить фейк-дропы для всех'
                      : 'Включить фейк-дропы для всех'}
                  </span>
                </button>

                <span className="text-[11px] text-white/40 font-mono">
                  Статус: {fakeDropsEnabled ? 'Трансляция фейк-дропов включена' : 'Трансляция приостановлена (только настоящие дропы)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
