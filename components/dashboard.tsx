'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  ShoppingBag,
  Wallet,
  ChevronRight,
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { AppData } from '@/lib/storage';

interface DashboardProps {
  data: AppData;
  onNavigate: (view: 'weddings' | 'shopping' | 'balances') => void;
  deviceId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate, deviceId }) => {
  // Statistics
  const pendingShoppingCount = data.shopping.filter((i) => !i.completed).length;

  const sortedUpcomingWeddings = [...data.weddings]
    .filter((w) => !w.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextWedding = sortedUpcomingWeddings[0];

  const totalReceivables = data.balances
    .filter((b) => b.type === 'customer' && b.status === 'open')
    .reduce((sum, b) => sum + b.remainingAmount, 0);

  const formatTL = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Welcome */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Kolay ve Hızlı Yaşam Asistanı</span>
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
          Tek Dokunuş, Sıfır Karmaşa.
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-lg">
          Kağıt-kalem rahatlığında, şifre ve kayıt derdi olmadan doğrudan cebe sığan mini dijital defteriniz.
        </p>
      </div>

      {/* 3 Main Big Module Cards */}
      <div className="space-y-3.5">
        {/* Module 1: Düğün Listesi / Takvim */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('weddings')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-rose-200 bg-white p-5 shadow-sm transition-all hover:border-rose-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    Düğün & Merasim Takvimi
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Yaklaşan merasimler, takı ve salon notları
                </p>
                {nextWedding ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg px-2.5 py-1 w-fit">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      Sıradaki: {nextWedding.title} ({nextWedding.date})
                    </span>
                  </div>
                ) : (
                  <span className="mt-2 inline-block text-xs font-medium text-slate-400">
                    Kayıtlı {data.weddings.length} merasim var
                  </span>
                )}
              </div>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* Module 2: Alışveriş Listesi */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('shopping')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    Alışveriş Listesi
                  </h3>
                  <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <Camera className="w-3 h-3" />
                    Fotoğraf Okuma
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Üzeri parmakla çizilebilir, tek tuşla WhatsApp’a gider
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                    {pendingShoppingCount > 0 ? `${pendingShoppingCount} madde alınacak` : 'Tümü alındı! 🎉'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* Module 3: Basit Bakiye Takibi */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('balances')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-blue-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                <Wallet className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    Bakiye Defteri (Borç / Alacak)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Müşteri ödemeleri ve usta/malzeme masrafları
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-900 font-mono tabular-nums">
                    Kalan Alacak: {formatTL(totalReceivables)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* No-Auth & Offline Trust Banner */}
      <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-4 text-xs text-slate-600">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-slate-800">
              Giriş Yok, Şifre Yok, Bekleme Yok
            </div>
            <p>
              Tüm notlarınız doğrudan bu cihaza kaydedilir ve internetiniz olduğunda bulutla güvenle eşitlenir.
            </p>
            <div className="pt-1 text-[11px] text-slate-400 font-mono">
              Cihaz Kodu: {deviceId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
