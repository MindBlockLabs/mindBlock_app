"use client";

import React, { useEffect, useRef } from 'react';
import Button from './ui/Button';

interface ShareOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (platform: string) => void;
}

interface ShareOption {
  id: string;
  label: string;
  icon: string;
  color?: string;
}

const shareOptions: ShareOption[] = [
  {
    id: 'contacts',
    label: 'Contacts',
    icon: '👤',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: '✈️',
  },
  {
    id: 'twitter',
    label: 'Twitter',
    icon: '𝕏',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
  },
  {
    id: 'email',
    label: 'E-mail',
    icon: '✉️',
    color: 'text-red-400',
  },
  {
    id: 'more',
    label: 'More',
    icon: '⋯',
  },
];

const ShareOptionsSheet: React.FC<ShareOptionsSheetProps> = ({
  isOpen,
  onClose,
  onShare,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus trap - focus the first button when opened
      const firstButton = sheetRef.current?.querySelector('button');
      firstButton?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTabKey = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab' || !sheetRef.current) return;

    const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = (platform: string) => {
    onShare(platform);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-label="Close share options"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 bg-[#0D1829] rounded-t-3xl px-6 pt-6 pb-10 transform transition-transform duration-300 ease-out animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        onKeyDown={handleTabKey}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors bg-transparent p-0 cursor-pointer"
            aria-label="Close share options"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none"
              className="w-5 h-5"
            >
              <path 
                d="M15 5L5 15M5 5l10 10" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
              />
            </svg>
          </Button>
          
          <h3 
            id="share-sheet-title"
            className="font-nunito font-bold text-white text-lg"
          >
            Share Your Streak
          </h3>
          
          <div className="w-8" />
        </div>

        {/* Share Options Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {shareOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleShare(option.id)}
              className="flex flex-col items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg p-2 transition-all duration-200 cursor-pointer"
              aria-label={`Share via ${option.label}`}
            >
              {/* Circular Icon Button */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-xl 
                  transition-all duration-200 group-hover:scale-110 group-active:scale-95
                  ${option.id === 'email' 
                    ? 'bg-red-500/20 border border-red-500/40 group-hover:bg-red-500/30' 
                    : 'bg-[#1E2D45] group-hover:bg-[#FACC15]/10 border border-transparent group-hover:border-[#FACC15]/20'
                  }
                `}
              >
                <span 
                  className={`
                    transition-colors duration-200
                    ${option.color || (option.id === 'email' ? 'text-red-400' : 'text-white/80 group-hover:text-[#FACC15]')}
                  `}
                >
                  {option.icon}
                </span>
              </div>
              
              {/* Label */}
              <span 
                className={`
                  text-xs font-nunito transition-colors duration-200
                  ${option.id === 'email' 
                    ? 'text-red-400' 
                    : 'text-white/60 group-hover:text-white/80'
                  }
                `}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ShareOptionsSheet;