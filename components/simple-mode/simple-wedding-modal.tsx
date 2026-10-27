'use client';

import React, { useState } from 'react';
import { Calendar, Users, Phone, FileText, Check, DollarSign } from 'lucide-react';
import { SimpleWedding } from '@/lib/simple-cook-storage';

interface SimpleWeddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wedding: Omit<SimpleWedding, 'id' | 'createdAt'>) => void;
  initialDate?: string;
  editingWedding?: SimpleWedding | null;
}

export const SimpleWeddingModal: React.FC<SimpleWeddingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  editingWedding,
}) => {
  if (!isOpen) return null;

  // Preset calculation helpers
  const getPresetDate = (type: 'this_sat' | 'this_sun' | 'next_sat' | 'next_sun'): string => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 6 is Sat
    const daysUntilThisSat = (6 - currentDay + 7) % 7 || 7;
    const daysUntilThisSun = (7 - currentDay) % 7 || 7;

    const target = new Date();
    if (type === 'this_sat') target.setDate(today.getDate() + daysUntilThisSat);
    else if (type === 'this_sun') target.setDate(today.getDate() + daysUntilThisSun);
    else if (type === 'next_sat') target.setDate(today.getDate() + daysUntilThisSat + 7);
    else if (type === 'next_sun') target.setDate(today.getDate() + daysUntilThisSun + 7);

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [title, setTitle] = useState(editingWedding?.title || '');
  const [date, setDate] = useState(
    editingWedding?.date || initialDate || getPresetDate('this_sat')
  );
  const [guestCount, setGuestCount] = useState<number | string>(editingWedding?.guestCount ?? 500);
  const [phone, setPhone] = useState(editingWedding?.phone || '');
  const [notes, setNotes] = useState(editingWedding?.notes || '');
  const [agreedAmount, setAgreedAmount] = useState<number | string>(editingWedding?.agreedAmount ?? '');
  const [receivedDeposit, setReceivedDeposit] = useState<number | string>(editingWedding?.receivedDeposit ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Lütfen düğün sahibinin veya düğünün adını yazın.');
      return;
    }
    if (!date) {
      alert('Lütfen düğün tarihini seçin.');
      return;
    }

    onSave({
      title: title.trim(),
      date,
      guestCount: Number(guestCount) || 0,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      agreedAmount: Number(agreedAmount) || 0,
      receivedDeposit: Number(receivedDeposit) || 0,
      isCompleted: editingWedding?.isCompleted || false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 border border-slate-200 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
              Kolay Defter
            </span>
            <h3 className="text-xl font-black text-slate-900">
              {editingWedding ? 'Düğünü Düzenle' : 'Yeni Düğün / Yemek Yaz'}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Düğün / Ev Sahibi Adı */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Düğün veya Ev Sahibi Adı *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Hacı Salih Düğünü veya Mehmet Ağa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-300 p-4 text-lg font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* 2. Düğün Tarihi ve Hızlı Butonlar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Düğün Tarihi *
              </label>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quick Weekend Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Bu Cmt', type: 'this_sat' as const },
                { label: 'Bu Paz', type: 'this_sun' as const },
                { label: 'Gelecek Cmt', type: 'next_sat' as const },
                { label: 'Gelecek Paz', type: 'next_sun' as const },
              ].map((p) => {
                const targetDate = getPresetDate(p.type);
                const isSelected = date === targetDate;
                return (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => setDate(targetDate)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Kişi Sayısı & Hızlı Butonlar */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Kaç Kişilik Yemek?
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min="10"
                step="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
                placeholder="500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[250, 500, 750, 1000, 1500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGuestCount(preset)}
                  className={`py-2 px-3 rounded-xl text-xs font-black shrink-0 transition-all ${
                    Number(guestCount) === preset
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {preset} Kişi
                </button>
              ))}
            </div>
          </div>

          {/* 4. Anlaşılan Para & Alınan Peşinat (Bakiye) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Anlaşılan Ücret (TL)
              </label>
              <input
                type="number"
                step="100"
                placeholder="Örn: 35000"
                value={agreedAmount}
                onChange={(e) => setAgreedAmount(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Alınan Peşinat (TL)
              </label>
              <input
                type="number"
                step="100"
                placeholder="Örn: 10000"
                value={receivedDeposit}
                onChange={(e) => setReceivedDeposit(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-black text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Telefon & Menü Notu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Ev Sahibi Telefonu
              </label>
              <input
                type="tel"
                placeholder="05..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Menü / Not
              </label>
              <input
                type="text"
                placeholder="Örn: Çorba, Etli Pilav, Helva"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 rounded-2xl border-2 border-slate-300 py-4 text-base font-bold text-slate-700 hover:bg-slate-100 min-h-[56px]"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="w-2/3 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition-all min-h-[56px] flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>{editingWedding ? 'Değişiklikleri Kaydet' : 'Deftere Yaz'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
