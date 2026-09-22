import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { PWAInstallModal, PWA_SEASON_THEMES } from './PWAInstallModal';
import { Season } from '../types';

interface PWAInstallButtonProps {
  id?: string;
  className?: string;
  variant?: 'default' | 'pill' | 'header' | 'subtle';
  showLabelOnMobile?: boolean;
  season?: Season;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  id = 'pwa-install-btn',
  className = '',
  variant = 'default',
  showLabelOnMobile = false,
  season = 'WINTER',
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

  const theme = PWA_SEASON_THEMES[season] || PWA_SEASON_THEMES.WINTER;

  let defaultClasses = `inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl ${theme.buttonDefaultClasses} text-xs font-bold transition-all shadow-sm cursor-pointer`;

  if (variant === 'subtle') {
    defaultClasses = `inline-flex items-center gap-1.5 px-3 py-1.5 ${theme.buttonSubtleClasses} text-xs font-bold transition-all cursor-pointer`;
  } else if (variant === 'pill') {
    defaultClasses = `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ${theme.buttonPillClasses} text-xs font-bold shadow-sm cursor-pointer`;
  }

  return (
    <>
      <button
        id={id}
        onClick={handleClick}
        className={`${defaultClasses} ${className}`}
        title={isIOS ? 'Como instalar o AnimeGuides no iPhone' : 'Instalar AnimeGuides como aplicativo'}
      >
        {isIOS ? (
          <Smartphone className={`w-3.5 h-3.5 ${theme.buttonIconColor}`} />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span className={showLabelOnMobile ? 'inline' : 'hidden sm:inline'}>
          {isIOS ? 'Instalar no iPhone' : 'Instalar App'}
        </span>
      </button>

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isIOS={isIOS}
        season={season}
      />
    </>
  );
};
