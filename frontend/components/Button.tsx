'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary'| 'tertiary'| 'logOut';
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
    'flex flex-row items-center justify-center cursor-pointer py-3 px-6 rounded-md -translate-y-1 transition-transform';
  const textBaseClasses = ' text-center';

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
    tertiary: {
      container: 'bg-none w-10 h-5',
      wrapper: 'border-2 border-[#E6E6E64D] sm:py-2 sm:px-10',
      text: 'text-[#3B82F6]', 
    },
    logOut: {
      container: 'bg-none w-10 h-5',
      wrapper: 'border-2 border-[#F43F5E4D] sm:py-2 sm:px-10',
      text: 'text-[#F43F5E] text-xs', 
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
