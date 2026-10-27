'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Utensils,
  Camera,
  Calendar,
  Wallet,
  ChefHat,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AppMode } from '@/lib/app-mode';

interface ModeSelectorScreenProps {
  onSelectMode: (mode: AppMode) => void;
}

export const ModeSelectorScreen: React.FC<ModeSelectorScreenProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 antialiased">
      {/* Header Brand */}
      <div className="pt-4 pb-2 text-center max-w-lg mx-auto">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 mb-3">
          <ChefHat className="w-9 h-9 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Aşçı Defteri'ne Hoş Geldiniz
        </h1>
        <p className="mt-1 text-sm font-bold text-slate-500">
          Size en uygun kullanım şeklini seçin. Bu seçim hatırlanacaktır.
        </p>
      </div>

      {/* Two Giant Cards / Buttons */}
      <div className="max-w-lg mx-auto w-full space-y-4 my-auto py-2">
        {/* OPTION 1: BASİT MOD */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode('simple')}
          type="button"
          className="w-full text-left rounded-3xl border-3 border-emerald-500 bg-white p-5 sm:p-6 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:border-emerald-600 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-400/40 relative overflow-hidden"
        >
          {/* Recommended Badge */}
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>En Kolay & Hızlı</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <Camera className="w-8 h-8 text-emerald-700" />
            </div>
            <div className="flex-1 pr-12">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Usta Modu
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                🟢 Basit Mod (Kolay Defter)
              </h2>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Karmakarışık menüler yok. Kağıt listeni çek, parmağınla çiz, alacağını bil.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Düğün Takvimi: Sadece tarih ve düğün adı</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fotoğraflı Liste: Kağıt listenin üstünü parmakla çiz</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cepte Bakiye: Düğüncüden ne kaldı, ekibe ne ödendi</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-emerald-600 py-3.5 px-4 text-white font-black text-base shadow-md">
            <span>Basit Modu Başlat</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </div>
        </motion.button>

        {/* OPTION 2: GELİŞMİŞ MOD */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode('advanced')}
          type="button"
          className="w-full text-left rounded-3xl border-2 border-slate-300 bg-white p-5 sm:p-6 shadow-md hover:shadow-xl hover:border-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-slate-400/40 relative"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <SlidersHorizontal className="w-7 h-7 text-slate-700" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Profesyonel Yönetim
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                ⚡ Gelişmiş Mod
              </h2>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Reçeteli menü hazırlama, porsiyon gramajı, malzeme pazarı ve detaylı cari kasa.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Reçete & Gramaj: Kişi sayısına göre otomatik kilo hesabı</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Gelişmiş Kasa: Harici gelir/giderler ve iş bağlantılı ödemeler</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-900 py-3.5 px-4 text-white font-black text-base shadow-md">
            <span>Gelişmiş Modu Başlat</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </div>
        </motion.button>
      </div>

      {/* Footer Info */}
      <div className="pb-4 pt-2 text-center text-xs font-semibold text-slate-400 max-w-sm mx-auto">
        💡 Seçiminizi dilediğiniz zaman ekranın sağ üst köşesindeki butonla tek dokunuşla değiştirebilirsiniz.
      </div>
    </div>
  );
};
