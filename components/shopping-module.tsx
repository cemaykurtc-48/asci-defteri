'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Share2,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ShoppingItem } from '@/lib/storage';

interface ShoppingModuleProps {
  items: ShoppingItem[];
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => void;
  onAddMultipleItems: (items: Array<Omit<ShoppingItem, 'id' | 'createdAt'>>) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearCompleted: () => void;
  onBack: () => void;
}

export const ShoppingModule: React.FC<ShoppingModuleProps> = ({
  items,
  onAddItem,
  onAddMultipleItems,
  onToggleItem,
  onDeleteItem,
  onClearCompleted,
  onBack,
}) => {
  const [newText, setNewText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Hepsi', 'Market', 'Manav', 'Fırın', 'Kasap', 'Eczane', 'Genel'];

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'Hepsi') return true;
    return (item.category || 'Genel').toLowerCase() === selectedCategory.toLowerCase();
  });

  const pendingCount = items.filter((i) => !i.completed).length;
  const completedCount = items.filter((i) => i.completed).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    onAddItem({
      text: newText.trim(),
      completed: false,
      category: selectedCategory !== 'Hepsi' ? selectedCategory : 'Genel',
    });

    setNewText('');
  };

  const handleToggle = (item: ShoppingItem) => {
    onToggleItem(item.id);
    if (!item.completed) {
      // Fire small joyful confetti
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  // Handle Photo / Camera OCR Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanMessage('Fotoğraf taranıyor, el yazısı maddeler okunuyor...');
    setErrorMessage(null);

    try {
      // Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;

      const res = await fetch('/api/ocr-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64String,
          mimeType: file.type || 'image/jpeg',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Kağıt okunamadı.');
      }

      if (data.items && data.items.length > 0) {
        const newItemsToAdd = data.items.map((item: { text: string; category?: string }) => ({
          text: item.text,
          completed: false,
          category: item.category || 'Genel',
        }));

        onAddMultipleItems(newItemsToAdd);
        setScanMessage(`🎉 ${data.items.length} adet madde kağıttan başarıyla aktarıldı!`);

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(() => setScanMessage(null), 4000);
      } else {
        setErrorMessage('Fotoğrafta okunabilir bir liste maddesi bulunamadı. Lütfen daha aydınlık bir fotoğraf deneyin.');
      }
    } catch (err: unknown) {
      console.error('OCR Error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Fotoğraf işlenirken bir hata oluştu.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // WhatsApp Share Functionality
  const shareToWhatsApp = () => {
    const pendingList = items.filter((i) => !i.completed);
    const completedList = items.filter((i) => i.completed);

    let text = '🛒 *Alışveriş Listesi (KolayDefter)*\n\n';

    if (pendingList.length > 0) {
      text += '📌 *Alınacaklar:*\n';
      pendingList.forEach((item) => {
        text += `• ${item.text}${item.category ? ` (${item.category})` : ''}\n`;
      });
      text += '\n';
    }

    if (completedList.length > 0) {
      text += '✅ *Alınanlar:*\n';
      completedList.forEach((item) => {
        text += `~• ${item.text}~\n`;
      });
      text += '\n';
    }

    text += '_Tek Dokunuş, Sıfır Karmaşa_';

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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

        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              type="button"
              className="text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-2 min-h-[44px]"
            >
              Alınanları Temizle
            </button>
          )}
        </div>
      </div>

      {/* Module Title Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Alışveriş Listesi</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                {pendingCount > 0 ? `${pendingCount} ürün alınacak` : 'Tüm ürünler tamamlandı! 🎉'}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 px-3 py-1.5 text-center text-xs backdrop-blur-md">
            <span className="font-bold text-white text-base block tabular-nums leading-none">
              {completedCount}/{items.length}
            </span>
            <span className="text-[10px] text-emerald-100 uppercase font-semibold">Alındı</span>
          </div>
        </div>
      </div>

      {/* Paper Photo Scan Trigger Button */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Kağıt Listeyi Kamerayla Çek</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </h4>
              <p className="text-xs text-slate-600">
                Kağıttaki el yazınızı tek dokunuşla bu listeye döker
              </p>
            </div>
          </div>

          <label className="cursor-pointer flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all min-h-[44px]">
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Okunuyor...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Fotoğraf Çek / Yükle</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isScanning}
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {scanMessage && (
          <div className="mt-3 rounded-xl bg-emerald-100/80 p-2.5 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 rounded-xl bg-red-100/90 p-2.5 text-xs font-semibold text-red-800">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Quick Add Manual Form */}
      <form onSubmit={handleAddSubmit} className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Örn: 2 kg Domates, 1 Ekmek..."
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm min-h-[52px]"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all min-h-[52px]"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Ekle</span>
        </button>
      </form>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            type="button"
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all min-h-[44px] ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">Liste Henüz Boş</h3>
            <p className="mt-1 text-sm text-slate-500">
              Yukarıdaki alandan ürün yazabilir veya kağıt listenizin fotoğrafını çekebilirsiniz.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all min-h-[60px] ${
                item.completed
                  ? 'bg-slate-100/80 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-emerald-300 shadow-sm'
              }`}
            >
              {/* Tap anywhere to toggle completion */}
              <div
                onClick={() => handleToggle(item)}
                className="flex flex-1 items-center gap-3 cursor-pointer select-none"
              >
                <div className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  {item.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 transition-transform active:scale-125" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500 transition-colors" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`text-base font-medium transition-all block ${
                      item.completed ? 'line-through text-slate-400 decoration-slate-400 decoration-2' : 'text-slate-900 font-semibold'
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.category && item.category !== 'Genel' && (
                    <span className="text-[11px] font-semibold text-slate-500 tracking-tight">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onDeleteItem(item.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Floating Sticky Bottom Bar for WhatsApp Share */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3.5 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-900">{pendingCount}</span> alınacak,{' '}
            <span className="font-bold text-emerald-700">{completedCount}</span> alındı
          </div>

          <button
            onClick={shareToWhatsApp}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-[#20ba59] active:scale-95 transition-all min-h-[48px]"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp ile Gönder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
