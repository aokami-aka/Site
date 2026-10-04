// Service to handle episode push notifications for subscribed animes (Native Mobile/OS Push Only)

export interface SubscribedAnime {
  id: number;
  malId?: number;
  anilistId?: number;
  title: string;
  posterImage: string;
  status: string;
  season?: string;
  seasonYear?: number;
  currentEpisode?: number | string;
  totalEpisodes?: number | string;
  nextEpisodeNumber?: number;
  nextAiringAt?: number; // epoch timestamp in seconds
  lastNotifiedEpisode?: number;
  lastDayNotifiedEpisode?: number;
  lastAirNotifiedEpisode?: number;
  subscribedAt: number;
}

const STORAGE_KEY = 'animeguides_subscribed_animes';
const PWA_OVERRIDE_KEY = 'animeguides_pwa_simulated';
const iconCache = new Map<string, string>();

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
      registerWebPushSubscription().catch(() => {});
      return 'granted';
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      registerWebPushSubscription().catch(() => {});
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers Web Push subscription with VAPID key and syncs device with backend server.
 * This ensures notifications are sent to the mobile device in the background even when the app/page is closed.
 */
export async function registerWebPushSubscription(animes?: SubscribedAnime[]): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) return false;

    // 1. Get Public VAPID Key from Server
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) return false;
    const keyData = await keyRes.json();
    const vapidPublicKey = keyData?.publicKey;
    if (!vapidPublicKey) return false;

    // 2. Subscribe or retrieve active PushSubscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    if (!subscription) return false;

    // 3. Register / Sync with Backend Server
    const listToSync = animes || getSubscribedAnimes();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        subscribedAnimes: listToSync,
      }),
    });

    // 4. Register Periodic Sync (if supported by Chrome on Android)
    if ('periodicSync' in registration) {
      try {
        const periodicSync = (registration as any).periodicSync;
        const tags = await periodicSync.getTags();
        if (!tags.includes('check-anime-airing')) {
          await periodicSync.register('check-anime-airing', {
            minInterval: 60 * 60 * 1000, // 1 hour
          });
        }
      } catch {
        // Periodic sync registration can fail if permissions / battery conditions aren't met
      }
    }

    return true;
  } catch (err) {
    console.warn('Web push subscription registration error:', err);
    return false;
  }
}

/**
 * Synchronizes the user's subscribed anime list with the backend server.
 */
export async function syncPushSubscriptionsWithServer(animes?: SubscribedAnime[]): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const currentList = animes || getSubscribedAnimes();

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration || !('pushManager' in registration)) return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription && Notification.permission === 'granted') {
      await registerWebPushSubscription(currentList);
      return;
    }

    if (subscription) {
      await fetch('/api/push/sync-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          subscription: subscription.toJSON(),
          subscribedAnimes: currentList,
        }),
      });
    }
  } catch (err) {
    console.warn('Could not sync push subscriptions with server:', err);
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
  } catch {
    // Ignore audio play errors
  }
}

/**
 * Formats epoch timestamp into Brazilian standard time (Brasília / America/Sao_Paulo).
 * Returns the formatted time (e.g. "15:30"), the date string, and whether it airs today in Brazil.
 */
export function formatBrazilAirTime(airingEpochSeconds: number): {
  timeStr: string;
  dateStr: string;
  isTodayInBrazil: boolean;
} {
  const date = new Date(airingEpochSeconds * 1000);

  // Time in Brasília timezone (24h format)
  const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timeStr = timeFormatter.format(date);

  // Date in Brasília timezone (YYYY-MM-DD format for exact matching)
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = dateFormatter.format(date);
  const todayInBrazil = dateFormatter.format(new Date());

  return {
    timeStr,
    dateStr,
    isTodayInBrazil: dateStr === todayInBrazil,
  };
}

/**
 * Creates a high-definition notification icon containing the COMPLETE anime poster
 * (contain mode, uncropped) on a refined dark canvas matching the app design.
 * This guarantees the complete poster art and title are fully visible without being cut off.
 */
