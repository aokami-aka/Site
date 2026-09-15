// Service to handle episode push notifications for subscribed animes (Native Mobile/OS Push Only)

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

/**
 * Creates a high-definition 1:1 square icon with proper center-cover crop
 * so mobile push notification icons are NEVER squished or flattened.
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

    // Center-cover crop calculation
    const imgAspect = img.width / img.height;
    let drawWidth = size;
    let drawHeight = size;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > 1) {
      // Image is wider than square
      drawWidth = size * imgAspect;
      offsetX = -(drawWidth - size) / 2;
    } else {
      // Image is taller than square (vertical anime poster)
      drawHeight = size / imgAspect;
      // Focus slightly upper-center (character faces)
      offsetY = -(drawHeight - size) * 0.22;
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    const squareDataUrl = canvas.toDataURL('image/png');
    iconCache.set(imageUrl, squareDataUrl);
    return squareDataUrl;
  } catch {
    // Fallback if CORS or canvas generation fails
    return imageUrl || '/pwa-192x192.png';
  }
}

// Trigger mobile native push notification in phone status bar & notification tray
export async function triggerEpisodePushNotification(
  animeTitle: string,
  episodeNumber: number | string,
  posterImage: string,
  animeId: number,
  options: { customBody?: string } = {}
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
  const notificationTitle = `AnimeGuides • Novo Episódio!`;
  const notificationBody =
    options.customBody ||
    `O episódio ${cleanEp} de "${animeTitle}" acabou de ser lançado!`;

  // 2. Prepare aspect-ratio-safe square icon for mobile notification avatar
  const squareIcon = await createSquareNotificationIcon(posterImage);

  // 3. Dispatch native Mobile / Web Notification ONLY to system notification tray
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Try service worker notification first (native push on Android / PWA)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(notificationTitle, {
            body: notificationBody,
            icon: squareIcon,
            image: posterImage, // Full wide banner / cover image on Android expanded notification
            badge: '/pwa-192x192.png',
            tag: `anime-${animeId}-ep-${cleanEp}`,
            renotify: true,
            data: { animeId, url: window.location.href },
          } as NotificationOptions);
          return;
        }
      }

      // Fallback to standard native Notification API
      new Notification(notificationTitle, {
        body: notificationBody,
        icon: squareIcon,
        image: posterImage,
      } as NotificationOptions);
    } catch (err) {
      console.warn('Native mobile notification trigger error:', err);
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

  // Trigger confirmation push notification on phone
  await triggerEpisodePushNotification(
    titleStr,
    nextEp,
    poster,
    anime.id,
    {
      customBody: `Notificações ativadas! Você será avisado no celular assim que o Episódio ${nextEp} for lançado.`,
    }
  );

  window.dispatchEvent(new CustomEvent('animeguides:subscription-updated', { detail: { animeId: anime.id, subscribed: true } }));
  return { subscribed: true, permission: perm };
}

// Background checker for subscribed animes episode release
export function checkSubscribedAnimesAiring(): void {
  if (typeof window === 'undefined') return;
  const list = getSubscribedAnimes();
  if (list.length === 0) return;

  const nowSeconds = Math.floor(Date.now() / 1000);
  let updated = false;

  list.forEach((sub) => {
    if (sub.nextAiringAt && sub.nextAiringAt <= nowSeconds) {
      const epToNotify = sub.nextEpisodeNumber || 1;
      if (sub.lastNotifiedEpisode !== epToNotify) {
        // Trigger push notification on phone for the exact episode
        triggerEpisodePushNotification(
          sub.title,
          epToNotify,
          sub.posterImage,
          sub.id
        );
        sub.lastNotifiedEpisode = epToNotify;
        sub.nextEpisodeNumber = epToNotify + 1;
        // Schedule next weekly episode if unknown (7 days in future)
        sub.nextAiringAt = sub.nextAiringAt + 7 * 24 * 60 * 60;
        updated = true;
      }
    }
  });

  if (updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

// Start periodic airing checker (every 60 seconds)
if (typeof window !== 'undefined') {
  setInterval(checkSubscribedAnimesAiring, 60000);
  window.addEventListener('focus', checkSubscribedAnimesAiring);
}
