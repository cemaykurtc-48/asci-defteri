'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Trash2,
  Send,
  RotateCcw,
  UserCheck,
  ShoppingBag,
  Coins,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CookJob,
  PaymentRecord,
  formatTL,
  formatCookDate,
  getAssistantTotal,
  getShoppingExpense,
  getTotalExpenses,
  getTotalPaid,
  getRemainingBalance,
  getNetProfit,
} from '@/lib/cook-storage';
import { MarketModal } from './market-modal';

interface JobDetailModalProps {
  job: CookJob | null;
  onClose: () => void;
  onUpdateJob: (updatedJob: CookJob) => void;
  onToggleStatus: (id: string) => void;
  onDeleteJob: (id: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onUpdateJob,
  onToggleStatus,
  onDeleteJob,
}) => {
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  // New Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');

  if (!job) return null;

  const totalPaid = getTotalPaid(job);
  const remaining = getRemainingBalance(job);
  const assistantTotal = getAssistantTotal(job);
  const shoppingExpense = getShoppingExpense(job);
  const totalExpenses = getTotalExpenses(job);
  const netProfit = getNetProfit(job);

  const purchasedCount = (job.ingredients || []).filter((i) => i.purchased).length;
  const totalIngredientsCount = (job.ingredients || []).length;

  const handleCompleteToggle = () => {
    onToggleStatus(job.id);
    if (job.status === 'active') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;

    const newPayment: PaymentRecord = {
      id: 'pay_' + Date.now().toString(36),
      amount: Number(payAmount) || 0,
      date: payDate,
      note: payNote.trim() || 'Tahsilat',
    };

    const updatedJob: CookJob = {
      ...job,
      payments: [...(job.payments || []), newPayment],
    };

    onUpdateJob(updatedJob);
    setPayAmount('');
    setPayNote('');
    setIsAddPaymentOpen(false);

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleDeletePayment = (payId: string) => {
    const updatedJob: CookJob = {
      ...job,
      payments: (job.payments || []).filter((p) => p.id !== payId),
    };
    onUpdateJob(updatedJob);
  };

  // WhatsApp full summary share
  const handleShareWhatsApp = () => {
    let text = `🍽️ *${job.title} - İş & Hesap Özeti*\n\n`;
    text += `📅 Tarih: ${formatCookDate(job.date)}\n`;
    text += `👥 Kişi Sayısı: ${job.guestCount} Kişilik\n`;
    if (job.location) text += `📍 Yer: ${job.location}\n`;

    text += `\n💰 Anlaşılan Toplam: ${formatTL(job.totalPrice)}\n`;
    text += `✅ Yapılan Tahsilat: ${formatTL(totalPaid)}\n`;
    text += `📌 *Kalan Bakiye:* ${formatTL(remaining)}\n`;

    if (job.ingredients && job.ingredients.length > 0) {
      text += `\n📋 *Malzeme Durumu:* (${purchasedCount}/${totalIngredientsCount} Alındı)\n`;
    }

    text += `\n_Usta Aşçı Defteri ile gönderildi._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-start justify-between">
            <div className="pr-4 min-w-0">
              <span
                className={`inline-block text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                  job.status === 'active'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {job.status === 'active' ? '⚡ Aktif Düğün / Yemek' : '✅ Tamamlandı'}
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {job.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 min-h-[44px]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800">
            {/* Key Info Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                <Calendar className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-400">Yemek Tarihi</div>
                  <div className="text-base font-bold text-slate-900">
                    {formatCookDate(job.date)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                <Users className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-400">Kişi Sayısı</div>
                  <div className="text-base font-bold text-slate-900">
                    {job.guestCount} Kişilik
                  </div>
                </div>
              </div>
            </div>

            {job.location && (
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-400">Yer / Adres</div>
                  <div className="text-sm font-semibold text-slate-900">{job.location}</div>
                </div>
              </div>
            )}

            {/* Market & Malzeme Gidiş Butonu */}
            <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50/80 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                  <span className="text-sm font-black text-emerald-950">
                    Pazar & Malzeme Listesi
                  </span>
                </div>
                <span className="rounded-xl bg-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-900">
                  {purchasedCount} / {totalIngredientsCount} Alındı
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-emerald-900">
                <span>
                  {job.shoppingByCook
                    ? `Usta Pazarı Yapacak (Masraf: ${formatTL(shoppingExpense)})`
                    : 'Malzemeyi Ev Sahibi Temin Edecek'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMarketOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition-all min-h-[50px]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Pazar / Hal Listesini Aç & Tik At</span>
              </button>
            </div>

            {/* Cari Tahsilat Günlüğü ("Ne zaman ne kadar ödeme aldım?") */}
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-black text-slate-900">
                    Cari Tahsilat Günlüğü
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-700">
                  Toplam Alınan: {formatTL(totalPaid)}
                </span>
              </div>

              {/* Payment list */}
              <div className="space-y-2">
                {(job.payments || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">
                    Henüz kayıtlı bir tahsilat veya kapora bulunmuyor.
                  </p>
                ) : (
                  job.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.note || 'Tahsilat'}</div>
                        <div className="text-[11px] text-slate-400">{p.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-emerald-700">
                          +{formatTL(p.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p.id)}
                          className="text-slate-400 hover:text-red-600 p-1 min-h-[36px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Payment Button */}
              <button
                type="button"
                onClick={() => setIsAddPaymentOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Yeni Tahsilat / Avans Ekle</span>
              </button>
            </div>

            {/* Ekip & Yevmiyeler */}
            <div className="rounded-2xl border-2 border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
                <span>Ekiptekiler ({(job.assistants || []).length} Kişi)</span>
                <span className="font-mono text-blue-900 font-bold">
                  Toplam: {formatTL(assistantTotal)}
                </span>
              </div>
              {(job.assistants || []).length === 0 ? (
                <p className="text-xs text-slate-400">Tek başına çalışılacak (Yardımcı yok).</p>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {job.assistants.map((ast) => (
                    <div
                      key={ast.id}
                      className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        {ast.name}
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatTL(ast.wage)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Büyük Finans & Kalan Bakiye Kutusu */}
            <div className="rounded-3xl border-2 border-slate-900 bg-slate-900 p-5 text-white space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Anlaşılan Toplam Ücret:</span>
                <span className="font-bold font-mono text-base">{formatTL(job.totalPrice)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Toplam Yapılan Tahsilat:</span>
                <span className="font-bold font-mono text-base text-emerald-400">
                  - {formatTL(totalPaid)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-300">
                  Masraflar ({formatTL(assistantTotal)} Ekip + {formatTL(shoppingExpense)} Pazar):
                </span>
                <span className="font-bold font-mono text-base text-rose-400">
                  - {formatTL(totalExpenses)}
                </span>
              </div>

              <div className="pt-1">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Ev Sahibinden Kalan Alacak Bakiye
                </div>
                <div className="mt-1 text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                  {formatTL(remaining)}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Ustanın Net Kalan Kârı:</span>
                </span>
                <span className="font-bold text-base text-emerald-300 font-mono">
                  {formatTL(netProfit)}
                </span>
              </div>
            </div>

            {job.notes && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-950">
                <span className="font-bold block mb-1">Özel Not:</span>
                {job.notes}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 bg-white p-4 space-y-2">
            <button
              type="button"
              onClick={handleCompleteToggle}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base sm:text-lg font-black text-white shadow-lg active:scale-98 transition-all min-h-[56px] ${
                job.status === 'active'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-slate-700 hover:bg-slate-800'
              }`}
            >
              {job.status === 'active' ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>İşi Tamamla / Arşive Al</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  <span>Tekrar Aktif İşlere Döndür</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
              >
                <Send className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Hesap Özeti</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${job.title}" kaydını defterden silmek istiyor musunuz?`)) {
                    onDeleteJob(job.id);
                    onClose();
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sil</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Market Modal */}
      {isMarketOpen && (
        <MarketModal
          job={job}
          isOpen={isMarketOpen}
          onClose={() => setIsMarketOpen(false)}
          onUpdateJob={onUpdateJob}
        />
      )}

      {/* Add Payment Modal */}
      <AnimatePresence>
        {isAddPaymentOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Yeni Tahsilat / Ödeme Alındı
                </h3>
                <button
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 min-h-[44px]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPaymentSubmit} className="mt-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                  <div className="mt-1">
                    Kalan Alacak:{' '}
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatTL(remaining)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alınan Tutar (₺) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="500"
                    required
                    autoFocus
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Örn: 5000"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-xl font-bold font-mono text-slate-900 focus:border-blue-600 focus:outline-none min-h-[50px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahsilat Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Açıklama (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Örn: Düğün günü elden nakit alındı"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 min-h-[48px]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 min-h-[48px]"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 min-h-[48px]"
                  >
                    Tahsilatı Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
