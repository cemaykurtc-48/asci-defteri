'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  MapPin,
  Gift,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  X,
  Share2,
} from 'lucide-react';
import { Wedding } from '@/lib/storage';

interface WeddingModuleProps {
  weddings: Wedding[];
  onAddWedding: (wedding: Omit<Wedding, 'id' | 'createdAt'>) => void;
  onUpdateWedding: (wedding: Wedding) => void;
  onDeleteWedding: (id: string) => void;
  onBack: () => void;
}

export const WeddingModule: React.FC<WeddingModuleProps> = ({
  weddings,
  onAddWedding,
  onUpdateWedding,
  onDeleteWedding,
  onBack,
}) => {
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  // Sort weddings chronologically
  const sortedWeddings = [...weddings].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const getDaysRemainingText = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Bugün!', badgeClass: 'bg-rose-500 text-white animate-pulse' };
    if (diffDays === 1) return { label: 'Yarın!', badgeClass: 'bg-amber-500 text-white' };
    if (diffDays > 1) return { label: `${diffDays} gün kaldı`, badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200' };
    return { label: 'Geçti', badgeClass: 'bg-slate-100 text-slate-500' };
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onAddWedding({
      title: title.trim(),
      date,
      time: time.trim() || undefined,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
      completed: false,
    });

    setTitle('');
    setDate('');
    setTime('19:00');
    setLocation('');
    setNote('');
    setIsAddOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          weekday: 'long',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const shareWedding = (w: Wedding) => {
    const text = `🎉 *Düğün Hatırlatması*\n\n💍 *${w.title}*\n📅 Tarih: ${w.date} ${w.time ? 'Saat: ' + w.time : ''}\n📍 Yer: ${w.location || 'Belirtilmedi'}\n🎁 Not: ${w.note || 'Yok'}\n\nKolayDefter ile kaydedildi.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
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
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Düğün Ekle</span>
        </button>
      </div>

      {/* Module Title Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Düğün & Merasim Takvimi</h2>
            <p className="text-xs text-rose-100 mt-0.5">
              Yaklaşan tüm merasimler tarih sırasına göre listelenir
            </p>
          </div>
        </div>
      </div>

      {/* List of Weddings */}
      {sortedWeddings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">Kayıtlı Düğün Yok</h3>
          <p className="mt-1 text-sm text-slate-500">
            Yaklaşan bir düğün veya merasim eklemek için butona dokunun.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Düğünü Ekle</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedWeddings.map((w) => {
            const { label, badgeClass } = getDaysRemainingText(w.date);
            const dateParts = w.date.split('-');
            const dayNum = dateParts[2] || '01';
            const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            const monthText = monthNames[Number(dateParts[1]) - 1] || 'Ay';

            return (
              <motion.div
                key={w.id}
                layout
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedWedding(w)}
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm transition-all bg-white hover:border-rose-300 ${
                  w.completed ? 'opacity-60 border-slate-200' : 'border-slate-200'
                }`}
              >
                {/* Date Calendar Square */}
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                    {monthText}
                  </span>
                  <span className="text-2xl font-black leading-none">{dayNum}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-base font-bold truncate ${w.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {w.title}
                    </h3>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {w.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{w.time}</span>
                      </span>
                    )}
                    {w.location && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{w.location}</span>
                      </span>
                    )}
                  </div>

                  {w.note && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-0.5 w-fit">
                      <Gift className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[220px]">{w.note}</span>
                    </div>
                  )}
                </div>

                {/* Remaining Badge */}
                <div className="shrink-0 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                    {label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedWedding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    Düğün Detayı
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedWedding.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedWedding(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-slate-700">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Calendar className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Tarih</div>
                    <div className="font-semibold text-slate-900">
                      {formatDisplayDate(selectedWedding.date)}
                    </div>
                  </div>
                </div>

                {selectedWedding.time && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <Clock className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">Saat</div>
                      <div className="font-semibold text-slate-900">
                        {selectedWedding.time}
                      </div>
                    </div>
                  </div>
                )}

                {selectedWedding.location && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <MapPin className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-slate-400">Mekân / Adres</div>
                      <div className="font-semibold text-slate-900">
                        {selectedWedding.location}
                      </div>
                    </div>
                  </div>
                )}

                {selectedWedding.note && (
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50/70 border border-amber-200/60 p-3">
                    <Gift className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-800">
                        Takı & Hediye Notu
                      </div>
                      <div className="font-medium text-amber-950 mt-0.5">
                        {selectedWedding.note}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateWedding({
                      ...selectedWedding,
                      completed: !selectedWedding.completed,
                    });
                    setSelectedWedding(null);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold min-h-[48px] transition-all ${
                    selectedWedding.completed
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {selectedWedding.completed ? (
                    <>
                      <Circle className="w-4 h-4" />
                      <span>Tamamlandı İşaretini Kaldır</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Gidildi / Tamamlandı Olarak İşaretle</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shareWedding(selectedWedding)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                  >
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Paylaş</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bu düğünü listeden silmek istiyor musunuz?')) {
                        onDeleteWedding(selectedWedding.id);
                        setSelectedWedding(null);
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
        )}
      </AnimatePresence>

      {/* Add Wedding Modal */}
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
                <h3 className="text-base font-bold text-slate-900">Yeni Düğün Ekle</h3>
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
                    Gelin & Damat veya Kişi Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Ayşe & Can Düğünü"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none min-h-[48px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tarih *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Saat
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none min-h-[48px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Düğün Salonu / Mekân
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Örn: Lale Düğün Salonu"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Takı / Hediye Notu
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Örn: Çeyrek altın takılacak"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none min-h-[48px]"
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
                    className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 min-h-[48px]"
                  >
                    Hemen Kaydet
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
