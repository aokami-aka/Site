import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const checkIsInstalled = () => {
      if (typeof window === 'undefined') return false;
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('animeguides_pwa_simulated') === 'true';
      return isStandalone;
    };

    const installed = checkIsInstalled();
    setIsInstalled(installed);

    // Detect iOS devices (iPhone, iPad, iPod) & Safari
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice =
        /iphone|ipad|ipod/.test(userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
      const isSafariBrowser = /safari/.test(userAgent) && !/chrome|chromium|edg|crios|fxios/.test(userAgent);

      setIsIOS(isIOSDevice);
      setIsSafari(isSafariBrowser);

      // On iOS or Safari, if not already installed, always offer the install option
      if (isIOSDevice && !installed) {
        setIsInstallable(true);
      }
    }

    if (installed) return;

    const onPWAStateChange = () => {
      const isNowInstalled = checkIsInstalled();
      setIsInstalled(isNowInstalled);
      if (isNowInstalled) {
        setIsInstallable(false);
      }
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

  const installApp = async (): Promise<'native' | 'guide'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstallable(false);
        }
        return 'native';
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }
    // If no native prompt is available (e.g., on iOS Safari), trigger the guide modal
    return 'guide';
  };

  return { isInstallable, isInstalled, isIOS, isSafari, installApp };
}
