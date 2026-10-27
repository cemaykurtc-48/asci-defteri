'use client';

import React from 'react';
import { Utensils, Calendar as CalendarIcon, ShoppingBag, Wallet } from 'lucide-react';

export type NavTabType = 'jobs' | 'calendar' | 'shopping' | 'ledger';

interface BottomNavProps {
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  activeJobsCount: number;
  pendingShoppingCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  activeJobsCount,
  pendingShoppingCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
      <div className="mx-auto grid max-w-2xl grid-cols-4 items-center h-20 px-1">
        {/* Tab 1: İş Defteri */}
        <button
          onClick={() => onSelectTab('jobs')}
          type="button"
          className={`flex flex-col items-center justify-center min-h-[58px] transition-colors relative ${
            activeTab === 'jobs'
              ? 'text-blue-600 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <Utensils className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'jobs' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight truncate max-w-full">
            1. İşler
          </span>
          {activeJobsCount > 0 && (
            <span className="absolute top-1 right-2 sm:right-6 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
              {activeJobsCount}
            </span>
          )}
        </button>

        {/* Tab 2: Takvim (Boş / Dolu Günler) */}
        <button
          onClick={() => onSelectTab('calendar')}
          type="button"
          className={`flex flex-col items-center justify-center min-h-[58px] transition-colors relative ${
            activeTab === 'calendar'
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'calendar' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight truncate max-w-full">
            2. Takvim
          </span>
        </button>

        {/* Tab 3: Pazar & Alışveriş */}
        <button
          onClick={() => onSelectTab('shopping')}
          type="button"
          className={`flex flex-col items-center justify-center min-h-[58px] transition-colors relative ${
            activeTab === 'shopping'
              ? 'text-emerald-600 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <ShoppingBag className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'shopping' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight truncate max-w-full">
            3. Alışveriş
          </span>
          {pendingShoppingCount > 0 && (
            <span className="absolute top-1 right-2 sm:right-6 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
              {pendingShoppingCount}
            </span>
          )}
        </button>

        {/* Tab 4: Cari Defter & Kasa */}
        <button
          onClick={() => onSelectTab('ledger')}
          type="button"
          className={`flex flex-col items-center justify-center min-h-[58px] transition-colors relative ${
            activeTab === 'ledger'
              ? 'text-slate-900 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'ledger' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] sm:text-xs mt-1 tracking-tight truncate max-w-full">
            4. Kasa
          </span>
        </button>
      </div>
    </nav>
  );
};
