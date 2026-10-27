'use client';

import React from 'react';
import { Utensils, ShieldCheck, ChefHat } from 'lucide-react';
import { PWAInstallButton } from './pwa-install-button';

interface TopBarProps {
  onSwitchToSimple?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSwitchToSimple }) => {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white/95 px-3 sm:px-4 py-3 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
            <Utensils className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                Aşçı Defteri
              </h1>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-700">
                GELİŞMİŞ
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Tek Dokunuş, Sıfır Karmaşa
            </span>
          </div>
        </div>

        {/* Zone 2: Offline Safe Badge (hidden on small) */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>İnternetsiz</span>
        </div>

        {/* Zone 3: Switch to Simple Mode & PWA Install */}
        <div className="flex items-center gap-2">
          {onSwitchToSimple && (
            <button
              onClick={onSwitchToSimple}
              type="button"
              className="flex items-center gap-1.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100 shadow-xs transition-all active:scale-95 min-h-[42px]"
            >
              <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kolay Mod</span>
            </button>
          )}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