export async function createSquareNotificationIcon(imageUrl: string): Promise<string> {
  if (!imageUrl || typeof window === 'undefined') {
    return '/pwa-192x192.png';
  }

  if (iconCache.has(imageUrl)) {
    return iconCache.get(imageUrl)!;
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = imageUrl;
    });

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageUrl;

    // Fill canvas with deep slate background matching AnimeGuides theme
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);

    // Contain calculation: scale image so 100% of the poster fits inside the canvas
    const padding = 10;
    const maxDrawWidth = size - padding * 2;
    const maxDrawHeight = size - padding * 2;
    const scale = Math.min(maxDrawWidth / img.width, maxDrawHeight / img.height);
    const drawWidth = Math.round(img.width * scale);
    const drawHeight = Math.round(img.height * scale);
    const offsetX = Math.round((size - drawWidth) / 2);
    const offsetY = Math.round((size - drawHeight) / 2);

    // Render soft drop shadow behind the poster
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    // Subtle rounded corners for the contained poster
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(offsetX + radius, offsetY);
    ctx.lineTo(offsetX + drawWidth - radius, offsetY);
    ctx.quadraticCurveTo(offsetX + drawWidth, offsetY, offsetX + drawWidth, offsetY + radius);
    ctx.lineTo(offsetX + drawWidth, offsetY + drawHeight - radius);
    ctx.quadraticCurveTo(offsetX + drawWidth, offsetY + drawHeight, offsetX + drawWidth - radius, offsetY + drawHeight);
    ctx.lineTo(offsetX + radius, offsetY + drawHeight);
    ctx.quadraticCurveTo(offsetX, offsetY + drawHeight, offsetX, offsetY + drawHeight - radius);
    ctx.lineTo(offsetX, offsetY + radius);
    ctx.quadraticCurveTo(offsetX, offsetY, offsetX + radius, offsetY);
    ctx.closePath();
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.clip();

    // Draw full uncropped poster
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    const squareDataUrl = canvas.toDataURL('image/png');
    iconCache.set(imageUrl, squareDataUrl);
    return squareDataUrl;
  } catch {
    // Fallback if CORS or canvas generation fails
    return imageUrl || '/pwa-192x192.png';
  }
}

export interface TriggerNotificationOptions {
  title?: string;
  customBody?: string;
  tag?: string;
  season?: string;
  seasonYear?: number;
  targetUrl?: string;
}

// Trigger mobile native push notification in phone status bar & notification tray
// Displays the full poster inside the icon thumbnail without giant banner cropping,
// ensuring the entire text is fully readable on mobile.
export async function triggerEpisodePushNotification(
  animeTitle: string,
  episodeNumber: number | string,
  posterImage: string,
  animeId: number,
  options: TriggerNotificationOptions = {}
): Promise<void> {
  // 1. Play sound and haptic vibration (cell phone push feeling)
  playNotificationSound();
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([140, 70, 160]);
    } catch {
      // Ignore vibration error
    }
  }

  const cleanEp = typeof episodeNumber === 'number' ? episodeNumber : parseInt(String(episodeNumber), 10) || episodeNumber;
  const notificationTitle = options.title || `AnimeGuides • Novo Episódio!`;
  const notificationBody =
    options.customBody ||
    `O episódio ${cleanEp} de "${animeTitle}" acabou de ser lançado!`;

  // 2. Prepare aspect-ratio-safe complete poster icon for notification thumbnail
  const completePosterIcon = await createSquareNotificationIcon(posterImage);

  // 3. Build destination URL to open season page with exact anime details modal
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const searchParams = new URLSearchParams();
  searchParams.set('view', 'season');
  if (options.seasonYear) searchParams.set('year', String(options.seasonYear));
  if (options.season) searchParams.set('season', String(options.season));
  searchParams.set('animeId', String(animeId));

  const targetUrl = options.targetUrl || `${origin}/?${searchParams.toString()}`;
  const notificationTag = options.tag || `anime-${animeId}-ep-${cleanEp}`;

  // 4. Dispatch native Mobile / Web Notification to system tray
  // NOTE: We deliberately do NOT provide 'image' here. Omitting 'image' allows mobile OS
  // (like Android / One UI) to render the full notification text without truncating,
  // while displaying the complete uncropped poster as the smaller 'icon' thumbnail.
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(notificationTitle, {
            body: notificationBody,
            icon: completePosterIcon,
            badge: '/pwa-192x192.png',
            tag: notificationTag,
            renotify: true,
            data: {
              animeId,
              year: options.seasonYear,
              season: options.season,
              url: targetUrl,
            },
          } as NotificationOptions);
          return;
        }
      }

      // Fallback to standard native Notification API
      const notif = new Notification(notificationTitle, {
        body: notificationBody,
        icon: completePosterIcon,
        tag: notificationTag,
        data: {
          animeId,
          year: options.seasonYear,
          season: options.season,
          url: targetUrl,
        },
      } as NotificationOptions);

      notif.onclick = () => {
        window.focus();
        window.location.href = targetUrl;
      };
    } catch (err) {
      console.warn('Native mobile notification trigger error:', err);
    }
  }
}

