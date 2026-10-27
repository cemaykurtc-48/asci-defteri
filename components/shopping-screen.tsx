'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Send,
  Tag,
  ChevronDown,
  Calendar,
  Users,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CookJob,
  IngredientItem,
  formatTL,
  getShoppingExpense,
} from '@/lib/cook-storage';

interface ShoppingScreenProps {
  jobs: CookJob[];
  onUpdateJob: (updatedJob: CookJob) => void;
  onNavigateToJobs: () => void;
}

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({
  jobs,
  onUpdateJob,
  onNavigateToJobs,
}) => {
  const activeJobs = jobs.filter((j) => j.status === 'active');
  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    return activeJobs[0]?.id || jobs[0]?.id || '';
  });

  // State for adding a new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');

  const currentJob = jobs.find((j) => j.id === selectedJobId) || activeJobs[0];

  if (!currentJob) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-10 text-center space-y-4">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900">Alışveriş İçin Kayıtlı İş Yok</h3>
          <p className="text-sm font-semibold text-slate-500 max-w-sm mx-auto">
            Pazar veya toptancı listesi oluşturmak için önce İş Defteri&apos;nden bir yemek ekleyin.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToJobs}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all min-h-[56px]"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span>İş Defterine Git & İş Ekle</span>
        </button>
      </div>
    );
  }

  const ingredients = currentJob.ingredients || [];
  const totalExpense = getShoppingExpense(currentJob);
  const purchasedCount = ingredients.filter((i) => i.purchased).length;

  const handleTogglePurchased = (id: string) => {
    const updatedIngredients = ingredients.map((item) => {
      if (item.id === id) {
        const nextState = !item.purchased;
        if (nextState) {
          confetti({
            particleCount: 20,
            spread: 50,
            origin: { y: 0.8 },
          });
        }
        return { ...item, purchased: nextState };
      }
      return item;
    });

    onUpdateJob({
      ...currentJob,
      ingredients: updatedIngredients,
    });
  };

  const handleCostChange = (id: string, costStr: string) => {
    const cost = parseFloat(costStr) || 0;
    const updatedIngredients = ingredients.map((item) =>
      item.id === id ? { ...item, actualCost: cost } : item
    );

    onUpdateJob({
      ...currentJob,
      ingredients: updatedIngredients,
    });
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: IngredientItem = {
      id: 'ing_' + Date.now().toString(36),
      name: newItemName.trim(),
      purchased: true,
      actualCost: Number(newItemCost) || 0,
    };

    const updatedIngredients = [...ingredients, newItem];
    onUpdateJob({
      ...currentJob,
      ingredients: updatedIngredients,
    });

    setNewItemName('');
    setNewItemCost('');
  };

  const handleDeleteItem = (id: string) => {
    const updatedIngredients = ingredients.filter((i) => i.id !== id);
    onUpdateJob({
      ...currentJob,
      ingredients: updatedIngredients,
    });
  };

  const handleToggleShoppingMode = () => {
    onUpdateJob({
      ...currentJob,
      shoppingByCook: !currentJob.shoppingByCook,
    });
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    let text = `🛒 *${currentJob.title} - Malzeme & Pazar Listesi*\n\n`;
    text += `📅 Tarih: ${currentJob.date} (${currentJob.guestCount} Kişilik)\n`;
    if (currentJob.location) text += `📍 Yer: ${currentJob.location}\n\n`;

    text += `📋 *ALINACAKLAR:*\n`;
    ingredients.forEach((item) => {
      const mark = item.purchased ? '✅' : '⬜';
      const costText = item.actualCost > 0 ? ` (${formatTL(item.actualCost)})` : '';
      text += `${mark} ${item.name}${costText}\n`;
    });

    if (currentJob.shoppingByCook && totalExpense > 0) {
      text += `\n💰 *Pazarda Harcanan Toplam:* ${formatTL(totalExpense)}\n`;
    }

    text += `\n_Usta Aşçı Defteri ile gönderildi._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* 1. Job Selector (Hangi İşin Alışverişi?) */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Alışveriş Yapılan İş / Yemek
        </label>
        <div className="relative">
          <select
            value={currentJob.id}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full appearance-none rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 pr-10 text-base sm:text-lg font-black text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none min-h-[56px]"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.guestCount} Kişilik - {j.date})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
        </div>
      </div>

      {/* 2. Live Market Expense Strip */}
      <div className="rounded-3xl border-2 border-emerald-700 bg-emerald-600 p-5 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              {currentJob.shoppingByCook ? 'Pazarda Harcanan Toplam Masraf' : 'Malzeme İlerlemesi'}
            </span>
            <div className="mt-1 text-3xl sm:text-4xl font-black font-mono tabular-nums leading-none">
              {currentJob.shoppingByCook ? formatTL(totalExpense) : `${purchasedCount} / ${ingredients.length} Alındı`}
            </div>
          </div>

          <span className="rounded-xl bg-white/20 px-3 py-1.5 text-sm font-bold backdrop-blur-md">
            {purchasedCount} / {ingredients.length} Alındı
          </span>
        </div>

        {/* Shopping mode badge & toggle */}
        <div className="pt-2 border-t border-emerald-500/50 flex items-center justify-between text-xs sm:text-sm">
          <span className="font-semibold text-emerald-100">
            {currentJob.shoppingByCook
              ? '🛒 Alışverişi Usta Yapıyor (Masraf hesaplanır)'
              : '🏠 Malzemeyi Ev Sahibi Alacak'}
          </span>
          <button
            type="button"
            onClick={handleToggleShoppingMode}
            className="text-xs font-bold underline text-white hover:text-emerald-100 py-1"
          >
            Değiştir
          </button>
        </div>
      </div>

      {/* 3. Helper Note for Elderly Cook */}
      <p className="text-xs sm:text-sm font-bold text-slate-600 px-1">
        {currentJob.shoppingByCook
          ? '💡 Sepete attığınız malzemenin yuvarlağına dokunun ve yanına fişteki gerçek tutarını yazın.'
          : '💡 Malzemelerin üzerine dokunarak aldıklarınızı işaretleyebilir, ev sahibine tek tıkla WhatsApp atabilirsiniz.'}
      </p>

      {/* 4. List of Ingredients */}
      <div className="space-y-2.5">
        {ingredients.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-400">
            Bu işe ait kayıtlı malzeme bulunmuyor. Aşağıdaki alandan ilk malzemeyi ekleyin.
          </div>
        ) : (
          ingredients.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 p-3.5 transition-all ${
                item.purchased
                  ? 'border-emerald-300 bg-emerald-50/50 text-slate-700'
                  : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              {/* Tap to tick */}
              <div
                onClick={() => handleTogglePurchased(item.id)}
                className="flex flex-1 items-center gap-3.5 cursor-pointer select-none min-h-[48px]"
              >
                <div className="shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center">
                  {item.purchased ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 transition-transform active:scale-125" />
                  ) : (
                    <Circle className="w-8 h-8 text-slate-300 hover:text-emerald-500" />
                  )}
                </div>

                <span
                  className={`text-base sm:text-lg font-bold leading-snug ${
                    item.purchased ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {item.name}
                </span>
              </div>

              {/* Price input + delete button */}
              <div className="flex items-center gap-2 pl-14 sm:pl-0">
                {currentJob.shoppingByCook && (
                  <div className="flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3 py-2">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={item.actualCost || ''}
                      onChange={(e) => handleCostChange(item.id, e.target.value)}
                      placeholder="Fiyat ₺"
                      className="w-28 text-right text-base font-black font-mono text-slate-900 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">₺</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:text-red-600 min-h-[44px]"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Quick Add Item at the Market */}
      <form onSubmit={handleAddNewItem} className="pt-1">
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 space-y-2.5 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-600">
            Pazarda Yeni Malzeme Ekle
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Malzeme adı (Örn: 5 kg Sivri Biber)"
              className="flex-1 rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none min-h-[52px]"
            />
            {currentJob.shoppingByCook && (
              <input
                type="number"
                min="0"
                step="10"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                placeholder="Tutar (₺)"
                className="w-full sm:w-32 rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-base font-black font-mono text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none min-h-[52px]"
              />
            )}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 active:scale-95 transition-all min-h-[52px]"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Listeye Ekle</span>
            </button>
          </div>
        </div>
      </form>

      {/* 6. WhatsApp Share Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-4 text-base sm:text-lg font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-[#20ba59] active:scale-98 transition-all min-h-[56px]"
        >
          <Send className="w-5 h-5" />
          <span>Bu Listeyi WhatsApp ile Ev Sahibine Gönder</span>
        </button>
      </div>
    </div>
  );
};
