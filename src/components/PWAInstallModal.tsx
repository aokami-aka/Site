import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, Smartphone, X, Bell, Check, Sparkles, Download, ArrowUpRight } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS = true,
}) => {
  if (!isOpen) return null;

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
          className="relative w-full max-w-md bg-[#0c121e] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10 overflow-hidden text-slate-100"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display leading-tight">
                {isIOS ? 'Instalar no iOS' : 'Instalar Aplicativo'}
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
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141b2c] border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Toque em Compartilhar</span>
                    <Share className="w-4 h-4 text-cyan-400 inline" />
                  </div>
                  Na barra inferior do <strong>Safari</strong>, toque no ícone de compartilhamento (quadrado com a seta para cima).
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141b2c] border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <span>Adicionar à Tela de Início</span>
                    <PlusSquare className="w-4 h-4 text-cyan-400 inline" />
                  </div>
                  Role o menu de opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141b2c] border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
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
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-2.5 text-[11px] text-cyan-200/90 leading-relaxed">
                <Bell className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Importante no iOS:</strong> Ao instalar na Tela de Início, você libera o modo de tela cheia nativo e recebe os <strong>avisos de novos episódios</strong> em tempo real.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 my-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141b2c] border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Toque nos três pontos do navegador ou na barra de endereço e escolha <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-2.5 text-[11px] text-cyan-200/90 leading-relaxed">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
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
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition-all cursor-pointer text-center"
            >
              Entendi!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};