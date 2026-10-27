export interface PaymentRecord {
  id: string;
  amount: number;       // Tahsil edilen tutar (₺)
  date: string;         // Tahsilat tarihi (YYYY-MM-DD)
  note: string;         // Açıklama (Örn: "İlk Kapora", "Düğün günü nakit")
}

export interface IngredientItem {
  id: string;
  name: string;         // Malzeme adı ve miktarı (Örn: "40 kg Dana Kuşbaşı")
  purchased: boolean;   // Alındı mı?
  actualCost: number;   // Gerçek alış tutarı (₺)
}

export interface Assistant {
  id: string;
  name: string;         // Çırak / Kalfa adı
  wage: number;         // Yevmiye tutarı (₺)
}

export interface CookJob {
  id: string;
  title: string;          // Ev sahibi / İş adı (Örn: Mehmet Ağa Düğünü)
  date: string;           // Tarih (YYYY-MM-DD)
  location: string;       // Yer / Köy / Mahalle (Örn: Akçaköy Meydanı)
  guestCount: number;     // Kişi Sayısı (Örn: 500)
  
  // Fiyat Modeli
  pricingType: 'lumpSum' | 'perGuest';
  pricePerGuest?: number;
  totalPrice: number;     // Anlaşılan Toplam İş Ücreti (₺)
  
  // Cari Tahsilat Günlüğü
  payments: PaymentRecord[];
  
  // Ekip & Yevmiyeler
  assistants: Assistant[];
  
  // Alışveriş & Malzemeler
  shoppingByCook: boolean;    // Alışverişi usta mı yapacak?
  ingredients: IngredientItem[];
  
  status: 'active' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface GeneralTransaction {
  id: string;
  type: 'expense' | 'income';
  category: 'tup' | 'mazot' | 'tamir' | 'diger' | 'ekip' | 'avans' | 'tahsilat' | 'ekstra_gelir';
  title: string;          // Açıklama (Örn: "2 Adet Sanayi Tüpü")
  amount: number;         // Tutar (₺)
  date: string;           // Tarih (YYYY-MM-DD)
  jobId?: string;         // İsteğe bağlı ilgili iş
  jobTitle?: string;
}

const JOBS_STORAGE_KEY = 'asci_defteri_jobs_v5';
const TRANSACTIONS_STORAGE_KEY = 'asci_defteri_transactions_v5';

// Hydration-safe external store listeners
const storageListeners = new Set<() => void>();

function notifyStorageListeners() {
  storageListeners.forEach((listener) => listener());
}

export function subscribeStorage(callback: () => void) {
  storageListeners.add(callback);
  return () => {
    storageListeners.delete(callback);
  };
}

let memoryJobs: CookJob[] = [];
let jobsInitialized = false;

export function loadJobs(): CookJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('İşler okunurken hata:', err);
    return [];
  }
}

export function getJobsSnapshot(): CookJob[] {
  if (typeof window === 'undefined') return EMPTY_JOBS;
  if (!jobsInitialized) {
    memoryJobs = loadJobs();
    jobsInitialized = true;
  }
  return memoryJobs;
}

const EMPTY_JOBS: CookJob[] = [];
export function getJobsServerSnapshot(): CookJob[] {
  return EMPTY_JOBS;
}

export function saveJobs(jobs: CookJob[]): void {
  memoryJobs = jobs;
  jobsInitialized = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (err) {
      console.error('İşler kaydedilirken hata:', err);
    }
  }
  notifyStorageListeners();
}

let memoryTransactions: GeneralTransaction[] = [];
let transactionsInitialized = false;

export function loadGeneralTransactions(): GeneralTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Genel işlemler okunurken hata:', err);
    return [];
  }
}

export function getTransactionsSnapshot(): GeneralTransaction[] {
  if (typeof window === 'undefined') return EMPTY_TRANSACTIONS;
  if (!transactionsInitialized) {
    memoryTransactions = loadGeneralTransactions();
    transactionsInitialized = true;
  }
  return memoryTransactions;
}

const EMPTY_TRANSACTIONS: GeneralTransaction[] = [];
export function getTransactionsServerSnapshot(): GeneralTransaction[] {
  return EMPTY_TRANSACTIONS;
}

export function saveGeneralTransactions(transactions: GeneralTransaction[]): void {
  memoryTransactions = transactions;
  transactionsInitialized = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    } catch (err) {
      console.error('Genel işlemler kaydedilirken hata:', err);
    }
  }
  notifyStorageListeners();
}

// Financial Calculations
export function getTotalPaid(job: CookJob): number {
  return (job.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

export function getRemainingBalance(job: CookJob): number {
  const total = Number(job.totalPrice) || 0;
  const paid = getTotalPaid(job);
  return Math.max(0, total - paid);
}

export function getAssistantTotal(job: CookJob): number {
  return (job.assistants || []).reduce((sum, a) => sum + (Number(a.wage) || 0), 0);
}

export function getShoppingExpense(job: CookJob): number {
  if (!job.shoppingByCook) return 0;
  return (job.ingredients || []).reduce((sum, i) => sum + (Number(i.actualCost) || 0), 0);
}

export function getTotalExpenses(job: CookJob): number {
  const assistants = getAssistantTotal(job);
  const shopping = getShoppingExpense(job);
  return assistants + shopping;
}

export function getNetProfit(job: CookJob): number {
  const total = Number(job.totalPrice) || 0;
  const expenses = getTotalExpenses(job);
  return total - expenses;
}

// Global Financial Aggregators
export function getTotalReceivables(jobs: CookJob[]): number {
  return jobs
    .filter((j) => j.status === 'active')
    .reduce((sum, j) => sum + getRemainingBalance(j), 0);
}

export function getTotalJobPayments(jobs: CookJob[]): number {
  return jobs.reduce((sum, j) => sum + getTotalPaid(j), 0);
}

export function getTotalJobExpenses(jobs: CookJob[]): number {
  return jobs.reduce((sum, j) => sum + getTotalExpenses(j), 0);
}

export function getTotalGeneralExpenses(transactions: GeneralTransaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

export function getTotalGeneralIncomes(transactions: GeneralTransaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

// Kasadaki Net Nakit = (İşlerden Alınan Tahsilatlar + Genel Gelirler) - (İş Masrafları + Genel Giderler)
export function getNetCashBalance(jobs: CookJob[], transactions: GeneralTransaction[]): number {
  const totalIn = getTotalJobPayments(jobs) + getTotalGeneralIncomes(transactions);
  const totalOut = getTotalJobExpenses(jobs) + getTotalGeneralExpenses(transactions);
  return totalIn - totalOut;
}

// Format Turkish Lira
export function formatTL(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format Turkish Date
export function formatCookDate(dateStr: string): string {
  if (!dateStr) return '';
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
}
