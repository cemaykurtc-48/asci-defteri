'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const emptySubscribe = () => () => {};

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Hydration-safe subscription to standalone / installed status
  const isInstalled = useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const media = window.matchMedia('(display-mode: standalone)');
      media.addEventListener('change', callback);
      window.addEventListener('appinstalled', callback);
      return () => {
        media.removeEventListener('change', callback);
        window.removeEventListener('appinstalled', callback);
      };
    },
    () => {
      if (typeof window === 'undefined') return false;
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      );
    },
    () => false
  );

  // Hydration-safe subscription to iOS check
  const isIOS = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === 'undefined') return false;
      return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    },
    () => false
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