// Toggle anime subscription (Silent toggle with permission prompt, NO popup push notification on click)
export async function toggleAnimeNotification(
  anime: {
    id: number;
    malId?: number;
    anilistId?: number;
    title: { romaji: string; portuguese?: string; english?: string };
    coverImages?: string[];
    status: string;
    episodes?: number | string;
    season?: string;
    seasonYear?: number;
    nextAiringEpisode?: { episode: number; airingAt?: number };
  }
): Promise<{ subscribed: boolean; permission: NotificationPermission }> {
  const list = getSubscribedAnimes();
  const exists = list.some((item) => item.id === anime.id);

  if (exists) {
    // Unsubscribe
    const updated = list.filter((item) => item.id !== anime.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    syncPushSubscriptionsWithServer(updated);
    window.dispatchEvent(new CustomEvent('animeguides:subscription-updated', { detail: { animeId: anime.id, subscribed: false } }));
    return { subscribed: false, permission: Notification.permission || 'default' };
  }

  // Subscribe: Request permission first if needed
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
    season: anime.season,
    seasonYear: anime.seasonYear,
    currentEpisode: anime.nextAiringEpisode ? Math.max(1, anime.nextAiringEpisode.episode - 1) : 1,
    totalEpisodes: anime.episodes,
    nextEpisodeNumber: nextEp,
    nextAiringAt: anime.nextAiringEpisode?.airingAt,
    lastNotifiedEpisode: anime.nextAiringEpisode ? Math.max(0, anime.nextAiringEpisode.episode - 1) : 0,
    subscribedAt: Date.now(),
  };

  list.push(newSub);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  // Sync with Web Push server to ensure background push when app is closed
  if (perm === 'granted') {
    registerWebPushSubscription(list).catch(() => {});
  } else {
    syncPushSubscriptionsWithServer(list);
  }

  // User specifically requested: "Retire a notificação que aparece ao clicar no sino."
  // Do NOT trigger any confirmation push notification when clicking the bell.

  window.dispatchEvent(new CustomEvent('animeguides:subscription-updated', { detail: { animeId: anime.id, subscribed: true } }));
  return { subscribed: true, permission: perm };
}

// Background checker for subscribed animes episode release:
// 1. First notification: On the date of episode launch, informing what time it airs in Brazil.
// 2. Second notification: Exactly when the release time arrives, informing that it has launched.
export function checkSubscribedAnimesAiring(): void {
  if (typeof window === 'undefined') return;
  const list = getSubscribedAnimes();
  if (list.length === 0) return;

  const nowSeconds = Math.floor(Date.now() / 1000);
  let updated = false;

  list.forEach((sub) => {
    if (!sub.nextAiringAt) return;

    const epToNotify = sub.nextEpisodeNumber || 1;
    const brazilAir = formatBrazilAirTime(sub.nextAiringAt);

    // Notification 1: On the date of the release (before the exact launch time)
    if (brazilAir.isTodayInBrazil && nowSeconds < sub.nextAiringAt) {
      if (sub.lastDayNotifiedEpisode !== epToNotify) {
        triggerEpisodePushNotification(
          sub.title,
          epToNotify,
          sub.posterImage,
          sub.id,
          {
            title: `AnimeGuides • Lançamento Hoje!`,
            customBody: `Hoje tem episódio novo de "${sub.title}"! O episódio ${epToNotify} será lançado às ${brazilAir.timeStr} (horário de Brasília).`,
            tag: `anime-${sub.id}-ep-${epToNotify}-day`,
            season: sub.season,
            seasonYear: sub.seasonYear,
          }
        );
        sub.lastDayNotifiedEpisode = epToNotify;
        updated = true;
      }
    }

    // Notification 2: Exactly when the launch time arrives
    if (nowSeconds >= sub.nextAiringAt) {
      if (sub.lastAirNotifiedEpisode !== epToNotify) {
        triggerEpisodePushNotification(
          sub.title,
          epToNotify,
          sub.posterImage,
          sub.id,
          {
            title: `AnimeGuides • Episódio Lançado!`,
            customBody: `O episódio ${epToNotify} de "${sub.title}" acabou de ser lançado! Assista agora.`,
            tag: `anime-${sub.id}-ep-${epToNotify}-air`,
            season: sub.season,
            seasonYear: sub.seasonYear,
          }
        );
        sub.lastAirNotifiedEpisode = epToNotify;
        sub.lastNotifiedEpisode = epToNotify;
        sub.nextEpisodeNumber = epToNotify + 1;
        // Schedule next weekly episode (7 days in future)
        sub.nextAiringAt = sub.nextAiringAt + 7 * 24 * 60 * 60;
        updated = true;
      }
    }
  });

  if (updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    syncPushSubscriptionsWithServer(list);
  }
}

// Automatically sync Web Push subscription on app boot if permission already granted
if (typeof window !== 'undefined') {
  if ('Notification' in window && Notification.permission === 'granted') {
    // Give Service Worker a moment to become active then register push
    setTimeout(() => {
      registerWebPushSubscription().catch(() => {});
    }, 1500);
  }

  setInterval(checkSubscribedAnimesAiring, 60000);
  window.addEventListener('focus', checkSubscribedAnimesAiring);
}

