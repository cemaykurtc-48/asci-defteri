'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Users,
  Plus,
  CheckCircle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Trash2,
} from 'lucide-react';
import {
  SimpleWedding,
  SimpleWorkerPay,
  formatTL,
  formatDateTurkish,
  saveSimpleDatabase,
  getSimpleDbSnapshot,
} from '@/lib/simple-cook-storage';

interface SimpleBalanceViewProps {
  weddings: SimpleWedding[];
  workerPays: SimpleWorkerPay[];
}

export const SimpleBalanceView: React.FC<SimpleBalanceViewProps> = ({
  weddings,
  workerPays,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receivables' | 'workers'>('receivables');

  // Modal for receiving payment from a wedding
  const [payingWedding, setPayingWedding] = useState<SimpleWedding | null>(null);
  const [incomingAmount, setIncomingAmount] = useState<number | ''>('');

  // Modal for adding/editing a worker
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [agreedWage, setAgreedWage] = useState<number | ''>('');
  const [paidWage, setPaidWage] = useState<number | ''>('');
  const [selectedWeddingForWorker, setSelectedWeddingForWorker] = useState('');

  // Totals
  const totalReceivables = weddings.reduce((sum, w) => {
    const remaining = Math.max(0, (w.agreedAmount || 0) - (w.receivedDeposit || 0));
    return sum + remaining;
  }, 0);

  const totalWorkerDebts = workerPays.reduce((sum, p) => {
    const remaining = Math.max(0, (p.agreedWage || 0) - (p.paidAmount || 0));
    return sum + remaining;
  }, 0);

  // Handle wedding deposit addition
  const handleSaveIncomingPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingWedding || !incomingAmount || Number(incomingAmount) <= 0) return;

    const currentDb = getSimpleDbSnapshot();
    const updated = currentDb.weddings.map((w) =>
      w.id === payingWedding.id
        ? {
            ...w,
            receivedDeposit: (w.receivedDeposit || 0) + Number(incomingAmount),
          }
        : w
    );
    saveSimpleDatabase({ ...currentDb, weddings: updated });
    setPayingWedding(null);
    setIncomingAmount('');
  };

  // Handle adding new worker wage
  const handleSaveWorkerPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) {
      alert('Lütfen çalışan adını yazın.');
      return;
    }

    const matchedWedding = weddings.find((w) => w.id === selectedWeddingForWorker);
    const newWorker: SimpleWorkerPay = {
      id: 'work_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      weddingId: selectedWeddingForWorker || undefined,
      weddingTitle: matchedWedding?.title || undefined,
      workerName: workerName.trim(),
      agreedWage: Number(agreedWage) || 0,
      paidAmount: Number(paidWage) || 0,
      date: new Date().toISOString().split('T')[0],
    };

    const currentDb = getSimpleDbSnapshot();
    saveSimpleDatabase({
      ...currentDb,
      workerPays: [newWorker, ...currentDb.workerPays],
    });

    setIsWorkerModalOpen(false);
    setWorkerName('');
    setAgreedWage('');
    setPaidWage('');
    setSelectedWeddingForWorker('');
  };

  // Quick pay to worker
  const handlePayWorker = (workerId: string) => {
    const amountStr = prompt('Bu kişiye ne kadar ödeme yapıldı? (TL):');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    const currentDb = getSimpleDbSnapshot();
    const updated = currentDb.workerPays.map((p) =>
      p.id === workerId ? { ...p, paidAmount: (p.paidAmount || 0) + amount } : p
    );
    saveSimpleDatabase({ ...currentDb, workerPays: updated });
  };

  // Delete worker row
  const handleDeleteWorker = (workerId: string) => {
    if (!confirm('Bu yevmiye kaydı silinsin mi?')) return;
    const currentDb = getSimpleDbSnapshot();
    const updated = currentDb.workerPays.filter((p) => p.id !== workerId);
    saveSimpleDatabase({ ...currentDb, workerPays: updated });
  };

  return (
    <div className="space-y-4">
      {/* 2 Big Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Receivables summary */}
        <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-500 p-4 text-white shadow-md">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Müşteriden Kalan</span>
          </span>
          <div className="mt-1 text-xl sm:text-2xl font-black font-mono tabular-nums">
            {formatTL(totalReceivables)}
          </div>
          <span className="text-[10px] font-bold text-emerald-100">
            Düğün Alacakları
          </span>
        </div>

        {/* Worker debt summary */}
        <div className="rounded-3xl border-2 border-amber-600 bg-amber-600 p-4 text-white shadow-md">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-100 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Ekibe Kalan Borç</span>
          </span>
          <div className="mt-1 text-xl sm:text-2xl font-black font-mono tabular-nums">
            {formatTL(totalWorkerDebts)}
          </div>
          <span className="text-[10px] font-bold text-amber-100">
            Yevmiye Borçları
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/90 rounded-3xl">
        <button
          onClick={() => setActiveSubTab('receivables')}
          type="button"
          className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all min-h-[52px] ${
            activeSubTab === 'receivables'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-5 h-5 text-emerald-600" />
          <span>Düğün Alacakları</span>
        </button>

        <button
          onClick={() => setActiveSubTab('workers')}
          type="button"
          className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all min-h-[52px] ${
            activeSubTab === 'workers'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5 text-amber-600" />
          <span>Ekip Yevmiyeleri</span>
        </button>
      </div>

      {/* ================= SECTION 1: MÜŞTERİ ALACAKLARI ================= */}
      {activeSubTab === 'receivables' && (
        <div className="space-y-3">
          {weddings.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Henüz defterde kayıtlı düğün bulunmuyor.
            </div>
          ) : (
            weddings.map((w) => {
              const remaining = Math.max(0, (w.agreedAmount || 0) - (w.receivedDeposit || 0));
              const isPaidInFull = remaining === 0;

              return (
                <div
                  key={w.id}
                  className={`rounded-3xl border-2 bg-white p-4 shadow-sm space-y-3 ${
                    isPaidInFull ? 'border-slate-200 opacity-75' : 'border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        {w.title}
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        {formatDateTurkish(w.date)}
                      </span>
                    </div>

                    {isPaidInFull ? (
                      <span className="rounded-xl bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black">
                        Tamamı Alındı ✓
                      </span>
                    ) : (
                      <span className="rounded-xl bg-amber-100 text-amber-900 px-3 py-1 text-xs font-black">
                        Bekleyen Var
                      </span>
                    )}
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Anlaşılan</span>
                      <div className="text-sm font-black font-mono text-slate-800">{formatTL(w.agreedAmount)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Alınan</span>
                      <div className="text-sm font-black font-mono text-blue-600">{formatTL(w.receivedDeposit)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Kalan</span>
                      <div className="text-sm font-black font-mono text-emerald-600">{formatTL(remaining)}</div>
                    </div>
                  </div>

                  {/* Add Payment Button */}
                  {!isPaidInFull && (
                    <button
                      onClick={() => {
                        setPayingWedding(w);
                        setIncomingAmount(remaining);
                      }}
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 px-4 text-sm font-black text-white shadow-md hover:bg-emerald-700 active:scale-98 transition-all min-h-[48px]"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Para Aldım (Tahsilat Ekle)</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= SECTION 2: EKİP YEVMİYELERİ ================= */}
      {activeSubTab === 'workers' && (
        <div className="space-y-3">
          {/* Top Add Worker Button */}
          <button
            onClick={() => setIsWorkerModalOpen(true)}
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 px-4 text-base font-black text-white shadow-md hover:bg-amber-700 active:scale-98 transition-all min-h-[52px]"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Yeni Yevmiyeci / Yardımcı Ekle</span>
          </button>

          {workerPays.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Henüz kayıtlı yevmiyeci veya çırak bulunmuyor.
            </div>
          ) : (
            workerPays.map((p) => {
              const remaining = Math.max(0, (p.agreedWage || 0) - (p.paidAmount || 0));
              const isPaid = remaining === 0;

              return (
                <div
                  key={p.id}
                  className={`rounded-3xl border-2 bg-white p-4 shadow-sm space-y-3 ${
                    isPaid ? 'border-slate-200 opacity-75' : 'border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        {p.workerName}
                      </h4>
                      {p.weddingTitle && (
                        <span className="text-xs font-bold text-slate-500">
                          {p.weddingTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPaid ? (
                        <span className="rounded-xl bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black">
                          Ödendi ✓
                        </span>
                      ) : (
                        <span className="rounded-xl bg-rose-100 text-rose-800 px-3 py-1 text-xs font-black">
                          {formatTL(remaining)} Kalan
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteWorker(p.id)}
                        type="button"
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Yevmiye</span>
                      <div className="text-sm font-black font-mono text-slate-800">{formatTL(p.agreedWage)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Ödenen</span>
                      <div className="text-sm font-black font-mono text-blue-600">{formatTL(p.paidAmount)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Borç</span>
                      <div className="text-sm font-black font-mono text-rose-600">{formatTL(remaining)}</div>
                    </div>
                  </div>

                  {/* Pay button */}
                  {!isPaid && (
                    <button
                      onClick={() => handlePayWorker(p.id)}
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 px-4 text-sm font-black text-white shadow-md hover:bg-amber-700 active:scale-98 transition-all min-h-[46px]"
                    >
                      <DollarSign className="w-4 h-4 stroke-[3]" />
                      <span>Ödeme Yap</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Payment Modal for Wedding */}
      {payingWedding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">
              Para Girişi (Tahsilat)
            </h3>
            <p className="text-sm font-bold text-slate-600">
              {payingWedding.title} için alınan para miktarını yazın:
            </p>

            <form onSubmit={handleSaveIncomingPayment} className="space-y-4">
              <input
                type="number"
                required
                min="1"
                step="100"
                value={incomingAmount}
                onChange={(e) => setIncomingAmount(Number(e.target.value))}
                placeholder="Örn: 5000"
                className="w-full rounded-2xl border-2 border-slate-300 p-4 text-xl font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPayingWedding(null)}
                  className="w-1/3 rounded-2xl border-2 border-slate-300 py-3 text-sm font-bold text-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="w-2/3 rounded-2xl bg-emerald-600 py-3 text-base font-black text-white shadow-md hover:bg-emerald-700"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Adding Worker */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                Yeni Yevmiyeci / Yardımcı
              </h3>
              <button
                onClick={() => setIsWorkerModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorkerPay} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Çalışan Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Mehmet Çırak veya Fatma Abla"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-black text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {weddings.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Hangi Düğün İçin Çalıştı? (İsteğe Bağlı)
                  </label>
                  <select
                    value={selectedWeddingForWorker}
                    onChange={(e) => setSelectedWeddingForWorker(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Genel / Bağlantısız</option>
                    {weddings.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title} ({w.date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Anlaşılan Yevmiye (TL) *
                  </label>
                  <input
                    type="number"
                    required
                    step="100"
                    placeholder="1500"
                    value={agreedWage}
                    onChange={(e) => setAgreedWage(Number(e.target.value))}
                    className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-black text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Verilen Peşinat (TL)
                  </label>
                  <input
                    type="number"
                    step="100"
                    placeholder="0"
                    value={paidWage}
                    onChange={(e) => setPaidWage(Number(e.target.value))}
                    className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-black text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="w-1/3 rounded-2xl border-2 border-slate-300 py-3.5 text-base font-bold text-slate-700"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="w-2/3 rounded-2xl bg-amber-600 py-3.5 text-base font-black text-white shadow-md hover:bg-amber-700"
                >
                  Yevmiyeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
