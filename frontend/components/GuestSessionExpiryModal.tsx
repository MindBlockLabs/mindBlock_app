'use client';

import React from 'react';

interface GuestSessionExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  reason?: string;
}

export const GuestSessionExpiryModal: React.FC<GuestSessionExpiryModalProps> = ({
  isOpen,
  onClose,
  onSignup,
  reason = 'Your 15-minute guest session has expired. Create an account to save progress and claim Web3 rewards!',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-teal-300">
            Guest Session Expired
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-slate-300">
          {reason}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onSignup}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-teal-400 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Account & Save Progress
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
};
