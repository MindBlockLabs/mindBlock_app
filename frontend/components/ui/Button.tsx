'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' | 'loading';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-500 via-purple-500 to-teal-400 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] border border-white/20',
  secondary:
    'bg-slate-800/80 hover:bg-slate-700/80 text-blue-400 hover:text-white border border-blue-500/30 hover:border-blue-400/60 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border border-transparent hover:border-white/10 active:scale-[0.98]',
  danger:
    'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98]',
  icon:
    'p-2.5 bg-slate-800/60 hover:bg-slate-700/70 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 backdrop-blur-md active:scale-[0.95]',
  loading:
    'bg-blue-600/70 text-white cursor-wait border border-blue-400/30',
};

export const Button: React.FC<BaseButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  const isButtonDisabled = disabled || isLoading;
  const currentVariant = isLoading ? 'loading' : variant;

  return (
    <button
      type={type}
      disabled={isButtonDisabled}
      aria-disabled={isButtonDisabled}
      aria-busy={isLoading}
      className={`
        relative inline-flex items-center justify-center font-semibold transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        ${sizeClasses[size]}
        ${variantClasses[currentVariant]}
        ${isButtonDisabled ? 'opacity-50 pointer-events-none cursor-not-allowed scale-100 shadow-none' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

// --- Specialized Variant Component Exports ---

export const PrimaryButton: React.FC<BaseButtonProps> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<BaseButtonProps> = (props) => (
  <Button variant="secondary" {...props} />
);

export const GhostButton: React.FC<BaseButtonProps> = (props) => (
  <Button variant="ghost" {...props} />
);

export const DangerButton: React.FC<BaseButtonProps> = (props) => (
  <Button variant="danger" {...props} />
);

export const IconButton: React.FC<BaseButtonProps> = (props) => (
  <Button variant="icon" {...props} />
);

export const LoadingButton: React.FC<BaseButtonProps> = (props) => (
  <Button isLoading={true} {...props} />
);

export default Button;
