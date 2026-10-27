'use client';

import React from 'react';
import { Utensils, ShieldCheck } from 'lucide-react';
import { PWAInstallButton } from './pwa-install-button';

export const TopBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
            <Utensils className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
              Aşçı Defteri
            </h1>
            <span className="text-xs font-bold text-slate-400 tracking-tight">
              Tek Dokunuş, Sıfır Karmaşa
            </span>
          </div>
        </div>

        {/* Zone 2: Offline Safe Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>İnternetsiz Çalışır</span>
        </div>

        {/* Zone 3: PWA Install Button */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
