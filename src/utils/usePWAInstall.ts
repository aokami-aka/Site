import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('animeguides_pwa_simulated') === 'true';
      return isStandalone;
    };

    if (checkIsInstalled()) {
      setIsInstalled(true);
      return;
    }

    const onPWAStateChange = () => {
      setIsInstalled(checkIsInstalled());
    };
    window.addEventListener('animeguides:pwa-state-changed', onPWAStateChange);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('animeguides:pwa-state-changed', onPWAStateChange);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
  };

  return { isInstallable, isInstalled, installApp };
}
