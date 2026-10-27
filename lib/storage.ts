import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export interface Wedding {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  note?: string;
  completed?: boolean;
  createdAt?: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
  imageNoteUrl?: string;
  createdAt?: string;
}

export interface BalanceEntry {
  id: string;
  type: 'customer' | 'expense';
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  description?: string;
  status: 'open' | 'settled';
  createdAt?: string;
}

export interface AppData {
  weddings: Wedding[];
  shopping: ShoppingItem[];
  balances: BalanceEntry[];
}

const STORAGE_KEY = 'kolaydefter_data_v2';
const DEVICE_KEY = 'kolaydefter_device_id';

// Calculate realistic dates for sample data
const today = new Date();
const formatDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_DATA: AppData = {
  weddings: [
    {
      id: 'w-1',
      title: 'Zeynep & Murat Düğünü',
      date: formatDate(4),
      time: '19:30',
      location: 'Kardelen Kır Düğün Bahçesi',
      note: 'Çeyrek altın takılacak, annemle saat 19:00’da buluşulacak.',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'w-2',
      title: 'Kuzen Ahmet Sünnet Merasimi',
      date: formatDate(18),
      time: '13:00',
      location: 'Belediye Kültür Merkezi',
      note: 'Hediye paketi hazırlandı.',
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ],
  shopping: [
    {
      id: 's-1',
      text: '2 Somun Ekmek (Köy ekmeği)',
      completed: false,
      category: 'Fırın',
      createdAt: new Date().toISOString(),
    },
    {
      id: 's-2',
      text: '1 kg Çeri Domates, 1 Demet Taze Maydanoz',
      completed: false,
      category: 'Manav',
      createdAt: new Date().toISOString(),
    },
    {
      id: 's-3',
      text: 'Tam Yağlı Beyaz Peynir ve 2 lt Süt',
      completed: true,
      category: 'Market',
      createdAt: new Date().toISOString(),
    },
    {
      id: 's-4',
      text: 'Sızma Zeytinyağı (Teneke)',
      completed: false,
      category: 'Market',
      createdAt: new Date().toISOString(),
    },
  ],
  balances: [
    {
      id: 'b-1',
      type: 'customer',
      name: 'Hasan Bey (Mutfak Dolabı)',
      totalAmount: 25000,
      paidAmount: 18000,
      remainingAmount: 7000,
      description: 'Montaj bitti, kulplar takılınca kalan 7.000 ₺ teslim alınacak.',
      status: 'open',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b-2',
      type: 'customer',
      name: 'Merve Hanım (Salon Boyası)',
      totalAmount: 9000,
      paidAmount: 9000,
      remainingAmount: 0,
      description: 'İş teslim edildi, ödemesi eksiksiz elden alındı.',
      status: 'settled',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b-3',
      type: 'expense',
      name: 'Usta Mehmet (Alçı Ustası)',
      totalAmount: 6000,
      paidAmount: 4000,
      remainingAmount: 2000,
      description: 'Hafta sonu kalan iş bitiminde 2.000 ₺ verilecek.',
      status: 'open',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b-4',
      type: 'expense',
      name: 'Yıldız Nalbur (Boya & Malzeme)',
      totalAmount: 4200,
      paidAmount: 4200,
      remainingAmount: 0,
      description: 'Fatura ödendi ve kapatıldı.',
      status: 'settled',
      createdAt: new Date().toISOString(),
    },
  ],
};

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device';
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = 'kd_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

export function loadLocalData(): AppData {
  if (typeof window === 'undefined') return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocalData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      weddings: Array.isArray(parsed.weddings) ? parsed.weddings : DEFAULT_DATA.weddings,
      shopping: Array.isArray(parsed.shopping) ? parsed.shopping : DEFAULT_DATA.shopping,
      balances: Array.isArray(parsed.balances) ? parsed.balances : DEFAULT_DATA.balances,
    };
  } catch (e) {
    console.error('Veri okuma hatası:', e);
    return DEFAULT_DATA;
  }
}

export function saveLocalData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Veri kaydetme hatası:', e);
  }
}

// Background Cloud Sync to Firestore
export async function syncToFirestore(data: AppData, onSyncStatus?: (syncing: boolean) => void) {
  if (typeof window === 'undefined') return;
  const deviceId = getDeviceId();
  if (!deviceId) return;

  try {
    onSyncStatus?.(true);

    // Save summary doc
    await setDoc(doc(db, 'devices', deviceId), {
      lastUpdated: new Date().toISOString(),
      weddingsCount: data.weddings.length,
      shoppingCount: data.shopping.length,
      balancesCount: data.balances.length,
    });

    // Sync weddings batch
    for (const wedding of data.weddings) {
      await setDoc(doc(db, 'devices', deviceId, 'weddings', wedding.id), {
        title: wedding.title || '',
        date: wedding.date || '',
        time: wedding.time || '',
        location: wedding.location || '',
        note: wedding.note || '',
        completed: Boolean(wedding.completed),
        createdAt: wedding.createdAt || new Date().toISOString(),
      });
    }

    // Sync shopping items
    for (const item of data.shopping) {
      await setDoc(doc(db, 'devices', deviceId, 'shopping', item.id), {
        text: item.text || '',
        completed: Boolean(item.completed),
        category: item.category || 'Genel',
        imageNoteUrl: item.imageNoteUrl || '',
        createdAt: item.createdAt || new Date().toISOString(),
      });
    }

    // Sync balances
    for (const b of data.balances) {
      await setDoc(doc(db, 'devices', deviceId, 'balances', b.id), {
        type: b.type,
        name: b.name || '',
        totalAmount: Number(b.totalAmount) || 0,
        paidAmount: Number(b.paidAmount) || 0,
        remainingAmount: Number(b.remainingAmount) || 0,
        description: b.description || '',
        status: b.status || 'open',
        createdAt: b.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Bulut senkronizasyonu ertelendi (çevrimdışı veya geçici ağ durumu):', err);
  } finally {
    onSyncStatus?.(false);
  }
}

// Fetch Cloud Data if user previously saved
export async function fetchFromFirestore(): Promise<AppData | null> {
  if (typeof window === 'undefined') return null;
  const deviceId = getDeviceId();
  if (!deviceId) return null;

  try {
    const [wSnap, sSnap, bSnap] = await Promise.all([
      getDocs(collection(db, 'devices', deviceId, 'weddings')),
      getDocs(collection(db, 'devices', deviceId, 'shopping')),
      getDocs(collection(db, 'devices', deviceId, 'balances')),
    ]);

    if (wSnap.empty && sSnap.empty && bSnap.empty) {
      return null;
    }

    const weddings: Wedding[] = wSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Wedding, 'id'>),
    }));

    const shopping: ShoppingItem[] = sSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ShoppingItem, 'id'>),
    }));

    const balances: BalanceEntry[] = bSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<BalanceEntry, 'id'>),
    }));

    return { weddings, shopping, balances };
  } catch (err) {
    console.warn('Buluttan veri çekme hatası (yerel veri kullanılacak):', err);
    return null;
  }
}
