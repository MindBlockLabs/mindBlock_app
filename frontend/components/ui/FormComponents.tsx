'use client';

import React, { useState, useId } from 'react';

// --- Input Component with Floating Label ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, value, defaultValue, onChange, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(value || defaultValue || '');

    const hasValue = String(value !== undefined ? value : internalValue).length > 0;
    const isFloating = isFocused || hasValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      if (onChange) onChange(e);
    };

    return (
      <div className="relative w-full">
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            aria-invalid={!!error}
            className={`
              w-full px-4 pt-6 pb-2 text-sm text-slate-100 bg-slate-900/60 rounded-xl border backdrop-blur-md transition-all duration-200 outline-none
              ${error ? 'border-rose-500/80 shadow-rose-500/20' : isFocused ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-white/10 hover:border-white/20'}
              ${className}
            `}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={`
                absolute left-4 pointer-events-none transition-all duration-200 ease-out origin-left
                ${isFloating ? '-translate-y-3.5 scale-75 text-blue-400 font-medium' : 'translate-y-0 scale-100 text-slate-400'}
                ${error ? 'text-rose-400' : ''}
              `}
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

// --- PasswordInput Component ---
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <Input ref={ref} type={showPassword ? 'text' : 'password'} {...props} />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-4 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-white/5 border border-white/10 transition-colors"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? 'Hide' : 'Show'}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

// --- Textarea Component with Floating Label ---
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, value, defaultValue, onChange, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(value || defaultValue || '');

    const hasValue = String(value !== undefined ? value : internalValue).length > 0;
    const isFloating = isFocused || hasValue;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value);
      if (onChange) onChange(e);
    };

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error}
          className={`
            w-full px-4 pt-6 pb-2 text-sm text-slate-100 bg-slate-900/60 rounded-xl border backdrop-blur-md transition-all duration-200 outline-none min-h-[100px]
            ${error ? 'border-rose-500/80' : isFocused ? 'border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.4)]' : 'border-white/10 hover:border-white/20'}
            ${className}
          `}
          {...props}
        />
        {label && (
          <label
            htmlFor={textareaId}
            className={`
              absolute left-4 top-4 pointer-events-none transition-all duration-200 ease-out origin-left
              ${isFloating ? '-translate-y-2 scale-75 text-teal-400 font-medium' : 'scale-100 text-slate-400'}
            `}
          >
            {label}
          </label>
        )}
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

// --- Select Component ---
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="relative w-full">
        {label && <label htmlFor={selectId} className="block mb-1.5 text-xs font-medium text-slate-300">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-4 py-3 text-sm text-slate-100 bg-slate-900/80 rounded-xl border border-white/10 backdrop-blur-md outline-none transition-all duration-200 focus:border-purple-400 focus:shadow-[0_0_15px_rgba(139,92,246,0.4)]
            ${error ? 'border-rose-500' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

// --- Checkbox Component ---
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`
            w-4 h-4 rounded border border-white/20 bg-slate-900/60 text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-slate-900 transition-all cursor-pointer
            ${className}
          `}
          {...props}
        />
        <span className="text-sm text-slate-300 hover:text-white transition-colors">{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

// --- Radio Component ---
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;

    return (
      <label htmlFor={radioId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={`
            w-4 h-4 border border-white/20 bg-slate-900/60 text-purple-500 focus:ring-2 focus:ring-purple-400 focus:ring-offset-slate-900 transition-all cursor-pointer
            ${className}
          `}
          {...props}
        />
        <span className="text-sm text-slate-300 hover:text-white transition-colors">{label}</span>
      </label>
    );
  },
);
Radio.displayName = 'Radio';
