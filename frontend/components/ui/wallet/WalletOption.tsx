'use client';

import React from 'react';

export interface WalletOptionProps {
  name: string;
  icon: React.ReactNode;
  isDetected: boolean;
  onClick: () => void;
}

const WalletOption: React.FC<WalletOptionProps> = ({ name, icon, isDetected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 group"
      aria-label={`Connect with ${name}${isDetected ? ', detected' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex-shrink-0">{icon}</div>
        <span className="text-[#E6E6E6] font-medium text-sm">{name}</span>
      </div>
      {isDetected && (
        <span className="text-xs text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          Detected
        </span>
      )}
    </button>
  );
};

export default WalletOption;
