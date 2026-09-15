import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, ExternalLink, Sparkles } from 'lucide-react';
import { PushNotificationPayload } from '../services/notificationService';

interface NotificationState {
  payload: PushNotificationPayload;
  title: string;
  body: string;
}

interface MobilePushNotificationProps {
  onOpenAnime?: (animeId: number) => void;
}

export const MobilePushNotification: React.FC<MobilePushNotificationProps> = ({ onOpenAnime }) => {
  const [currentNotification, setCurrentNotification] = useState<NotificationState | null>(null);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{
        payload: PushNotificationPayload;
        title: string;
        body: string;
      }>;
      if (customEvent.detail) {
        setCurrentNotification(customEvent.detail);
      }
    };

    window.addEventListener('animeguides:show-push-notification', handleNotification);
    return () => {
      window.removeEventListener('animeguides:show-push-notification', handleNotification);
    };
  }, []);

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    if (!currentNotification) return;
    const timer = setTimeout(() => {
      setCurrentNotification(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [currentNotification]);

  if (!currentNotification) return null;

  const { payload, title, body } = currentNotification;

  return (
    <AnimatePresence>
      <div className="fixed top-3 sm:top-5 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none">
        <motion.div
          key={payload.id}
          initial={{ y: -80, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -70, opacity: 0, scale: 0.94 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="pointer-events-auto w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl bg-[#0f172a]/95 md:bg-[#0c121e]/90 md:backdrop-blur-2xl border border-cyan-500/40 p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(6,182,212,0.25)] text-white select-none cursor-pointer group"
          onClick={() => {
            if (onOpenAnime && payload.animeId) {
              onOpenAnime(payload.animeId);
              setCurrentNotification(null);
            }
          }}
        >
          {/* Top header row: App identity & timestamp like native Android / iOS notification */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-sm">
                <Bell className="w-3 h-3 text-slate-950 fill-current" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-cyan-300 font-display">
                AnimeGuides
              </span>
              <span className="text-[10px] text-slate-400">• agora</span>
              {payload.isSimulation && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Teste
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentNotification(null);
              }}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Fechar notificação"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Main content with poster & text */}
          <div className="flex items-start gap-3">
            {payload.posterImage ? (
              <div className="relative w-12 h-16 sm:w-13 sm:h-18 rounded-lg overflow-hidden shrink-0 border border-white/15 shadow-md bg-slate-900">
                <img
                  src={payload.posterImage}
                  alt={payload.animeTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                <Sparkles className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug truncate group-hover:text-cyan-300 transition-colors">
                {title}
              </h4>
              <p className="text-xs text-slate-300 font-medium line-clamp-2 mt-0.5 leading-relaxed">
                {body}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-cyan-400 font-semibold">
                <span>Toque para ver o anime</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
