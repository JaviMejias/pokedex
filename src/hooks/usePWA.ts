import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  install: () => Promise<void>;
  dismissInstall: () => void;
  dismissUpdate: () => void;
  applyUpdate: () => void;
  forceReload: () => void;
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installDismissed, setInstallDismissed] = useState(() => localStorage.getItem('pwa-install-dismissed') === 'true');

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (cancelled) return;
      setRegistration(reg);
      if (reg.waiting && navigator.serviceWorker.controller) setHasUpdate(true);
    }).catch(() => {
      // SW not supported or blocked
    });

    const handleControllerChange = () => {
      console.log('Service Worker updated.');
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const dismissInstall = () => {
    setInstallDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const dismissUpdate = () => setHasUpdate(false);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const forceReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
        window.location.reload();
      }).catch(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return {
    canInstall: !!installPrompt && !isInstalled && !installDismissed,
    isInstalled,
    hasUpdate,
    install,
    dismissInstall,
    dismissUpdate,
    applyUpdate,
    forceReload,
  };
}
