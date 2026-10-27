'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Users,
  MapPin,
  Plus,
  Trash2,
  Check,
  UserCheck,
  Coins,
  Zap,
  Sparkles,
} from 'lucide-react';
import {
  CookJob,
  Assistant,
  IngredientItem,
  PaymentRecord,
  formatTL,
} from '@/lib/cook-storage';

interface JobWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveJob: (job: Omit<CookJob, 'id' | 'createdAt'>) => void;
  initialDate?: string;
}

// Calculate upcoming weekend dates for fast one-touch selection
function getUpcomingWeekendPresets() {
  const now = new Date();
  const currentDay = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

  const satDiff = currentDay === 6 ? 0 : (6 - currentDay + 7) % 7;
  const thisSat = new Date(now);
  thisSat.setDate(now.getDate() + satDiff);

  const sunDiff = currentDay === 0 ? 0 : (7 - currentDay);
  const thisSun = new Date(now);
  thisSun.setDate(now.getDate() + sunDiff);

  const nextSat = new Date(thisSat);
  nextSat.setDate(thisSat.getDate() + (satDiff === 0 ? 7 : 7));

  const nextSun = new Date(thisSun);
  nextSun.setDate(thisSun.getDate() + (sunDiff === 0 ? 7 : 7));

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fmtLabel = (d: Date, prefix: string) => {
    const day = d.getDate();
    const mNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${prefix} (${day} ${mNames[d.getMonth()]})`;
  };

  return [
    { label: fmtLabel(thisSat, currentDay === 6 ? 'Bugün Cmt' : 'Bu Cmt'), dateStr: fmt(thisSat) },
    { label: fmtLabel(thisSun, currentDay === 0 ? 'Bugün Paz' : 'Bu Paz'), dateStr: fmt(thisSun) },
    { label: fmtLabel(nextSat, 'Gelecek Cmt'), dateStr: fmt(nextSat) },
    { label: fmtLabel(nextSun, 'Gelecek Paz'), dateStr: fmt(nextSun) },
  ];
}

export const JobWizardModal: React.FC<JobWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveJob,
  initialDate,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: İş Künyesi
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState<string>('500');

  // Step 2: Fiyatlandırma ve İlk Kapora
  const [pricingType, setPricingType] = useState<'lumpSum' | 'perGuest'>('lumpSum');
  const [pricePerGuest, setPricePerGuest] = useState<string>('80');
  const [lumpSumPrice, setLumpSumPrice] = useState<string>('40000');
  const [initialDeposit, setInitialDeposit] = useState<string>('10000');
  const [depositNote, setDepositNote] = useState<string>('İlk Kapora');

  // Step 3: Ekip & Çıraklar
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantWage, setNewAssistantWage] = useState('');

  // Step 4: Malzemeler
  const [shoppingByCook, setShoppingByCook] = useState(false);
  const [rawIngredientsText, setRawIngredientsText] = useState(
    '2 Çuval Osmancık Pirinç\n40 kg Dana Kuşbaşı\n1 Teneke Sıvı Yağ (18 lt)\n5 kg Nohut\n3 kg Salça ve Tuz'
  );
  const [notes, setNotes] = useState('');

  const weekendPresets = useMemo(() => getUpcomingWeekendPresets(), []);

  if (!isOpen) return null;

  // Compute total price based on pricing type
  const countNumber = Number(guestCount) || 0;
  const computedTotal =
    pricingType === 'perGuest'
      ? (Number(pricePerGuest) || 0) * countNumber
      : Number(lumpSumPrice) || 0;

  const depositNumber = Number(initialDeposit) || 0;
  const initialRemaining = Math.max(0, computedTotal - depositNumber);
  const totalAssistantWages = assistants.reduce((sum, a) => sum + (Number(a.wage) || 0), 0);

  const handleAddAssistant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAssistantName.trim()) return;

    setAssistants([
      ...assistants,
      {
        id: 'ast_' + Date.now().toString(36),
        name: newAssistantName.trim(),
        wage: Number(newAssistantWage) || 0,
      },
    ]);

    setNewAssistantName('');
    setNewAssistantWage('');
  };

  const handleRemoveAssistant = (id: string) => {
    setAssistants(assistants.filter((a) => a.id !== id));
  };

  const parseIngredients = (): IngredientItem[] => {
    const lines = rawIngredientsText
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
      .filter(Boolean);

    return lines.map((line, idx) => ({
      id: 'ing_' + Date.now().toString(36) + '_' + idx,
      name: line,
      purchased: false,
      actualCost: 0,
    }));
  };

  // 1-Tap Fast Save from Step 1 (Elderly Cook shortcut)
  const handleQuickSave = () => {
    if (!title.trim()) {
      alert('Lütfen düğünün veya ev sahibinin adını yazın.');
      return;
    }

    onSaveJob({
      title: title.trim(),
      date,
      location: location.trim(),
      guestCount: countNumber || 500,
      pricingType: 'lumpSum',
      totalPrice: computedTotal || 40000,
      payments: depositNumber > 0 ? [{
        id: 'pay_' + Date.now().toString(36),
        amount: depositNumber,
        date: new Date().toISOString().split('T')[0],
        note: depositNote.trim() || 'İlk Kapora',
      }] : [],
      assistants: [],
      shoppingByCook: false,
      ingredients: parseIngredients(),
      status: 'active',
      notes: notes.trim(),
    });

    onClose();
  };

  const handleFinalSubmit = () => {
    if (!title.trim() || !date) {
      setCurrentStep(1);
      return;
    }

    const payments: PaymentRecord[] = [];
    if (depositNumber > 0) {
      payments.push({
        id: 'pay_' + Date.now().toString(36),
        amount: depositNumber,
        date: new Date().toISOString().split('T')[0],
        note: depositNote.trim() || 'İlk Kapora',
      });
    }

    const structuredIngredients = parseIngredients();

    onSaveJob({
      title: title.trim(),
      date,
      location: location.trim(),
      guestCount: countNumber,
      pricingType,
      pricePerGuest: pricingType === 'perGuest' ? Number(pricePerGuest) : undefined,
      totalPrice: computedTotal,
      payments,
      assistants,
      shoppingByCook,
      ingredients: structuredIngredients,
      status: 'active',
      notes: notes.trim(),
    });

    onClose();
  };

  const handleNextStep = () => {
    if (currentStep === 1 && (!title.trim() || !date)) {
      alert('Lütfen ev sahibinin veya düğünün adını girin.');
      return;
    }
    setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    // Scroll container back to top on step transition
    const scroller = document.getElementById('wizard-scroll-container');
    if (scroller) scroller.scrollTop = 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-slate-100 overflow-hidden">
      {/* 1. Header with Step Info & Fast Actions */}
      <header className="shrink-0 border-b-2 border-slate-200 bg-white px-3 sm:px-4 py-3 shadow-xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          {/* Back or Step info */}
          <div className="flex items-center gap-2 min-w-0">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label="Geri"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 block">
                Adım {currentStep} / 4
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                {currentStep === 1 && '1. Düğün / İş Künyesi'}
                {currentStep === 2 && '2. Fiyat & İlk Kapora'}
                {currentStep === 3 && '3. Ekip & Yevmiyeler'}
                {currentStep === 4 && '4. Malzemeler & Alışveriş'}
              </h2>
            </div>
          </div>

          {/* Close & Header Next Shortcut */}
          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700 min-h-[40px]"
              >
                <span>İleri</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 min-h-[40px]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Kaydet</span>
              </button>
            )}

            <button
              onClick={onClose}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-100"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mx-auto max-w-2xl mt-2 grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${
                currentStep >= step ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </header>

      {/* 2. Scrollable Body (Natural Flow with Ample Keyboard Breathing Room) */}
      <div
        id="wizard-scroll-container"
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 pb-48"
      >
        <div className="mx-auto max-w-2xl space-y-4">
          {/* ========================================================= */}
          {/* STEP 1: İş Künyesi (Tek Dokunuş Presets & No autoFocus)   */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
              {/* Field 1: Ev Sahibinin Adı */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                  Ev Sahibinin veya Düğünün Adı *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Mehmet Ağa Düğünü veya Hacı Salih Mevlidi"
                  className="w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-base sm:text-lg font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[54px]"
                />
                {/* Fast Title Addons */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">Hızlı Ekle:</span>
                  {['Düğünü', 'Mevlidi', 'Sünneti', 'Hayrı'].map((addon) => (
                    <button
                      key={addon}
                      type="button"
                      onClick={() => {
                        if (!title) {
                          setTitle(addon);
                        } else if (!title.includes(addon)) {
                          setTitle(`${title.trim()} ${addon}`);
                        }
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 shrink-0"
                    >
                      +{addon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Tarih & Hafta Sonu Tek Dokunuş Seçenekleri */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Yemek Tarihi *</span>
                  </label>
                  <span className="text-[11px] font-bold text-blue-600">
                    Klavyeye basmadan seçebilirsiniz:
                  </span>
                </div>

                {/* Weekend Fast Chips */}
                <div className="grid grid-cols-2 gap-1.5">
                  {weekendPresets.map((wp) => (
                    <button
                      key={wp.dateStr}
                      type="button"
                      onClick={() => setDate(wp.dateStr)}
                      className={`py-2 px-2.5 rounded-xl border-2 text-xs font-black transition-all truncate text-left ${
                        date === wp.dateStr
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      📅 {wp.label}
                    </button>
                  ))}
                </div>

                {/* Native Date Input */}
                <div className="pt-1">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>

              {/* Field 3: Kişi Sayısı & Hazır Seçenekler */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kaç Kişilik Yemek? *</span>
                  </label>
                  <span className="text-xs font-black font-mono text-blue-700">
                    {guestCount} Kişi
                  </span>
                </div>

                {/* Quick Count Presets */}
                <div className="grid grid-cols-5 gap-1.5">
                  {['250', '500', '750', '1000', '1500'].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setGuestCount(cnt)}
                      className={`py-2.5 rounded-xl border-2 text-xs sm:text-sm font-black transition-all ${
                        guestCount === cnt
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                {/* Custom Guest Count Input if different */}
                <div className="pt-1">
                  <input
                    type="number"
                    min="1"
                    step="10"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    placeholder="Farklı kişi sayısı yazın (Örn: 600)"
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>

              {/* Field 4: Yer / Mahalle */}
              <div className="pt-1 border-t border-slate-100">
                <label className="block text-xs font-black text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Köy / Mahalle / Salon Adresi (İsteğe Bağlı)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Örn: Akçaköy Meydanı veya Salon Kardelen"
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[48px]"
                />
              </div>

              {/* Action 1: 5-Second Fast Save Button (Elderly Cook Saver!) */}
              <div className="pt-3 border-t-2 border-dashed border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={handleQuickSave}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 text-base font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition-all min-h-[54px]"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>⚡ 5 Saniyede Hızlı Kaydet (Fiyatı Sonra Gir)</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Acele işiniz varsa veya telefondaysanız şimdi kaydedip fiyat ve çırakları sonra ekleyebilirsiniz.
                </p>
              </div>

              {/* Action 2: Continue to Pricing Step */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 px-5 text-base font-black text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 active:scale-98 transition-all min-h-[54px]"
                >
                  <span>Adım 2: Fiyat ve Kapora Yaz &gt;</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: Fiyat & Kapora (Preset Buttons)                   */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                  Fiyat Nasıl Anlaşıldı?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingType('lumpSum')}
                    className={`py-3 px-3 rounded-xl border-2 font-black text-xs sm:text-sm transition-all min-h-[48px] ${
                      pricingType === 'lumpSum'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Toplam Götürü Fiyat
                  </button>

                  <button
                    type="button"
                    onClick={() => setPricingType('perGuest')}
                    className={`py-3 px-3 rounded-xl border-2 font-black text-xs sm:text-sm transition-all min-h-[48px] ${
                      pricingType === 'perGuest'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Kişi Başı Ücret
                  </button>
                </div>
              </div>

              {pricingType === 'lumpSum' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 uppercase">
                    Anlaşılan Toplam İş Ücreti (₺) *
                  </label>
                  {/* Preset Lump Sum Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {['25000', '40000', '60000', '80000'].map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setLumpSumPrice(price)}
                        className={`py-2 rounded-xl border-2 text-xs font-black font-mono transition-all ${
                          lumpSumPrice === price
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {Number(price).toLocaleString('tr-TR')} ₺
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={lumpSumPrice}
                    onChange={(e) => setLumpSumPrice(e.target.value)}
                    placeholder="Örn: 40000"
                    className="w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-xl font-black text-slate-900 font-mono focus:bg-white focus:border-blue-600 focus:outline-none min-h-[52px]"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                        Kişi Başı Ücret (₺)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={pricePerGuest}
                        onChange={(e) => setPricePerGuest(e.target.value)}
                        placeholder="80"
                        className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2.5 text-base font-black text-slate-900 font-mono focus:bg-white focus:border-blue-600 focus:outline-none min-h-[48px]"
                      />
                    </div>

                    <div className="rounded-xl bg-blue-50 p-2.5 flex flex-col justify-center border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-800 uppercase">
                        Toplam ({countNumber} × {pricePerGuest || 0} ₺):
                      </span>
                      <span className="text-base font-black text-blue-950 font-mono">
                        {formatTL(computedTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Kapora Section with Single-Tap Presets */}
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-700">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>Alınan İlk Kapora / Avans</span>
                  </div>
                  <span className="text-xs font-black font-mono text-emerald-700">
                    {formatTL(depositNumber)}
                  </span>
                </div>

                {/* Preset Deposit Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Yok (0)', val: '0' },
                    { label: '5.000 ₺', val: '5000' },
                    { label: '10.000 ₺', val: '10000' },
                    { label: '20.000 ₺', val: '20000' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setInitialDeposit(p.val)}
                      className={`py-2 rounded-xl border-2 text-xs font-black transition-all ${
                        initialDeposit === p.val
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    placeholder="Farklı Kapora (₺)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-900 font-mono focus:border-blue-600 focus:outline-none min-h-[46px]"
                  />
                  <input
                    type="text"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                    placeholder="İlk Kapora Notu"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none min-h-[46px]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 font-bold">Kalan Net Alacak:</span>
                  <span className="font-black font-mono text-emerald-700 text-base">
                    {formatTL(initialRemaining)}
                  </span>
                </div>
              </div>

              {/* Step Navigation Inline Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-2xl border-2 border-slate-300 py-3.5 px-4 text-sm font-bold text-slate-600 min-h-[52px]"
                >
                  &lt; Geri
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 rounded-2xl bg-blue-600 py-3.5 px-4 text-base font-black text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 min-h-[52px]"
                >
                  Adım 3: Ekip &amp; Çıraklar &gt;
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: Ekip & Çırak Yevmiyeleri                          */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
              <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-800 uppercase">Toplam Ekip Masrafı</span>
                  <div className="text-xl font-black text-blue-950 font-mono tabular-nums">
                    {formatTL(totalAssistantWages)}
                  </div>
                </div>
                <span className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                  {assistants.length} Kişi
                </span>
              </div>

              {/* Add Assistant */}
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase">Çırak / Kalfa Ekle</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newAssistantName}
                    onChange={(e) => setNewAssistantName(e.target.value)}
                    placeholder="Adı (Örn: Ahmet)"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none min-h-[46px]"
                  />
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newAssistantWage}
                    onChange={(e) => setNewAssistantWage(e.target.value)}
                    placeholder="Yevmiye (₺)"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-bold font-mono text-slate-900 focus:border-blue-600 focus:outline-none min-h-[46px]"
                  />
                </div>

                {/* Fast Wage Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">Hızlı Yevmiye:</span>
                  {['1000', '1500', '2000', '2500'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setNewAssistantWage(w)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold font-mono text-slate-700 shrink-0"
                    >
                      {w} ₺
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddAssistant()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-700 min-h-[46px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Listeye Çırak Ekle</span>
                </button>
              </div>

              {/* List of Added Assistants */}
              <div className="space-y-1.5">
                {assistants.map((ast) => (
                  <div
                    key={ast.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-slate-900">{ast.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-700 font-mono">
                        {formatTL(ast.wage)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAssistant(ast.id)}
                        className="text-slate-400 hover:text-red-600 p-1 min-h-[36px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step Navigation Inline Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-2xl border-2 border-slate-300 py-3.5 px-4 text-sm font-bold text-slate-600 min-h-[52px]"
                >
                  &lt; Geri
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 rounded-2xl bg-blue-600 py-3.5 px-4 text-base font-black text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 min-h-[52px]"
                >
                  Adım 4: Malzemeler &gt;
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: Malzemeler & Alışveriş                             */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                  Malzemeyi Kim Alacak?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShoppingByCook(false)}
                    className={`py-3 px-3 rounded-xl border-2 font-black text-xs sm:text-sm transition-all min-h-[48px] ${
                      !shoppingByCook
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Ev Sahibi Alacak
                  </button>

                  <button
                    type="button"
                    onClick={() => setShoppingByCook(true)}
                    className={`py-3 px-3 rounded-xl border-2 font-black text-xs sm:text-sm transition-all min-h-[48px] ${
                      shoppingByCook
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Usta (Ben) Alacağım
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Malzeme Listesi (Her satıra bir malzeme)
                </label>
                <textarea
                  rows={5}
                  value={rawIngredientsText}
                  onChange={(e) => setRawIngredientsText(e.target.value)}
                  placeholder="Örn:&#10;40 kg Dana Kuşbaşı&#10;2 Çuval Osmancık Pirinç&#10;1 Teneke Sıvı Yağ"
                  className="w-full rounded-2xl border-2 border-slate-300 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Özel Notlar (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Kazanlar Cuma akşamdan kurulacak"
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[46px]"
                />
              </div>

              {/* Step Navigation Inline Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="rounded-2xl border-2 border-slate-300 py-3.5 px-4 text-sm font-bold text-slate-600 min-h-[52px]"
                >
                  &lt; Geri
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 px-4 text-base font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 min-h-[52px]"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>İşi Deftere Kaydet</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
