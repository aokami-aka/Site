import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, Smartphone, X, Bell, Check, Sparkles } from 'lucide-react';
import { Season } from '../types';
import {
  SnowflakeIcon,
  SakuraIcon,
  SunHanabiIcon,
  MapleLeafMomijiIcon,
} from './SeasonIcons';

export interface PWASeasonTheme {
  namePt: string;
  modalBorder: string;
  glowPrimary: string;
  glowSecondary: string;
  glowBoxShadow: string;
  iconGradient: string;
  iconGlow: string;
  stepNumber: string;
  stepHighlightText: string;
  stepIcon: string;
  stepCardBorder: string;
  stepCardBg: string;
  benefitBox: string;
  benefitIcon: string;
  buttonGradient: string;
  buttonShadow: string;
  buttonTextColor: string;
  accentText: string;
}

export const PWA_SEASON_THEMES: Record<Season, PWASeasonTheme> = {
  WINTER: {
    namePt: 'Inverno',
    modalBorder: 'border-sky-500/40',
    glowPrimary: 'bg-sky-500/15',
    glowSecondary: 'bg-blue-600/10',
    glowBoxShadow: 'shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(56,189,248,0.18)]',
    iconGradient: 'bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-600',
    iconGlow: 'shadow-sky-500/30',
    stepNumber: 'bg-sky-500/20 text-sky-300',
    stepHighlightText: 'text-sky-400',
    stepIcon: 'text-sky-400',
    stepCardBorder: 'border-sky-500/15',
    stepCardBg: 'bg-[#101826]',
    benefitBox: 'bg-sky-950/40 text-sky-200/90',
    benefitIcon: 'text-sky-400',
    buttonGradient: 'bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500',
    buttonShadow: 'shadow-sky-500/25',
    buttonTextColor: 'text-white',
    accentText: 'text-sky-400',
  },
  SPRING: {
    namePt: 'Primavera',
    modalBorder: 'border-pink-500/40',
    glowPrimary: 'bg-pink-500/15',
    glowSecondary: 'bg-rose-600/10',
    glowBoxShadow: 'shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(244,114,182,0.18)]',
    iconGradient: 'bg-gradient-to-tr from-pink-600 via-pink-500 to-rose-600',
    iconGlow: 'shadow-pink-500/30',
    stepNumber: 'bg-pink-500/20 text-pink-300',
    stepHighlightText: 'text-pink-400',
    stepIcon: 'text-pink-400',
    stepCardBorder: 'border-pink-500/15',
    stepCardBg: 'bg-[#1b101c]',
    benefitBox: 'bg-pink-950/40 text-pink-200/90',
    benefitIcon: 'text-pink-400',
    buttonGradient: 'bg-gradient-to-r from-pink-600 via-pink-500 to-rose-600 hover:from-pink-500 hover:to-rose-500',
    buttonShadow: 'shadow-pink-500/25',
    buttonTextColor: 'text-white',
    accentText: 'text-pink-400',
  },
  SUMMER: {
    namePt: 'Verão',
    modalBorder: 'border-amber-500/40',
    glowPrimary: 'bg-amber-500/15',
    glowSecondary: 'bg-yellow-600/10',
    glowBoxShadow: 'shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(251,191,36,0.18)]',
    iconGradient: 'bg-gradient-to-tr from-amber-100 via-amber-400 to-yellow-900',
    iconGlow: 'shadow-amber-500/30',
    stepNumber: 'bg-amber-500/20 text-amber-300',
    stepHighlightText: 'text-amber-400',
    stepIcon: 'text-amber-400',
    stepCardBorder: 'border-amber-500/15',
    stepCardBg: 'bg-[#1b160d]',
    benefitBox: 'bg-amber-950/40 text-amber-200/90',
    benefitIcon: 'text-amber-400',
    buttonGradient: 'bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400',
    buttonShadow: 'shadow-amber-500/25',
    buttonTextColor: 'text-slate-950 font-black',
    accentText: 'text-amber-400',
  },
  FALL: {
    namePt: 'Outono',
    modalBorder: 'border-orange-500/40',
    glowPrimary: 'bg-orange-500/15',
    glowSecondary: 'bg-amber-600/10',
    glowBoxShadow: 'shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(249,115,22,0.18)]',
    iconGradient: 'bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-600',
    iconGlow: 'shadow-orange-500/30',
    stepNumber: 'bg-orange-500/20 text-orange-300',
    stepHighlightText: 'text-orange-400',
    stepIcon: 'text-orange-400',
    stepCardBorder: 'border-orange-500/15',
    stepCardBg: 'bg-[#1b120c]',
    benefitBox: 'bg-orange-950/40 text-orange-200/90',
    benefitIcon: 'text-orange-400',
    buttonGradient: 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500',
    buttonShadow: 'shadow-orange-500/25',
    buttonTextColor: 'text-white',
    accentText: 'text-orange-400',
  },
};

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS?: boolean;
  season?: Season;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS = true,
  season = 'WINTER',
}) => {
  if (!isOpen) return null;

  const theme = PWA_SEASON_THEMES[season] || PWA_SEASON_THEMES.WINTER;

  const renderSeasonIcon = () => {
    switch (season) {
      case 'WINTER':
        return <SnowflakeIcon className="w-20 h-20 opacity-10 text-sky-400" />;
      case 'SPRING':
        return <SakuraIcon className="w-20 h-20 opacity-10 text-pink-400" />;
      case 'SUMMER':
        return <SunHanabiIcon className="w-20 h-20 opacity-10 text-amber-400" />;
      case 'FALL':
        return <MapleLeafMomijiIcon className="w-20 h-20 opacity-10 text-orange-400" />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className={`relative w-full max-w-md bg-[#0c121e] border ${theme.modalBorder} rounded-2xl p-5 sm:p-6 ${theme.glowBoxShadow} z-10 overflow-hidden text-slate-100`}
        >
          {/* Subtle Ambient Season Glows */}
          <div className={`absolute top-0 right-0 w-48 h-48 ${theme.glowPrimary} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 ${theme.glowSecondary} rounded-full blur-3xl pointer-events-none`} />

          {/* Atmospheric Watermark Seasonal Icon */}
          <div className="absolute -bottom-4 -right-4 pointer-events-none select-none">
            {renderSeasonIcon()}
          </div>

          {/* Close Button */}
          <button
            id="pwa-install-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5 pr-8">
            <div className={`w-11 h-11 rounded-xl ${theme.iconGradient} flex items-center justify-center shadow-lg ${theme.iconGlow} flex-shrink-0`}>
              <Smartphone className={`w-6 h-6 ${season === 'SUMMER' ? 'text-slate-950' : 'text-white'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display leading-tight">
                {isIOS ? 'Instalar no iPhone / iPad' : 'Instalar Aplicativo'}
              </h3>
              <p className="text-xs text-slate-400">
                {isIOS
                  ? 'Como adicionar o AnimeGuides à Tela de Início no iOS Safari'
                  : 'Tenha o AnimeGuides instalado diretamente no seu celular'}
              </p>
            </div>
          </div>

          {/* Step-by-step instructions */}
          {isIOS ? (
            <div className="space-y-3 my-4">
              {/* Step 1 */}
              <div className={`flex items-start gap-3 p-3 rounded-xl ${theme.stepCardBg} border ${theme.stepCardBorder}`}>
                <div className={`w-7 h-7 rounded-lg ${theme.stepNumber} font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  1
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Toque em Compartilhar</span>
                    <Share className={`w-4 h-4 ${theme.stepIcon} inline`} />
                  </div>
                  Na barra inferior do <strong>Safari</strong>, toque no ícone de compartilhamento (quadrado com a seta para cima).
                </div>
              </div>

              {/* Step 2 */}
              <div className={`flex items-start gap-3 p-3 rounded-xl ${theme.stepCardBg} border ${theme.stepCardBorder}`}>
                <div className={`w-7 h-7 rounded-lg ${theme.stepNumber} font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  2
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Adicionar à Tela de Início</span>
                    <PlusSquare className={`w-4 h-4 ${theme.stepIcon} inline`} />
                  </div>
                  Role o menu de opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                </div>
              </div>

              {/* Step 3 */}
              <div className={`flex items-start gap-3 p-3 rounded-xl ${theme.stepCardBg} border ${theme.stepCardBorder}`}>
                <div className={`w-7 h-7 rounded-lg ${theme.stepNumber} font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  3
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Confirmar Adição</span>
                    <Check className="w-4 h-4 text-emerald-400 inline" />
                  </div>
                  Toque em <strong>"Adicionar"</strong> no canto superior direito para finalizar.
                </div>
              </div>

              {/* iOS Benefit Note */}
              <div className={`p-3 rounded-xl ${theme.benefitBox} flex items-start gap-2.5 text-[11px] leading-relaxed`}>
                <Bell className={`w-4 h-4 ${theme.benefitIcon} flex-shrink-0 mt-0.5`} />
                <span>
                  <strong>Importante no iOS:</strong> Ao instalar na Tela de Início, você libera o modo de tela cheia nativo e recebe os <strong>avisos de novos episódios</strong> em tempo real.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 my-4">
              <div className={`flex items-start gap-3 p-3 rounded-xl ${theme.stepCardBg}`}>
                <div className={`w-7 h-7 rounded-lg ${theme.stepNumber} font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  1
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Toque nos ( ⋮ ) do navegador ou na barra de endereço e escolha <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </div>
              </div>
              <div className={`p-3 rounded-xl ${theme.benefitBox} flex items-start gap-2.5 text-[11px] leading-relaxed`}>
                <span>
                  O aplicativo funcionará mais rápido, com acesso offline e notificações push para lançamentos.
                </span>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="mt-5">
            <button
              id="pwa-install-modal-ok"
              onClick={onClose}
              className={`w-full py-2.5 px-4 rounded-xl ${theme.buttonGradient} ${theme.buttonTextColor} text-xs font-bold tracking-wide shadow-lg ${theme.buttonShadow} transition-all cursor-pointer text-center`}
            >
              Entendi!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
