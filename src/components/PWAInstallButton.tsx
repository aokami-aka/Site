import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  id?: string;
  className?: string;
  variant?: 'default' | 'pill' | 'header' | 'subtle';
  showLabelOnMobile?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  id = 'pwa-install-btn',
  className = '',
  variant = 'default',
  showLabelOnMobile = false,
}) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed in standalone mode, hide the button
  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowModal(true);
      return;
    }

    const result = await installApp();
    if (result === 'guide') {
      setShowModal(true);
    }
  };

  let defaultClasses = 'inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition-all shadow-sm cursor-pointer';

  if (variant === 'subtle') {
    defaultClasses = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-cyan-300 text-xs font-bold transition-all cursor-pointer';
  } else if (variant === 'pill') {
    defaultClasses = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold shadow-sm cursor-pointer';
  }

  return (
    <>
      <button
        id={id}
        onClick={handleClick}
        className={`${defaultClasses} ${className}`}
        title={isIOS ? 'Como instalar o AnimeGuides no iOS' : 'Instalar AnimeGuides como aplicativo'}
      >
        {isIOS ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Download className="w-3.5 h-3.5" />}
        <span className={showLabelOnMobile ? 'inline' : 'hidden sm:inline'}>
          {isIOS ? 'Instalar no iOS' : 'Instalar App'}
        </span>
      </button>

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isIOS={isIOS}
      />
    </>
  );
};
