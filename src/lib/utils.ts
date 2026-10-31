import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR', locale: string = 'en-IN'): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  });
  return formatter.format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-IN', options ?? defaultOptions);
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GH-${year}${month}${day}-${random}`;
}

export function generateTrackingNumber(): string {
  return `TRK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function generateCouponCode(prefix: string = 'KAWAI'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '', part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GIFT-${part1}-${part2}`;
}

export function calculateDiscount(
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  maxDiscount?: number
): number {
  if (discountType === 'percentage') {
    const discount = subtotal * (discountValue / 100);
    return maxDiscount ? Math.min(discount, maxDiscount) : discount;
  }
  return Math.min(discountValue, subtotal);
}

export function calculateShipping(
  subtotal: number,
  freeShippingThreshold: number,
  baseShippingCost: number
): { shipping: number; isFree: boolean } {
  const isFree = subtotal >= freeShippingThreshold;
  return { shipping: isFree ? 0 : baseShippingCost, isFree };
}

export function calculateTotals(
  boxPrice: number,
  itemsPrice: number,
  cardPrice: number,
  packagingPrice: number,
  customizationFee: number = 49
): { boxPrice: number; itemsPrice: number; cardPrice: number; packagingPrice: number; customizationFee: number; total: number } {
  const subtotal = boxPrice + itemsPrice + cardPrice + packagingPrice + customizationFee;
  return { boxPrice, itemsPrice, cardPrice, packagingPrice, customizationFee, total: subtotal };
}

export function validateIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function validateIndianPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    preparing: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    packed: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    shipped: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
    out_for_delivery: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
    return_requested: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    refund_processing: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    refunded: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  };
  return colors[status] || colors.pending_payment;
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    failed: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    refunded: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    partially_refunded: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  };
  return colors[status] || colors.pending;
}

export const OCCASION_ICONS: Record<string, string> = {
  birthday: 'cake-candles',
  anniversary: 'heart',
  wedding: 'ring',
  valentine: 'heart',
  baby_shower: 'baby-carriage',
  farewell: 'hand-wave',
  housewarming: 'house',
  corporate: 'briefcase',
  festival: 'sparkles',
  friendship: 'users',
  get_well: 'heart-pulse',
  thank_you: 'hands-clapping',
  congratulations: 'trophy',
  apology: 'heart-crack',
  just_because: 'gift',
};

export const RECIPIENT_ICONS: Record<string, string> = {
  her: 'venus',
  him: 'mars',
  mom: 'female',
  dad: 'male',
  wife: 'heart',
  husband: 'heart',
  girlfriend: 'heart',
  boyfriend: 'heart',
  friend: 'user-group',
  kids: 'child',
  colleagues: 'users',
  boss: 'user-tie',
  teacher: 'graduation-cap',
  parents: 'users',
  siblings: 'users',
  grandparents: 'users',
};

export const CATEGORY_ICONS: Record<string, string> = {
  luxury: 'crown',
  birthday: 'cake-candles',
  romantic: 'heart',
  corporate: 'briefcase',
  wellness: 'spa',
  festive: 'sparkles',
  chocolate: 'cookie-bite',
  self_care: 'sparkles',
  personalized: 'pen-fancy',
  premium: 'star',
};