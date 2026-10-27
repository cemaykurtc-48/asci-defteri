'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  Users,
  Wrench,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  X,
  PlusCircle,
  Coins,
} from 'lucide-react';
import { BalanceEntry } from '@/lib/storage';

interface BalanceModuleProps {
  balances: BalanceEntry[];
  onAddBalance: (balance: Omit<BalanceEntry, 'id' | 'createdAt'>) => void;
  onUpdateBalance: (balance: BalanceEntry) => void;
  onDeleteBalance: (id: string) => void;
  onBack: () => void;
}

export const BalanceModule: React.FC<BalanceModuleProps> = ({
  balances,
  onAddBalance,
  onUpdateBalance,
  onDeleteBalance,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'expense'>('customer');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [paymentModalEntry, setPaymentModalEntry] = useState<BalanceEntry | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [description, setDescription] = useState('');

  const filteredBalances = balances.filter((b) => b.type === activeTab);

  // Totals calculations
  const totalReceivables = balances
    .filter((b) => b.type === 'customer' && b.status === 'open')
    .reduce((sum, b) => sum + b.remainingAmount, 0);

  const totalPayables = balances
    .filter((b) => b.type === 'expense' && b.status === 'open')
    .reduce((sum, b) => sum + b.remainingAmount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalAmount) return;

    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    const remaining = Math.max(0, total - paid);

    onAddBalance({
      type: activeTab,
      name: name.trim(),
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      description: description.trim() || undefined,
      status: remaining <= 0 ? 'settled' : 'open',
    });

    setName('');
    setTotalAmount('');
    setPaidAmount('');
    setDescription('');
    setIsAddOpen(false);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalEntry || !paymentAmount) return;

    const added = parseFloat(paymentAmount) || 0;
    const newPaid = (paymentModalEntry.paidAmount || 0) + added;
    const newRemaining = Math.max(0, paymentModalEntry.totalAmount - newPaid);

    onUpdateBalance({
      ...paymentModalEntry,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newRemaining <= 0 ? 'settled' : 'open',
    });

    setPaymentAmount('');
    setPaymentModalEntry(null);
  };

  const handleSettle = (entry: BalanceEntry) => {
    onUpdateBalance({
      ...entry,
      paidAmount: entry.totalAmount,
      remainingAmount: 0,
      status: 'settled',
    });
  };

  const formatTL = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ana Sayfa</span>
        </button>

        <button
          onClick={() => setIsAddOpen(true)}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>
            {activeTab === 'customer' ? 'Müşteri Kaydı Ekle' : 'Masraf / Ekip Ekle'}
          </span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Kalan Müşteri Alacağı</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-blue-950 font-mono tabular-nums">
            {formatTL(totalReceivables)}
          </div>
          <p className="mt-0.5 text-[11px] text-blue-700">Tahsil edilecek toplam</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Kalan Ekip / Masraf Borcu</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-amber-950 font-mono tabular-nums">
            {formatTL(totalPayables)}
          </div>
          <p className="mt-0.5 text-[11px] text-amber-700">Ödenecek toplam bakiye</p>
        </div>
      </div>

      {/* Two Big Main Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('customer')}
          type="button"
          className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all min-h-[48px] ${
            activeTab === 'customer'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Müşteri Takibi</span>
        </button>

        <button
          onClick={() => setActiveTab('expense')}
          type="button"
          className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all min-h-[48px] ${
            activeTab === 'expense'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Ekip / Masraf Takibi</span>
        </button>
      </div>

      {/* Explanatory banner */}
      <div className="text-xs text-slate-500 px-1 font-medium">
        {activeTab === 'customer'
          ? '📌 Müşteri Takibi: "Kimden ne alındı, geriye ne kalacak?"'
          : '📌 Ekip / Masraf Takibi: "Ustaya / malzemeye ne ödendi, geriye ne borç kaldı?"'}
      </div>

      {/* List of Entries */}
      <div className="space-y-3">
        {filteredBalances.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
            <Wallet className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">
              {activeTab === 'customer' ? 'Henüz Müşteri Kaydı Yok' : 'Henüz Ekip/Masraf Kaydı Yok'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Defterinize yeni bir hesap eklemek için yukarıdaki butona dokunun.
            </p>
          </div>
        ) : (
          filteredBalances.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                entry.status === 'settled'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {entry.name}
                    </h3>
                    {entry.status === 'settled' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Kapandı
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {entry.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`"${entry.name}" kaydını silmek istiyor musunuz?`)) {
                      onDeleteBalance(entry.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-500 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Financial Numbers Bar */}
              <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Toplam Anlaşma</span>
                  <span className="font-bold text-slate-800 font-mono tabular-nums text-sm">
                    {formatTL(entry.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {entry.type === 'customer' ? 'Alınan' : 'Ödenen'}
                  </span>
                  <span className="font-bold text-emerald-700 font-mono tabular-nums text-sm">
                    {formatTL(entry.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Kalan Bakiye</span>
                  <span className={`font-black font-mono tabular-nums text-sm ${
                    entry.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-500'
                  }`}>
                    {formatTL(entry.remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {entry.status === 'open' && (
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalEntry(entry);
                      setPaymentAmount('');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 min-h-[44px]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      {entry.type === 'customer' ? '+ Tahsilat Ekle' : '+ Ödeme Yap'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSettle(entry)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hesabı Kapat</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Add Balance Entry Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  {activeTab === 'customer' ? 'Yeni Müşteri Kaydı' : 'Yeni Ekip / Masraf Kaydı'}
                </h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {activeTab === 'customer' ? 'Müşteri Adı / İş Başlığı *' : 'Usta / Kişi / Firma Adı *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeTab === 'customer' ? 'Örn: Ahmet Bey (Mutfak Dolabı)' : 'Örn: Elektrikçi Salih Usta'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none min-h-[48px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Toplam Tutar (₺) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="15000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {activeTab === 'customer' ? 'Peşin Alınan (₺)' : 'Ödenen (₺)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono min-h-[48px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Açıklama / İş Notu
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Örn: Kapaklar takılınca kalan tutar elden teslim alınacak."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none min-h-[64px]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[48px]"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 min-h-[48px]"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partial Payment Modal */}
      <AnimatePresence>
        {paymentModalEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  {paymentModalEntry.type === 'customer' ? 'Tahsilat Ekle' : 'Ödeme Ekle'}
                </h3>
                <button
                  onClick={() => setPaymentModalEntry(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPayment} className="mt-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="font-bold text-slate-900 text-sm">{paymentModalEntry.name}</div>
                  <div className="mt-1">
                    Kalan Tutar:{' '}
                    <span className="font-bold text-rose-600 font-mono">
                      {formatTL(paymentModalEntry.remainingAmount)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {paymentModalEntry.type === 'customer' ? 'Alınan Tutar (₺) *' : 'Ödenen Tutar (₺) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    autoFocus
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Örn: 2000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono min-h-[48px]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalEntry(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 min-h-[48px]"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 min-h-[48px]"
                  >
                    Düş & Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
