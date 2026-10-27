'use client';

import React, { useState, useSyncExternalStore } from 'react';
import {
  Calendar,
  Camera,
  Wallet,
  ChefHat,
  SlidersHorizontal,
  Download,
  Upload,
} from 'lucide-react';
import {
  subscribeSimpleStorage,
  getSimpleDbSnapshot,
  getSimpleDbServerSnapshot,
  saveSimpleDatabase,
  formatTL,
} from '@/lib/simple-cook-storage';
import { SimpleWeddingsView } from './simple-weddings-view';
import { SimpleShoppingView } from './simple-shopping-view';
import { SimpleBalanceView } from './simple-balance-view';
import { PWAInstallButton } from '@/components/pwa-install-button';

interface SimpleHomeProps {
  onSwitchToAdvanced: () => void;
}

export type SimpleTabType = 'weddings' | 'shopping' | 'balance';

export const SimpleHome: React.FC<SimpleHomeProps> = ({ onSwitchToAdvanced }) => {
  const db = useSyncExternalStore(
    subscribeSimpleStorage,
    getSimpleDbSnapshot,
    getSimpleDbServerSnapshot
  );

  const [activeTab, setActiveTab] = useState<SimpleTabType>('weddings');

  const activeWeddingsCount = db.weddings.filter((w) => !w.isCompleted).length;
  const shoppingCount = db.shoppingItems.length;

  const totalReceivables = db.weddings.reduce((sum, w) => {
    const rem = Math.max(0, (w.agreedAmount || 0) - (w.receivedDeposit || 0));
    return sum + rem;
  }, 0);

  // Backup / Export
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `asci_basit_defter_yedek_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore / Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.weddings)) {
          saveSimpleDatabase({
            weddings: parsed.weddings || [],
            shoppingItems: parsed.shoppingItems || [],
            workerPays: parsed.workerPays || [],
          });
          alert('Basit defter yedeği başarıyla yüklendi!');
        } else {
          alert('Geçersiz yedek dosyası.');
        }
      } catch {
        alert('Dosya okunurken bir hata oluştu.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white/95 px-3 sm:px-4 py-3 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                  Aşçı Defteri
                </h1>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800">
                  KOLAY MOD
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Usta İçin Sadeleştirilmiş
              </span>
            </div>
          </div>

          {/* Mode Switch & PWA */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToAdvanced}
              type="button"
              className="flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 hover:border-slate-800 shadow-xs transition-all active:scale-95 min-h-[42px]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Gelişmiş Mod</span>
            </button>

            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 sm:px-4 py-4 space-y-4 pb-36">
        {activeTab === 'weddings' && (
          <SimpleWeddingsView weddings={db.weddings} />
        )}

        {activeTab === 'shopping' && (
          <SimpleShoppingView
            shoppingItems={db.shoppingItems}
            weddings={db.weddings}
          />
        )}

        {activeTab === 'balance' && (
          <SimpleBalanceView
            weddings={db.weddings}
            workerPays={db.workerPays}
          />
        )}

        {/* Backup / Export Info */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 px-2 flex-wrap gap-3">
          <span>İnternetsiz çalışır · Veriler telefonunuzdadır</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={db.weddings.length === 0 && db.shoppingItems.length === 0}
              className="flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yedek İndir</span>
            </button>

            <label className="flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Yedek Yükle</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </main>

      {/* 3-Tab Thumb-Zone Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-slate-200 bg-white/95 backdrop-blur-md pb-safe">
        <div className="mx-auto grid max-w-2xl grid-cols-3 h-20 items-stretch px-2 py-1.5 gap-1.5">
          {/* Tab 1: Düğünler */}
          <button
            onClick={() => setActiveTab('weddings')}
            type="button"
            className={`flex flex-col items-center justify-center rounded-2xl py-1 transition-all ${
              activeTab === 'weddings'
                ? 'bg-emerald-50 text-emerald-800 font-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <div className="relative">
              <Calendar className="w-6 h-6 stroke-[2.5]" />
              {activeWeddingsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white shadow-xs">
                  {activeWeddingsCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Düğünlerim</span>
          </button>

          {/* Tab 2: Kağıt Liste & Çizim */}
          <button
            onClick={() => setActiveTab('shopping')}
            type="button"
            className={`flex flex-col items-center justify-center rounded-2xl py-1 transition-all ${
              activeTab === 'shopping'
                ? 'bg-amber-50 text-amber-800 font-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <div className="relative">
              <Camera className="w-6 h-6 stroke-[2.5]" />
              {shoppingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white shadow-xs">
                  {shoppingCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Kağıt Liste</span>
          </button>

          {/* Tab 3: Kasa & Bakiye */}
          <button
            onClick={() => setActiveTab('balance')}
            type="button"
            className={`flex flex-col items-center justify-center rounded-2xl py-1 transition-all ${
              activeTab === 'balance'
                ? 'bg-blue-50 text-blue-800 font-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <div className="relative">
              <Wallet className="w-6 h-6 stroke-[2.5]" />
              {totalReceivables > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-xs mt-1">Mini Kasa</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
