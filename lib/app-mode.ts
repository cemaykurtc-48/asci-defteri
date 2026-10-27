'use client';

export type AppMode = 'simple' | 'advanced';

const MODE_STORAGE_KEY = 'cook_app_mode';

let cachedMode: AppMode | null | undefined = undefined;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeAppMode(callback: () => void): () => void {
  listeners.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === MODE_STORAGE_KEY) {
      cachedMode = (e.newValue as AppMode) || null;
      notifyListeners();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

export function getAppModeSnapshot(): AppMode | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (cachedMode !== undefined) {
    return cachedMode;
  }

  const saved = localStorage.getItem(MODE_STORAGE_KEY);
  if (saved === 'simple' || saved === 'advanced') {
    cachedMode = saved;
    return saved;
  }

  cachedMode = null;
  return null;
}

export function getAppModeServerSnapshot(): AppMode | null {
  return null;
}

export function setAppMode(mode: AppMode) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    cachedMode = mode;
    notifyListeners();
  } catch (error) {
    console.error('Failed to set app mode:', error);
  }
}

export function resetAppMode() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(MODE_STORAGE_KEY);
    cachedMode = null;
    notifyListeners();
  } catch (error) {
    console.error('Failed to reset app mode:', error);
  }
}
