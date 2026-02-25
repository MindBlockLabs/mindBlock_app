import React from 'react';
import { Check, X } from 'lucide-react';

interface ValidationStatusProps {
  status?: 'pending' | 'correct' | 'wrong';
  errorMessage?: string;
}

const ValidationStatus: React.FC<ValidationStatusProps> = ({ 
  status, 
  errorMessage 
}) => {
  if (status === 'pending') {
    return null; // Don't show anything for pending state
  }

  if (status === 'correct') {
    return (
      <div className="flex items-center text-green-500">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
          <Check size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium">Correct!</span>
      </div>
    );
  }

  if (status === 'wrong') {
    return (
      <div className="flex items-center text-red-500">
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mr-2">
          <X size={16} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-medium">Wrong!</span>
          {errorMessage && (
            <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return null; // Default case - no status
};

export default ValidationStatus;