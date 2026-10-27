'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Trash2,
  X,
  Flame,
  Fuel,
  Wrench,
  HelpCircle,
  TrendingUp,
  Briefcase,
  Users,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import {
  CookJob,
  GeneralTransaction,
  formatTL,
  getNetCashBalance,
  getTotalReceivables,
  getShoppingExpense,
} from '@/lib/cook-storage';

interface LedgerScreenProps {
  jobs: CookJob[];
  generalTransactions: GeneralTransaction[];
  onAddGeneralTransaction: (
    t: Omit<GeneralTransaction, 'id'>,
    linkToJob?: boolean
  ) => void;
  onDeleteGeneralTransaction: (id: string) => void;
}

interface UnifiedEntry {
  id: string;
  type: 'income' | 'expense';
  title: string;
  subtitle?: string;
  amount: number;
  date: string;
  isGeneral?: boolean;
  category?: string;
}

export const LedgerScreen: React.FC<LedgerScreenProps> = ({
  jobs,
  generalTransactions,
  onAddGeneralTransaction,
  onDeleteGeneralTransaction,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [transType, setTransType] = useState<'expense' | 'income'>('expense');
  const [transCategory, setTransCategory] = useState<GeneralTransaction['category']>('tup');
  const [transTitle, setTransTitle] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transDate, setTransDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedJobId, setSelectedJobId] = useState<string>(''); // '' means General / Esnaf kasası

  // Net Cash & Receivables
  const netCash = getNetCashBalance(jobs, generalTransactions);
  const totalReceivables = getTotalReceivables(jobs);

  // Build unified chronological timeline of all income and expense events
  const unifiedEntries: UnifiedEntry[] = [];

  // 1. General transactions recorded manually in ledger
  generalTransactions.forEach((t) => {
    let catLabel = 'Genel';
    if (t.category === 'tup') catLabel = 'Tüp Gazı';
    else if (t.category === 'mazot') catLabel = 'Mazot / Nakliye';
    else if (t.category === 'tamir') catLabel = 'Kazan / Ekipman';
    else if (t.category === 'avans') catLabel = 'Kapora / Avans';
    else if (t.category === 'tahsilat') catLabel = 'Tahsilat';
    else if (t.category === 'ekip') catLabel = 'Yevmiye';
    else if (t.category === 'ekstra_gelir') catLabel = 'Ekstra / Bahşiş';

    unifiedEntries.push({
      id: t.id,
      type: t.type,
      title: t.title,
      subtitle: t.jobTitle ? `${catLabel} • ${t.jobTitle}` : catLabel,
      amount: t.amount,
      date: t.date,
      isGeneral: true,
      category: t.category,
    });
  });

  // 2. Job payments (Incomes automatically recorded from jobs)
  jobs.forEach((j) => {
    (j.payments || []).forEach((p) => {
      unifiedEntries.push({
        id: p.id,
        type: 'income',
        title: p.note || 'Düğün Tahsilatı',
        subtitle: j.title,
        amount: p.amount,
        date: p.date,
        isGeneral: false,
      });
    });

    // 3. Job market expenses (Expenses)
    const marketCost = getShoppingExpense(j);
    if (j.shoppingByCook && marketCost > 0) {
      unifiedEntries.push({
        id: 'shop_exp_' + j.id,
        type: 'expense',
        title: 'Pazar & Malzeme Masrafı',
        subtitle: j.title,
        amount: marketCost,
        date: j.date,
        isGeneral: false,
      });
    }

    // 4. Job assistant wages (Expenses)
    (j.assistants || []).forEach((ast) => {
      if (ast.wage > 0) {
        unifiedEntries.push({
          id: 'ast_' + ast.id,
          type: 'expense',
          title: `Çırak Yevmiyesi (${ast.name})`,
          subtitle: j.title,
          amount: ast.wage,
          date: j.date,
          isGeneral: false,
        });
      }
    });
  });

  // Sort chronological descending
  unifiedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter
  const filteredEntries = unifiedEntries.filter((e) => {
    if (filterType === 'income') return e.type === 'income';
    if (filterType === 'expense') return e.type === 'expense';
    return true;
  });

  const openAddModal = (type: 'expense' | 'income') => {
    setTransType(type);
    if (type === 'expense') {
      setTransCategory('tup');
      setTransTitle('Tüp Gazı');
    } else {
      setTransCategory('avans');
      setTransTitle('Kapora Tahsilatı');
    }
    setTransAmount('');
    setSelectedJobId('');
    setTransDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleCreateTransaction = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = Number(transAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Lütfen geçerli bir tutar yazın.');
      return;
    }

    // Default title if empty
    let finalTitle = transTitle.trim();
    if (!finalTitle) {
      if (transType === 'expense') {
        finalTitle =
          transCategory === 'tup'
            ? 'Tüp Masrafı'
            : transCategory === 'mazot'
            ? 'Mazot / Nakliye Masrafı'
            : transCategory === 'tamir'
            ? 'Kazan / Tamir Masrafı'
            : 'Genel Masraf';
      } else {
        finalTitle =
          transCategory === 'avans'
            ? 'Kapora Alındı'
            : transCategory === 'tahsilat'
            ? 'Bakiye Tahsilatı'
            : 'Kasa Girişi';
      }
    }

    const linkedJob = jobs.find((j) => j.id === selectedJobId);

    onAddGeneralTransaction(
      {
        type: transType,
        category: transCategory,
        title: finalTitle,
        amount: amountNum,
        date: transDate || new Date().toISOString().split('T')[0],
        jobId: linkedJob?.id,
        jobTitle: linkedJob?.title,
      },
      !!linkedJob // flag to link to job payments if applicable
    );

    setTransTitle('');
    setTransAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* 1. Big Financial Kasa Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Kasadaki Net Nakit */}
        <div className="rounded-3xl border-2 border-slate-900 bg-slate-900 p-5 text-white shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>Kasamdaki Net Nakit</span>
          </div>
          <div
            className={`text-3xl sm:text-4xl font-black font-mono tabular-nums leading-none ${
              netCash >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatTL(netCash)}
          </div>
          <p className="text-xs text-slate-400">
            (Alınan tüm paralar - Pazar, çırak, tüp, mazot vb. tüm masraflar)
          </p>
        </div>

        {/* Bekleyen Toplam Alacak */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Coins className="w-4 h-4 text-blue-600" />
            <span>Düğünlerden Kalan Alacak</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-slate-900 leading-none">
            {formatTL(totalReceivables)}
          </div>
          <p className="text-xs text-slate-500">
            Aktif işlerden henüz tahsil edilmemiş toplam para
          </p>
        </div>
      </div>

      {/* 2. Dual Big Action Buttons: Para Girişi vs Masraf Yaz */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Green: Para Girişi / Gelir Ekle */}
        <button
          type="button"
          onClick={() => openAddModal('income')}
          className="flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-4 text-base sm:text-lg font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition-all min-h-[58px]"
        >
          <ArrowDownRight className="w-6 h-6 stroke-[3]" />
          <span>➕ Para Girişi / Tahsilat Yaz</span>
        </button>

        {/* Red: Gider / Masraf Yaz */}
        <button
          type="button"
          onClick={() => openAddModal('expense')}
          className="flex items-center justify-center gap-2.5 rounded-2xl bg-rose-600 px-4 py-4 text-base sm:text-lg font-black text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 active:scale-98 transition-all min-h-[58px]"
        >
          <ArrowUpRight className="w-6 h-6 stroke-[3]" />
          <span>➖ Masraf / Gider Yaz (Tüp, Mazot)</span>
        </button>
      </div>

      {/* 3. Filter Segmented Controls */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/90 rounded-2xl text-xs sm:text-sm font-bold">
        <button
          onClick={() => setFilterType('all')}
          type="button"
          className={`py-3 rounded-xl transition-all min-h-[48px] ${
            filterType === 'all'
              ? 'bg-white text-slate-900 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tümü ({unifiedEntries.length})
        </button>

        <button
          onClick={() => setFilterType('income')}
          type="button"
          className={`py-3 rounded-xl transition-all min-h-[48px] ${
            filterType === 'income'
              ? 'bg-white text-emerald-800 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Gelirler (+)
        </button>

        <button
          onClick={() => setFilterType('expense')}
          type="button"
          className={`py-3 rounded-xl transition-all min-h-[48px] ${
            filterType === 'expense'
              ? 'bg-white text-rose-800 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Giderler (-)
        </button>
      </div>

      {/* 4. Unified Timeline List */}
      <div className="space-y-2.5">
        {filteredEntries.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-400">
            Cari defterde henüz kayıtlı bir gelir veya gider hareketi bulunmuyor.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    entry.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {entry.type === 'income' ? (
                    <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-base font-black text-slate-900 truncate">
                    {entry.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-0.5">
                    <span>{entry.date}</span>
                    {entry.subtitle && (
                      <>
                        <span>•</span>
                        <span className="truncate text-slate-600 font-bold">{entry.subtitle}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                    entry.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {entry.type === 'income' ? '+' : '-'} {formatTL(entry.amount)}
                </span>

                {entry.isGeneral && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`"${entry.title}" kaydını silmek istiyor musunuz?`)) {
                        onDeleteGeneralTransaction(entry.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Kaydı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Add Transaction Modal (Mobile Optimized) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-white ${
                      transType === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {transType === 'income' ? '+' : '-'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {transType === 'income' ? 'Yeni Para Girişi (Gelir)' : 'Yeni Masraf (Gider)'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="mt-4 space-y-4">
                {/* 1. Transaction Type Toggle (Income vs Expense) */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTransType('expense');
                      setTransCategory('tup');
                      if (!transTitle || transTitle === 'Kapora Tahsilatı') setTransTitle('Tüp Gazı');
                    }}
                    className={`py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all ${
                      transType === 'expense'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                    <span>Gider / Masraf</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTransType('income');
                      setTransCategory('avans');
                      if (!transTitle || transTitle === 'Tüp Gazı') setTransTitle('Kapora Tahsilatı');
                    }}
                    className={`py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all ${
                      transType === 'income'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                    <span>Para Girişi (Gelir)</span>
                  </button>
                </div>

                {/* 2. Job Selection (Tied to a Job or General) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hangi İşe Ait? (Cari Seçimi)</span>
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none min-h-[52px]"
                  >
                    <option value="">🏢 Genel Kasa / Seyyar Masrafı (İşten Bağımsız)</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        🍽️ {job.title} ({job.guestCount} Kişi - {job.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Quick Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Hızlı Kategori
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {transType === 'expense' ? (
                      [
                        { key: 'tup', label: 'Tüp Gazı', icon: Flame },
                        { key: 'mazot', label: 'Mazot / Nakliye', icon: Fuel },
                        { key: 'tamir', label: 'Kazan / Ekipman', icon: Wrench },
                        { key: 'ekip', label: 'Ekstra Yevmiye', icon: Users },
                        { key: 'diger', label: 'Diğer Masraf', icon: HelpCircle },
                      ].map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = transCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => {
                              setTransCategory(cat.key as any);
                              setTransTitle(cat.label);
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 font-bold text-xs transition-all min-h-[46px] ${
                              isSelected
                                ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0 text-rose-600" />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })
                    ) : (
                      [
                        { key: 'avans', label: 'Kapora / Avans', icon: Coins },
                        { key: 'tahsilat', label: 'Kalan Bakiye', icon: CheckCircle },
                        { key: 'ekstra_gelir', label: 'Bahşiş / Ekstra', icon: Sparkles },
                        { key: 'diger', label: 'Diğer Gelir', icon: TrendingUp },
                      ].map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = transCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => {
                              setTransCategory(cat.key as any);
                              setTransTitle(cat.label);
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 font-bold text-xs transition-all min-h-[46px] ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. Description and Date - Side by Side on Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={transTitle}
                      onChange={(e) => setTransTitle(e.target.value)}
                      placeholder={transType === 'expense' ? 'Örn: 2 Adet Sanayi Tüpü' : 'Örn: Düğün Kaporası'}
                      className="w-full rounded-2xl border-2 border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none min-h-[50px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tarih
                    </label>
                    <input
                      type="date"
                      required
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                      className="w-full rounded-2xl border-2 border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 min-h-[50px]"
                    />
                  </div>
                </div>

                {/* 5. Tutar (₺) Input and Quick Preset Amounts */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Tutar (₺) *
                    </label>
                    <span className="text-[11px] font-bold text-slate-400">
                      Hızlı seçebilir veya yazabilirsiniz
                    </span>
                  </div>

                  <input
                    type="number"
                    min="1"
                    step="50"
                    required
                    value={transAmount}
                    onChange={(e) => setTransAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border-2 border-slate-400 bg-white px-4 py-3.5 text-2xl font-black font-mono text-slate-900 focus:border-blue-600 focus:outline-none min-h-[56px]"
                  />

                  {/* Fast amount buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {['500', '1000', '2500', '5000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTransAmount(amt)}
                        className="py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-black text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
                      >
                        +{amt} ₺
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-2xl border-2 border-slate-200 py-3.5 text-sm font-bold text-slate-600 min-h-[52px]"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateTransaction()}
                    className={`flex-1 rounded-2xl py-3.5 text-base font-black text-white shadow-md active:scale-98 transition-all min-h-[52px] ${
                      transType === 'income'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    }`}
                  >
                    Deftere Kaydet
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
