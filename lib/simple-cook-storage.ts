'use client';

export interface SimpleWedding {
  id: string;
  title: string;           // Düğün / Ev Sahibi Adı (örn: Hacı Salih Düğünü)
  date: string;            // YYYY-MM-DD
  guestCount: number;      // Kişi sayısı (örn: 500)
  phone?: string;          // Ev sahibi telefonu
  notes?: string;          // Menü veya özel not (örn: Çorba, Etli Pilav, Helva)
  agreedAmount: number;    // Anlaşılan ücret
  receivedDeposit: number; // Alınan peşinat
  isCompleted: boolean;    // Düğün bitti mi
  createdAt: string;
}

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

export interface SimpleShoppingItem {
  id: string;
  weddingId?: string;
  weddingTitle?: string;
  title: string;           // Liste başlığı veya açıklaması
  photoDataUrl: string;    // Orijinal kağıt liste fotoğrafı
  strokes: DrawingStroke[];// Üzerine parmakla çizilen çizgiler
  notes?: string;
  updatedAt: string;
}

export interface SimpleWorkerPay {
  id: string;
  weddingId?: string;
  weddingTitle?: string;
  workerName: string;      // Çırak / Aşçı yardımcısı adı
  agreedWage: number;      // Anlaşılan yevmiye
  paidAmount: number;      // Ödenen miktar
  date: string;            // YYYY-MM-DD
  notes?: string;
}

export interface SimpleDatabase {
  weddings: SimpleWedding[];
  shoppingItems: SimpleShoppingItem[];
  workerPays: SimpleWorkerPay[];
}

const SIMPLE_STORAGE_KEY = 'asci_simple_db';

let cachedDb: SimpleDatabase | null = null;
let cachedRawString: string | null = null;
const simpleListeners = new Set<() => void>();

function notifySimpleListeners() {
  simpleListeners.forEach((listener) => listener());
}

export function subscribeSimpleStorage(callback: () => void): () => void {
  simpleListeners.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SIMPLE_STORAGE_KEY) {
      cachedDb = null;
      cachedRawString = null;
      notifySimpleListeners();
    }
  };

  const handleCustom = () => {
    notifySimpleListeners();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('simple-storage-update', handleCustom);
  }

  return () => {
    simpleListeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('simple-storage-update', handleCustom);
    }
  };
}

export function getSimpleDbSnapshot(): SimpleDatabase {
  if (typeof window === 'undefined') {
    return { weddings: [], shoppingItems: [], workerPays: [] };
  }

  try {
    const raw = localStorage.getItem(SIMPLE_STORAGE_KEY);
    if (raw === cachedRawString && cachedDb) {
      return cachedDb;
    }

    if (!raw) {
      const initialDb: SimpleDatabase = {
        weddings: [],
        shoppingItems: [],
        workerPays: [],
      };
      cachedDb = initialDb;
      cachedRawString = null;
      return initialDb;
    }

    const parsed = JSON.parse(raw);
    const validDb: SimpleDatabase = {
      weddings: Array.isArray(parsed.weddings) ? parsed.weddings : [],
      shoppingItems: Array.isArray(parsed.shoppingItems) ? parsed.shoppingItems : [],
      workerPays: Array.isArray(parsed.workerPays) ? parsed.workerPays : [],
    };

    cachedRawString = raw;
    cachedDb = validDb;
    return validDb;
  } catch (e) {
    console.error('Failed to parse simple database from localStorage:', e);
    return { weddings: [], shoppingItems: [], workerPays: [] };
  }
}

const SERVER_SNAPSHOT: SimpleDatabase = {
  weddings: [],
  shoppingItems: [],
  workerPays: [],
};

export function getSimpleDbServerSnapshot(): SimpleDatabase {
  return SERVER_SNAPSHOT;
}

export function saveSimpleDatabase(db: SimpleDatabase) {
  if (typeof window === 'undefined') return;

  try {
    const raw = JSON.stringify(db);
    localStorage.setItem(SIMPLE_STORAGE_KEY, raw);
    cachedRawString = raw;
    cachedDb = db;
    notifySimpleListeners();
    window.dispatchEvent(new CustomEvent('simple-storage-update'));
  } catch (error) {
    console.error('Failed to save simple database to localStorage:', error);
  }
}

// Formatters
export function formatTL(amount: number): string {
  const num = Math.round(amount || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺';
}

export function formatDateTurkish(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const days = [
        'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
      ];
      return `${day} ${months[month]} ${days[d.getDay()]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getRelativeDayLabel(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  if (dateStr === todayStr) return 'Bugün';

  const targetDate = new Date(dateStr);
  const todayDate = new Date(todayStr);
  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yarın';
  if (diffDays === -1) return 'Dün';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} gün sonra`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} gün önce`;

  return '';
}
