'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Send,
  Check,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CookJob,
  IngredientItem,
  formatTL,
  getShoppingExpense,
} from '@/lib/cook-storage';

interface MarketModalProps {
  job: CookJob;
  isOpen: boolean;
  onClose: () => void;
  onUpdateJob: (updatedJob: CookJob) => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateJob,
}) => {
  const [ingredients, setIngredients] = useState<IngredientItem[]>(() => job.ingredients || []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');

  if (!isOpen) return null;

  const totalExpense = ingredients.reduce((sum, i) => sum + (Number(i.actualCost) || 0), 0);
  const purchasedCount = ingredients.filter((i) => i.purchased).length;

  const handleTogglePurchased = (id: string) => {
    const updated = ingredients.map((item) => {
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

    setIngredients(updated);
    onUpdateJob({ ...job, ingredients: updated });
  };

  const handleCostChange = (id: string, costStr: string) => {
    const cost = parseFloat(costStr) || 0;
    const updated = ingredients.map((item) =>
      item.id === id ? { ...item, actualCost: cost } : item
    );
    setIngredients(updated);
    onUpdateJob({ ...job, ingredients: updated });
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

    const updated = [...ingredients, newItem];
    setIngredients(updated);
    onUpdateJob({ ...job, ingredients: updated });

    setNewItemName('');
    setNewItemCost('');
  };

  const handleDeleteItem = (id: string) => {
    const updated = ingredients.filter((i) => i.id !== id);
    setIngredients(updated);
    onUpdateJob({ ...job, ingredients: updated });
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    let text = `🛒 *${job.title} - Malzeme & Pazar Listesi*\n\n`;
    text += `📅 Tarih: ${job.date} (${job.guestCount} Kişilik)\n`;
    if (job.location) text += `📍 Yer: ${job.location}\n\n`;

    text += `📋 *ALINACAKLAR:*\n`;
    ingredients.forEach((item) => {
      const mark = item.purchased ? '✅' : '⬜';
      const costText = item.actualCost > 0 ? ` (${formatTL(item.actualCost)})` : '';
      text += `${mark} ${item.name}${costText}\n`;
    });

    if (job.shoppingByCook && totalExpense > 0) {
      text += `\n💰 *Pazarda Harcanan Toplam:* ${formatTL(totalExpense)}\n`;
    }

    text += `\n_Usta Aşçı Defteri ile hazırlandı._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Pazar & Market Alışveriş Modu
              </span>
              <h2 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
                {job.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 min-h-[44px]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Live Expense Counter Strip */}
          <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-md">
            <div>
              <span className="text-[11px] font-bold uppercase text-emerald-100">
                {job.shoppingByCook ? 'Pazarda Harcanan Toplam' : 'Alınan Maddeler'}
              </span>
              <div className="text-2xl font-black font-mono tabular-nums leading-none mt-0.5">
                {job.shoppingByCook ? formatTL(totalExpense) : `${purchasedCount} / ${ingredients.length} Alındı`}
              </div>
            </div>

            <span className="rounded-xl bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
              {purchasedCount} / {ingredients.length} Alındı
            </span>
          </div>
        </div>

        {/* Body (List of items with tick & cost inputs) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* Quick Explanation */}
          <p className="text-xs text-slate-500 font-semibold px-1">
            {job.shoppingByCook
              ? '💡 Sepete attığınız ürünün kutusuna dokunun ve fişteki gerçek fiyatını girin.'
              : '💡 Malzemelerin üzerine dokunarak aldıklarınızı işaretleyebilir, ev sahibine WhatsApp ile atabilirsiniz.'}
          </p>

          {/* List items */}
          <div className="space-y-2.5">
            {ingredients.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                Henüz malzeme eklenmemiş. Aşağıdaki formdan ilk malzemeyi ekleyebilirsiniz.
              </div>
            ) : (
              ingredients.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 p-3.5 transition-all ${
                    item.purchased
                      ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                      : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  {/* Tap checkbox & Name */}
                  <div
                    onClick={() => handleTogglePurchased(item.id)}
                    className="flex flex-1 items-center gap-3 cursor-pointer select-none min-h-[44px]"
                  >
                    <div className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      {item.purchased ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-600 transition-transform active:scale-125" />
                      ) : (
                        <Circle className="w-7 h-7 text-slate-300 hover:text-emerald-500" />
                      )}
                    </div>

                    <span
                      className={`text-base font-bold ${
                        item.purchased ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  {/* Price input + delete button */}
                  <div className="flex items-center gap-2 pl-12 sm:pl-0">
                    {job.shoppingByCook && (
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={item.actualCost || ''}
                          onChange={(e) => handleCostChange(item.id, e.target.value)}
                          placeholder="Fiyat ₺"
                          className="w-24 text-right text-sm font-bold font-mono text-slate-900 focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-500">₺</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-red-600 min-h-[44px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Extra Item in Market */}
          <form onSubmit={handleAddNewItem} className="pt-2">
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700">Pazarda Yeni Malzeme Ekle</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Malzeme adı (Örn: 5 kg Biber)"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none min-h-[48px]"
                />
                {job.shoppingByCook && (
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    placeholder="Tutar (₺)"
                    className="w-full sm:w-28 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold font-mono text-slate-900 focus:border-blue-600 focus:outline-none min-h-[48px]"
                  />
                )}
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition-all min-h-[48px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all min-h-[52px]"
          >
            <Send className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp ile Paylaş</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition-all min-h-[52px]"
          >
            <Check className="w-5 h-5" />
            <span>Kaydet & Kapat</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
