'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Share2,
  Undo2,
  Trash2,
  Plus,
  Calendar,
  Download,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import {
  SimpleShoppingItem,
  SimpleWedding,
  DrawingStroke,
  saveSimpleDatabase,
  getSimpleDbSnapshot,
} from '@/lib/simple-cook-storage';

interface SimpleShoppingViewProps {
  shoppingItems: SimpleShoppingItem[];
  weddings: SimpleWedding[];
}

export const SimpleShoppingView: React.FC<SimpleShoppingViewProps> = ({
  shoppingItems,
  weddings,
}) => {
  const [activeItemId, setActiveItemId] = useState<string | null>(
    shoppingItems.length > 0 ? shoppingItems[0].id : null
  );
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // Active item
  const activeItem = shoppingItems.find((item) => item.id === activeItemId) || shoppingItems[0] || null;

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Synchronize strokes when active item changes
  useEffect(() => {
    if (activeItem) {
      setStrokes(activeItem.strokes || []);
      if (activeItem.photoDataUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          baseImageRef.current = img;
          setIsImageLoaded(true);
        };
        img.src = activeItem.photoDataUrl;
      } else {
        baseImageRef.current = null;
        setIsImageLoaded(false);
      }
    } else {
      setStrokes([]);
      baseImageRef.current = null;
      setIsImageLoaded(false);
    }
  }, [activeItem?.id, activeItem?.photoDataUrl]);

  // Redraw canvas whenever base image or strokes change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background paper photo
    if (baseImageRef.current && isImageLoaded) {
      ctx.drawImage(baseImageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Empty background placeholder if no image
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fotoğraf bulunamadı', canvas.width / 2, canvas.height / 2);
    }

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color || '#ef4444';
      ctx.lineWidth = stroke.lineWidth || 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, isImageLoaded]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Helper to get touch/mouse position relative to canvas coordinate space
  const getCanvasCoords = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Start Drawing
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    currentStrokeRef.current = [coords];
  };

  // Move Drawing
  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    currentStrokeRef.current.push(coords);

    // Live stroke rendering for 60fps responsiveness
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = currentStrokeRef.current;
    if (points.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444'; // Bright Red marker
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    }
  };

  // End Drawing & Save
  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 1 && activeItem) {
      const newStroke: DrawingStroke = {
        points: [...currentStrokeRef.current],
        color: '#ef4444',
        lineWidth: 6,
      };

      const updatedStrokes = [...strokes, newStroke];
      setStrokes(updatedStrokes);

      // Save to storage
      const currentDb = getSimpleDbSnapshot();
      const updatedList = currentDb.shoppingItems.map((item) =>
        item.id === activeItem.id ? { ...item, strokes: updatedStrokes, updatedAt: new Date().toISOString() } : item
      );
      saveSimpleDatabase({ ...currentDb, shoppingItems: updatedList });
    }
    currentStrokeRef.current = [];
  };

  // Undo Last Stroke
  const handleUndo = () => {
    if (strokes.length === 0 || !activeItem) return;
    const updatedStrokes = strokes.slice(0, -1);
    setStrokes(updatedStrokes);

    const currentDb = getSimpleDbSnapshot();
    const updatedList = currentDb.shoppingItems.map((item) =>
      item.id === activeItem.id ? { ...item, strokes: updatedStrokes, updatedAt: new Date().toISOString() } : item
    );
    saveSimpleDatabase({ ...currentDb, shoppingItems: updatedList });
  };

  // Clear All Strokes
  const handleClearStrokes = () => {
    if (!activeItem || strokes.length === 0) return;
    if (!confirm('Çizdiğiniz tüm kırmızı çizgiler temizlensin mi?')) return;
    setStrokes([]);

    const currentDb = getSimpleDbSnapshot();
    const updatedList = currentDb.shoppingItems.map((item) =>
      item.id === activeItem.id ? { ...item, strokes: [], updatedAt: new Date().toISOString() } : item
    );
    saveSimpleDatabase({ ...currentDb, shoppingItems: updatedList });
  };

  // Delete this shopping list
  const handleDeleteItem = (id: string) => {
    if (!confirm('Bu alışveriş listesini silmek istediğinize emin misiniz?')) return;
    const currentDb = getSimpleDbSnapshot();
    const updated = currentDb.shoppingItems.filter((i) => i.id !== id);
    saveSimpleDatabase({ ...currentDb, shoppingItems: updated });
    setActiveItemId(updated.length > 0 ? updated[0].id : null);
  };

  // WhatsApp Share or Direct Download
  const handleShareWhatsApp = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeItem) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Try native Web Share API with file
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'liste.png', { type: 'image/png' })] })) {
          try {
            const file = new File([blob], `${activeItem.title || 'alisveris_listesi'}.png`, { type: 'image/png' });
            await navigator.share({
              title: activeItem.title,
              text: `🛒 Aşçı Alışveriş Listesi: ${activeItem.title} (${activeItem.weddingTitle || 'Genel'})`,
              files: [file],
            });
            return;
          } catch {
            // User cancelled or share failed, fallback to url/download
          }
        }

        // Fallback: Direct image download + open WhatsApp with text
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${activeItem.title || 'alisveris_listesi'}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(downloadUrl);

        // Open WhatsApp web / mobile app
        const msg = encodeURIComponent(`Selamün aleyküm, "${activeItem.title}" için alışveriş listesi çizildi ve kontrol edildi.`);
        window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
      }, 'image/png');
    } catch (e) {
      console.error('Share error:', e);
      alert('Paylaşım penceresi açılamadı. Resim cihazınıza indirildi.');
    }
  };

  // New photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedPhotoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Save New Shopping List
  const handleCreateNewList = () => {
    if (!uploadedPhotoUrl) {
      alert('Lütfen kağıt listenin fotoğrafını çekin veya galeriden seçin.');
      return;
    }

    const matchedWedding = weddings.find((w) => w.id === selectedWeddingId);
    const newItem: SimpleShoppingItem = {
      id: 'shop_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      weddingId: selectedWeddingId || undefined,
      weddingTitle: matchedWedding?.title || undefined,
      title: newTitle.trim() || (matchedWedding ? `${matchedWedding.title} Listesi` : 'Pazar Alışveriş Listesi'),
      photoDataUrl: uploadedPhotoUrl,
      strokes: [],
      updatedAt: new Date().toISOString(),
    };

    const currentDb = getSimpleDbSnapshot();
    saveSimpleDatabase({
      ...currentDb,
      shoppingItems: [newItem, ...currentDb.shoppingItems],
    });

    setActiveItemId(newItem.id);
    setIsNewModalOpen(false);
    setNewTitle('');
    setSelectedWeddingId('');
    setUploadedPhotoUrl(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="rounded-3xl bg-amber-500 p-4 sm:p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-100">
            Parmakla Çizilebilir Kağıt Liste
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">
            🛒 Kağıt Listenin Fotoğrafı
          </h2>
          <p className="text-xs font-bold text-amber-100 mt-1">
            Aldığın malzemenin üstünü parmağınla kırmızıyla çiz!
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          type="button"
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-slate-900 font-black text-sm shadow-md hover:bg-amber-50 active:scale-95 transition-all min-h-[50px] shrink-0"
        >
          <Camera className="w-5 h-5 text-amber-600 stroke-[2.5]" />
          <span>Fotoğraf Çek</span>
        </button>
      </div>

      {/* List Selector Pills (if multiple lists exist) */}
      {shoppingItems.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {shoppingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveItemId(item.id)}
              type="button"
              className={`rounded-2xl px-4 py-2.5 text-xs font-black transition-all shrink-0 flex items-center gap-2 min-h-[44px] ${
                activeItem?.id === item.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{item.title}</span>
              {item.strokes && item.strokes.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas Workspace */}
      {activeItem ? (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-3 sm:p-4 shadow-sm space-y-3">
          {/* Header Info of Active List */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {activeItem.title}
              </h3>
              {activeItem.weddingTitle && (
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeItem.weddingTitle}
                </span>
              )}
            </div>

            {/* Quick action buttons: Undo, Clear, Delete */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                type="button"
                className="flex items-center justify-center h-11 w-11 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition-all active:scale-95"
                title="Son Çizgiyi Geri Al"
              >
                <Undo2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleClearStrokes}
                disabled={strokes.length === 0}
                type="button"
                className="flex items-center justify-center h-11 w-11 rounded-2xl bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 transition-all active:scale-95"
                title="Tüm Çizgileri Temizle"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleDeleteItem(activeItem.id)}
                type="button"
                className="flex items-center justify-center h-11 w-11 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-95"
                title="Listeyi Sil"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Interactive Finger Drawing Scratchpad */}
          <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-inner flex items-center justify-center select-none touch-none">
            <canvas
              ref={canvasRef}
              width={720}
              height={960}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              onTouchCancel={handleEnd}
              className="w-full h-auto max-h-[65vh] object-contain cursor-crosshair touch-none block"
              style={{ touchAction: 'none' }}
            />

            {/* Scratchpad Helper Overlay */}
            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>Parmağınızla üzerine çizgi çekin</span>
            </div>
          </div>

          {/* Action Strip: WhatsApp & Share */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 py-3.5 px-4 text-base font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition-all min-h-[54px]"
            >
              <MessageCircle className="w-6 h-6 fill-white" />
              <span>WhatsApp ile Gönder / Paylaş</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 px-4 text-base font-black text-white shadow-md hover:bg-slate-800 active:scale-98 transition-all min-h-[54px]"
            >
              <Download className="w-5 h-5" />
              <span>Çizilmiş Resmi Telefona Kaydet</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center space-y-4">
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
            <Camera className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900">
              Henüz Kağıt Liste Yüklenmedi
            </h3>
            <p className="text-sm font-semibold text-slate-500 max-w-sm mx-auto">
              Ev sahibinin verdiği ya da mutfakta yazdığınız kağıt listenin fotoğrafını çekin. Markette parmağınızla aldıklarınızı çizin.
            </p>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-base font-black text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 active:scale-95 transition-all min-h-[56px]"
          >
            <Camera className="w-6 h-6" />
            <span>İlk Listenin Fotoğrafını Çek</span>
          </button>
        </div>
      )}

      {/* New Shopping List Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                <span>Yeni Kağıt Liste Fotoğrafı</span>
              </h3>
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  setUploadedPhotoUrl(null);
                }}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* List Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Liste Adı (Örn: Hacı Salih Düğünü Pazar Listesi)
              </label>
              <input
                type="text"
                placeholder="Örn: Hafta Sonu Kasap ve Sebze Listesi"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-base font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Optional Wedding Link */}
            {weddings.length > 0 && (
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Hangi Düğün İçin? (İsteğe Bağlı)
                </label>
                <select
                  value={selectedWeddingId}
                  onChange={(e) => setSelectedWeddingId(e.target.value)}
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

            {/* Camera / File Input */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Kağıdın Fotoğrafını Çekin veya Seçin *
              </label>

              {uploadedPhotoUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 max-h-48">
                  <img
                    src={uploadedPhotoUrl}
                    alt="Yüklenen Liste"
                    className="w-full h-44 object-cover"
                  />
                  <button
                    onClick={() => setUploadedPhotoUrl(null)}
                    type="button"
                    className="absolute top-2 right-2 rounded-xl bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5"
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/50 hover:bg-amber-100/50 cursor-pointer transition-all">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Camera className="w-8 h-8" />
                  </div>
                  <span className="text-base font-black text-slate-900">
                    Kamerayı Aç / Fotoğraf Çek
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Galeriden de seçebilirsiniz
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setUploadedPhotoUrl(null);
                }}
                className="w-1/3 rounded-2xl border-2 border-slate-300 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-100"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleCreateNewList}
                disabled={!uploadedPhotoUrl}
                className="w-2/3 rounded-2xl bg-amber-500 py-3.5 text-base font-black text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 disabled:opacity-40 min-h-[52px]"
              >
                Listeyi Kaydet & Başla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
