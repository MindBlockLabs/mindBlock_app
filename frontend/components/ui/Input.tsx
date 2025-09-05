'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps {
  type: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  className?: string;
}

const Input = ({
  type,
  placeholder,
  value,
  onChange,
  label,
  className = ''
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#E6E6E6CC] mb-2">
          {label}
        </label>
      )}
      <div className="relative w-full md:w-[408px]">
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full h-[50px] px-[16px] py-[14px]
            bg-[#07101D] 
            border-[2px] rounded-[8px]
            text-[#E6E6E6CC] text-base
            placeholder:text-[#E6E6E666]
            transition-all duration-200 ease-in-out
            focus:outline-none
            ${isFocused 
              ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/20' 
              : 'border-[#E6E6E6CC]'
            }
            ${type === 'password' ? 'pr-12' : ''}
          `}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-[#E6E6E666] hover:text-[#3B82F6]
              transition-colors duration-200
              focus:outline-none focus:text-[#3B82F6]
            "
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
