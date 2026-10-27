'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Phone,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import {
  SimpleWedding,
  formatTL,
  formatDateTurkish,
  getRelativeDayLabel,
  saveSimpleDatabase,
  getSimpleDbSnapshot,
} from '@/lib/simple-cook-storage';
import { SimpleWeddingModal } from './simple-wedding-modal';

interface SimpleWeddingsViewProps {
  weddings: SimpleWedding[];
}

export const SimpleWeddingsView: React.FC<SimpleWeddingsViewProps> = ({ weddings }) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWedding, setEditingWedding] = useState<SimpleWedding | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | undefined>(undefined);

  // Month navigation for simple calendar
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Split active and completed
  const activeWeddings = weddings
    .filter((w) => !w.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedWeddings = weddings
    .filter((w) => w.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Save or update
  const handleSaveWedding = (weddingData: Omit<SimpleWedding, 'id' | 'createdAt'>) => {
    const currentDb = getSimpleDbSnapshot();
    if (editingWedding) {
      const updatedList = currentDb.weddings.map((w) =>
        w.id === editingWedding.id
          ? { ...weddingData, id: w.id, createdAt: w.createdAt }
          : w
      );
      saveSimpleDatabase({ ...currentDb, weddings: updatedList });
    } else {
      const newWedding: SimpleWedding = {
        ...weddingData,
        id: 'wed_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
      saveSimpleDatabase({
        ...currentDb,
        weddings: [...currentDb.weddings, newWedding],
      });
    }
    setEditingWedding(null);
  };

  const handleToggleComplete = (id: string) => {
    const currentDb = getSimpleDbSnapshot();
    const updated = currentDb.weddings.map((w) =>
      w.id === id ? { ...w, isCompleted: !w.isCompleted } : w
    );
    saveSimpleDatabase({ ...currentDb, weddings: updated });
  };

  const handleDeleteWedding = (id: string) => {
    if (!confirm('Bu düğün kaydı silinsin mi?')) return;
    const currentDb = getSimpleDbSnapshot();
    const updated = currentDb.weddings.filter((w) => w.id !== id);
    saveSimpleDatabase({ ...currentDb, weddings: updated });
  };

  const openNewForDate = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    setEditingWedding(null);
    setIsModalOpen(true);
  };

  // Calendar calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-4">
      {/* Top Bar with Mode Switcher (List vs Calendar) */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-200/90 rounded-3xl">
        <button
          onClick={() => setViewMode('list')}
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all min-h-[52px] ${
            viewMode === 'list'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-5 h-5" />
          <span>Düğün Listesi</span>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
            {activeWeddings.length}
          </span>
        </button>

        <button
          onClick={() => setViewMode('calendar')}
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all min-h-[52px] ${
            viewMode === 'calendar'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          <span>Takvim (Dolu/Boş)</span>
        </button>
      </div>

      {/* ================= LIST VIEW ================= */}
      {viewMode === 'list' && (
        <div className="space-y-3.5">
          {activeWeddings.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center space-y-4">
              <div className="flex h-18 w-18 mx-auto items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <Utensils className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  Kayıtlı Düğün Bulunmuyor
                </h3>
                <p className="text-sm font-semibold text-slate-500 max-w-sm mx-auto">
                  Aşağıdaki butona dokunarak ilk düğününüzü veya mevlidinizi deftere kaydedin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingWedding(null);
                  setSelectedCalendarDate(undefined);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all min-h-[56px]"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
                <span>İlk Düğünü Deftere Ekle</span>
              </button>
            </div>
          ) : (
            activeWeddings.map((w) => {
              const relativeLabel = getRelativeDayLabel(w.date);
              const remainingAmount = Math.max(0, (w.agreedAmount || 0) - (w.receivedDeposit || 0));

              return (
                <div
                  key={w.id}
                  className="rounded-3xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 transition-all hover:border-slate-300"
                >
                  {/* Date & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black">
                        <CalendarIcon className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          {formatDateTurkish(w.date)}
                        </span>
                        {relativeLabel && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                            {relativeLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {w.guestCount} Kişi
                    </span>
                  </div>

                  {/* Wedding Title & Notes */}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-snug">
                      {w.title}
                    </h3>
                    {w.notes && (
                      <p className="text-sm font-semibold text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        🍲 {w.notes}
                      </p>
                    )}
                  </div>

                  {/* Balance / Money Strip */}
                  <div className="rounded-2xl bg-slate-100 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase text-slate-500">
                        Anlaşılan Ücret
                      </span>
                      <div className="text-base font-black font-mono text-slate-800">
                        {formatTL(w.agreedAmount)}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-black uppercase text-slate-500">
                        Alınan Peşinat
                      </span>
                      <div className="text-base font-black font-mono text-blue-600">
                        {formatTL(w.receivedDeposit)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-black uppercase text-slate-500">
                        Kalan Alacak
                      </span>
                      <div className="text-base font-black font-mono text-emerald-600">
                        {formatTL(remainingAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Call, Finish, Edit */}
                  <div className="flex items-center gap-2 pt-1">
                    {w.phone && (
                      <a
                        href={`tel:${w.phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 py-2.5 px-3 text-sm font-black text-emerald-800 hover:bg-emerald-100 min-h-[44px]"
                      >
                        <Phone className="w-4 h-4 text-emerald-700" />
                        <span>Ev Sahibini Ara</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleToggleComplete(w.id)}
                      type="button"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 px-3 text-sm font-black text-white hover:bg-slate-800 min-h-[44px]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>İşi Bitir</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingWedding(w);
                        setIsModalOpen(true);
                      }}
                      type="button"
                      className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 min-h-[44px]"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteWedding(w.id)}
                      type="button"
                      className="flex items-center justify-center h-11 w-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 min-h-[44px]"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Completed Weddings Section */}
          {completedWeddings.length > 0 && (
            <div className="pt-6 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                Tamamlanan Düğünler ({completedWeddings.length})
              </span>
              {completedWeddings.map((w) => (
                <div
                  key={w.id}
                  className="rounded-2xl border border-slate-200 bg-white/70 p-3.5 flex items-center justify-between opacity-80"
                >
                  <div>
                    <h4 className="text-base font-bold text-slate-700 line-through">
                      {w.title}
                    </h4>
                    <span className="text-xs font-semibold text-slate-400">
                      {formatDateTurkish(w.date)} · {w.guestCount} Kişi
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleComplete(w.id)}
                      type="button"
                      className="text-xs font-black text-blue-600 hover:underline px-2 py-1"
                    >
                      Aktife Al
                    </button>
                    <button
                      onClick={() => handleDeleteWedding(w.id)}
                      type="button"
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= CALENDAR VIEW (DOLU / BOŞ GÜNLER) ================= */}
      {viewMode === 'calendar' && (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          {/* Calendar Header with Next/Prev */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                type="button"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                type="button"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400 pb-1 border-b border-slate-100">
            <span>Pzt</span>
            <span>Sal</span>
            <span>Çar</span>
            <span>Per</span>
            <span>Cum</span>
            <span className="text-amber-600">Cmt</span>
            <span className="text-amber-600">Paz</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-14 sm:h-18 rounded-xl bg-slate-50/50" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const matchedWedding = weddings.find((w) => w.date === dateStr && !w.isCompleted);
              const isWeekend = (firstDayOfWeek + i) % 7 >= 5;

              return (
                <button
                  key={dateStr}
                  onClick={() => openNewForDate(dateStr)}
                  type="button"
                  className={`h-14 sm:h-18 rounded-xl p-1 text-left flex flex-col justify-between transition-all border ${
                    matchedWedding
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-black ring-2 ring-rose-400/30'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black ${
                        isWeekend && !matchedWedding ? 'text-amber-600' : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {matchedWedding ? (
                      <span className="h-2 w-2 rounded-full bg-rose-600" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-60" />
                    )}
                  </div>

                  {matchedWedding ? (
                    <div className="truncate text-[10px] font-black text-rose-700 leading-tight">
                      🔴 {matchedWedding.title.substring(0, 10)}..
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-emerald-600 opacity-70">
                      🟢 Boş
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-xs font-bold text-slate-500 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                <span>Dolu Günler</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Boş Günler</span>
              </span>
            </div>
            <span>Boş güne tıkla ve iş yaz</span>
          </div>
        </div>
      )}

      {/* Floating Add Wedding Button */}
      <div className="fixed bottom-22 left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="mx-auto max-w-2xl pointer-events-auto">
          <button
            onClick={() => {
              setEditingWedding(null);
              setSelectedCalendarDate(undefined);
              setIsModalOpen(true);
            }}
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 px-6 text-lg sm:text-xl font-black text-white shadow-2xl shadow-emerald-600/50 hover:bg-emerald-700 active:scale-98 transition-all min-h-[60px]"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
            <span>Yeni Düğün / Yemek Yaz</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <SimpleWeddingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingWedding(null);
          }}
          onSave={handleSaveWedding}
          initialDate={selectedCalendarDate}
          editingWedding={editingWedding}
        />
      )}
    </div>
  );
};
