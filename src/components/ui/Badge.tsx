'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'amber' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  dotColor?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
      secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
      outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600',
      amber: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-none shadow-sm',
      rose: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-none shadow-sm',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-bold rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export const StatusBadge = ({ status, ...props }: BadgeProps & { status: string }) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; dot?: boolean }> = {
    pending_payment: { variant: 'warning', label: 'Pending Payment', dot: true },
    paid: { variant: 'success', label: 'Paid', dot: true },
    confirmed: { variant: 'primary', label: 'Confirmed', dot: true },
    preparing: { variant: 'amber', label: 'Preparing', dot: true },
    packed: { variant: 'primary', label: 'Packed', dot: true },
    shipped: { variant: 'primary', label: 'Shipped', dot: true },
    out_for_delivery: { variant: 'primary', label: 'Out for Delivery', dot: true },
    delivered: { variant: 'success', label: 'Delivered', dot: true },
    cancelled: { variant: 'default', label: 'Cancelled' },
    return_requested: { variant: 'danger', label: 'Return Requested', dot: true },
    refund_processing: { variant: 'warning', label: 'Refund Processing', dot: true },
    refunded: { variant: 'secondary', label: 'Refunded' },
    draft: { variant: 'default', label: 'Draft' },
    active: { variant: 'success', label: 'Active', dot: true },
    out_of_stock: { variant: 'danger', label: 'Out of Stock' },
    archived: { variant: 'default', label: 'Archived' },
    created: { variant: 'default', label: 'Created' },
    attempted: { variant: 'warning', label: 'Attempted' },
    failed: { variant: 'danger', label: 'Failed' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return <Badge variant={config.variant} dot={config.dot} {...props}>{config.label}</Badge>;
};