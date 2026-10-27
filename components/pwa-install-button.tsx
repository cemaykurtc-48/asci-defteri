'use client';

import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition-all min-h-[44px]"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Telefona Yükle</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all min-h-[44px]"
        >
          <Smartphone className="w-4 h-4 text-slate-600" />
          <span>iPhone&apos;a Ekle</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Ana Ekrana Nasıl Eklenir?</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-800">1</span>
                <span>Safari tarayıcısının altındaki <strong>Paylaş</strong> (kare içinden çıkan yukarı ok) simgesine dokunun.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-800">2</span>
                <span>Aşağı kaydırıp <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğini seçin.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-800">3</span>
                <span>Sağ üstteki <strong>&quot;Ekle&quot;</strong> butonuna dokunun. Uygulama tıpkı normal bir uygulama gibi telefonunuzda yer alacaktır.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 min-h-[48px]"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
};
