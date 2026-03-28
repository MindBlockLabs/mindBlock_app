'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import WalletOption from './wallet/WalletOption';
import {
  PhantomIcon,
  MetaMaskIcon,
  CoinbaseIcon,
  TrustIcon,
  FreighterIcon,
} from './wallet/WalletIcons';

export type WalletType = 'phantom' | 'metamask' | 'coinbase' | 'trust' | 'freighter';

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (walletType: WalletType) => void;
}

interface WalletConfig {
  id: WalletType;
  name: string;
  icon: React.ReactNode;
  isDetected: boolean;
}

const WALLETS: WalletConfig[] = [
  {
    id: 'freighter',
    name: 'Freighter',
    icon: <FreighterIcon />,
    isDetected: typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).freighter,
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: <PhantomIcon />,
    isDetected: typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).phantom,
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: <MetaMaskIcon />,
    isDetected:
      typeof window !== 'undefined' &&
      !!(window as unknown as { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: <CoinbaseIcon />,
    isDetected:
      typeof window !== 'undefined' &&
      !!(window as unknown as { ethereum?: { isCoinbaseWallet?: boolean } }).ethereum?.isCoinbaseWallet,
  },
  {
    id: 'trust',
    name: 'Trust',
    icon: <TrustIcon />,
    isDetected:
      typeof window !== 'undefined' &&
      !!(window as unknown as { ethereum?: { isTrust?: boolean } }).ethereum?.isTrust,
  },
];

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onSelect }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus close button on open, restore focus on close
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap within modal
  const handleTabKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    []
  );

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm bg-[#0A1628] border border-white/10 rounded-2xl shadow-2xl p-6"
        onKeyDown={handleTabKey}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg p-1"
          aria-label="Close wallet modal"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2
          id="wallet-modal-title"
          className="text-center text-[#E6E6E6] font-semibold text-base mb-6 pr-6"
        >
          Connect a wallet to continue
        </h2>

        {/* Wallet list */}
        <div className="flex flex-col gap-1" role="list">
          {WALLETS.map((wallet) => (
            <div key={wallet.id} role="listitem">
              <WalletOption
                name={wallet.name}
                icon={wallet.icon}
                isDetected={wallet.isDetected}
                onClick={() => onSelect(wallet.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
