'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked, onCheckedChange, disabled, label, className, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked || false);
    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleClick = () => {
      if (disabled) return;
      const newChecked = !isChecked;
      setInternalChecked(newChecked);
      onCheckedChange?.(newChecked);
    };

    return (
      <label className={cn('inline-flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
        <button
          ref={ref}
          role="switch"
          aria-checked={isChecked}
          aria-disabled={disabled}
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950',
            isChecked ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
              'transition-transform duration-200 ease-in-out',
              isChecked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

import { useState } from 'react';