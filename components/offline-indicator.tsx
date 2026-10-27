'use client';

import React from 'react';
import { WifiOff, Cloud } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export const OfflineIndicator: React.FC<{ isSyncing?: boolean }> = ({ isSyncing }) => {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-300">
        <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>Çevrimdışı (Cihaza kaydediliyor)</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Cloud className="w-3.5 h-3.5 animate-bounce text-blue-600" />
        <span>Eşitleniyor...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span>Eşitlendi</span>
    </div>
  );
};
