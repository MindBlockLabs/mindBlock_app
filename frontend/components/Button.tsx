'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  disabled,
  className,
  type = 'button',
  ...props
}) => {
  const containerBaseClasses = 'rounded-2xl';
  const wrapperBaseClasses =
    'flex flex-row items-center justify-center py-3 px-6 rounded-2xl -translate-y-1 transition-transform';
  const textBaseClasses = 'font-bold text-lg text-center';

  const variantStyles = {
    primary: {
      container: 'bg-blue-800',
      wrapper: 'bg-[#3B82F6]',
      text: 'text-white',
    },
    secondary: {
      container: 'bg-blue-800',
      wrapper: 'bg-transparent border-2 border-blue-600',
      text: 'text-[#3B82F6]',
    },
  };

  const pressEffect = !disabled ? 'active:translate-y-0' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const hoverEffect = !disabled ? 'hover:-translate-y-[6px]' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${containerBaseClasses} ${variantStyles[variant].container} ${disabledClasses} ${className} ${hoverEffect} transition-transform duration-200 ease-in-out`}
      {...props}
    >
      <div
        className={`${wrapperBaseClasses} ${variantStyles[variant].wrapper} ${pressEffect}`}
      >
        <span
          className={`${textBaseClasses} ${variantStyles[variant].text} flex items-center`}
        >
          {children}
        </span>
      </div>
    </button>
  );
};

export default Button;
