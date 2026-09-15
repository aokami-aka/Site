// Service to handle episode push notifications for subscribed animes

export interface SubscribedAnime {
  id: number;
  malId?: number;
  anilistId?: number;
  title: string;
  posterImage: string;
  status: string;
  currentEpisode?: number | string;
  totalEpisodes?: number | string;
  nextEpisodeNumber?: number;
  nextAiringAt?: number; // epoch timestamp in seconds
  lastNotifiedEpisode?: number;
  subscribedAt: number;
}

export interface PushNotificationPayload {
  id: string;
  animeId: number;
  animeTitle: string;
  episodeNumber: number | string;
  posterImage: string;
  timestamp: number;
  isSimulation?: boolean;
}

const STORAGE_KEY = 'animeguides_subscribed_animes';
const PWA_OVERRIDE_KEY = 'animeguides_pwa_simulated';

// Detect if running as installed PWA (Standalone mode)
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://');

  // Allow developer or preview simulation flag
  const isSimulated = localStorage.getItem(PWA_OVERRIDE_KEY) === 'true';

  return isStandalone || isSimulated;
}

export function setPWASimulated(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    localStorage.setItem(PWA_OVERRIDE_KEY, 'true');
  } else {
    localStorage.removeItem(PWA_OVERRIDE_KEY);
  }
  window.dispatchEvent(new CustomEvent('animeguides:pwa-state-changed', { detail: { isPWA: isPWAInstalled() } }));
}

export function getSubscribedAnimes(): SubscribedAnime[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read subscribed animes:', err);
    return [];
  }
}

export function isAnimeSubscribed(animeId: number): boolean {
  const list = getSubscribedAnimes();
  return list.some((item) => item.id === animeId);
}

// Request Native Web Notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

// Synthesize pleasant mobile push notification chime via Web Audio API
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a friendly two-tone bell chime (C6 to G6)
    const now = ctx.currentTime;
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now); // C6
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (higher note)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.12); // G6
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Ignore audio play errors
  }
}

// Trigger mobile push notification (Native Notification + In-App Heads-Up Banner)
export async function triggerEpisodePushNotification(
  animeTitle: string,
  episodeNumber: number | string,
  posterImage: string,
  animeId: number,
  options: { isSimulation?: boolean; customBody?: string } = {}
): Promise<void> {
  // 1. Play sound and haptic vibration (cell phone push feel)
  playNotificationSound();
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 60, 160]);
    } catch {
      // Ignore vibration error
    }
  }

  const notificationTitle = `AnimeGuides • Novo Episódio!`;
  const notificationBody =
    options.customBody ||
    `O episódio ${episodeNumber} de "${animeTitle}" acabou de ser lançado! Toque para ver detalhes.`;

  // 2. Dispatch in-app cell phone notification banner event
  const payload: PushNotificationPayload = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    animeId,
    animeTitle,
    episodeNumber,
    posterImage,
    timestamp: Date.now(),
    isSimulation: options.isSimulation,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('animeguides:show-push-notification', {
        detail: {
          payload,
          title: notificationTitle,
          body: notificationBody,
        },
      })
    );
  }

  // 3. Dispatch native Web Notification (if permission granted or available)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Try service worker notification first (best for PWA)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(notificationTitle, {
            body: notificationBody,
            icon: posterImage || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `anime-${animeId}-ep-${episodeNumber}`,
            data: { animeId, url: window.location.href },
          } as NotificationOptions);
          return;
        }
      }

      // Fallback to standard Notification API
      new Notification(notificationTitle, {
        body: notificationBody,
        icon: posterImage || '/pwa-192x192.png',
      });
    } catch (err) {
      console.warn('Native notification failed, in-app banner displayed:', err);
    }
  }
}

// Toggle anime subscription
export async function toggleAnimeNotification(
  anime: {
    id: number;
    malId?: number;
    anilistId?: number;
    title: { romaji: string; portuguese?: string; english?: string };
    coverImages?: string[];
    status: string;
    episodes?: number | string;
    nextAiringEpisode?: { episode: number; airingAt?: number };
  }
): Promise<{ subscribed: boolean; permission: NotificationPermission }> {
  const list = getSubscribedAnimes();
  const exists = list.some((item) => item.id === anime.id);

  if (exists) {
    // Unsubscribe
    const updated = list.filter((item) => item.id !== anime.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('animeguides:subscription-updated', { detail: { animeId: anime.id, subscribed: false } }));
    return { subscribed: false, permission: Notification.permission || 'default' };
  }

  // Subscribe: Request permission first
  const perm = await requestNotificationPermission();

  const titleStr = anime.title.portuguese || anime.title.romaji;
  const poster = anime.coverImages && anime.coverImages[0] ? anime.coverImages[0] : '';
  const nextEp = anime.nextAiringEpisode?.episode || (typeof anime.episodes === 'number' ? 1 : 1);

  const newSub: SubscribedAnime = {
    id: anime.id,
    malId: anime.malId,
    anilistId: anime.anilistId,
    title: titleStr,
    posterImage: poster,
    status: anime.status,
    currentEpisode: anime.nextAiringEpisode ? Math.max(1, anime.nextAiringEpisode.episode - 1) : 1,
    totalEpisodes: anime.episodes,
    nextEpisodeNumber: nextEp,
    nextAiringAt: anime.nextAiringEpisode?.airingAt,
    lastNotifiedEpisode: anime.nextAiringEpisode ? Math.max(0, anime.nextAiringEpisode.episode - 1) : 0,
    subscribedAt: Date.now(),
  };

  list.push(newSub);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  // Trigger immediate confirmation notification with cell phone sound and banner
  triggerEpisodePushNotification(
    titleStr,
    nextEp,
    poster,
    anime.id,
    {
      customBody: `Notificações ativadas com sucesso! Você será avisado no celular assim que o Episódio ${nextEp} for lançado.`,
      isSimulation: false,
    }
  );

  window.dispatchEvent(new CustomEvent('animeguides:subscription-updated', { detail: { animeId: anime.id, subscribed: true } }));
  return { subscribed: true, permission: perm };
}

// Simulate episode release for testing
export function simulateEpisodeRelease(animeId: number): boolean {
  const list = getSubscribedAnimes();
  const sub = list.find((s) => s.id === animeId);
  if (!sub) return false;

  const nextNum = (sub.nextEpisodeNumber || 1) + 1;
  sub.nextEpisodeNumber = nextNum;
  sub.lastNotifiedEpisode = nextNum;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  triggerEpisodePushNotification(
    sub.title,
    nextNum,
    sub.posterImage,
    sub.id,
    { isSimulation: true }
  );

  return true;
}
