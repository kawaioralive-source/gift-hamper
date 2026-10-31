'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  rateAgainstINR: number; // For display approximation; base INR remains authoritative
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN', rateAgainstINR: 1.0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US', rateAgainstINR: 0.012 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE', rateAgainstINR: 0.011 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB', rateAgainstINR: 0.0095 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE', rateAgainstINR: 0.044 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA', rateAgainstINR: 0.016 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU', rateAgainstINR: 0.018 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG', rateAgainstINR: 0.016 },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', locale: 'ar-SA', rateAgainstINR: 0.045 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP', rateAgainstINR: 1.85 },
];

const STORAGE_KEY = 'kawaiora_preferred_currency';

interface CurrencyContextType {
  currentCurrency: CurrencyConfig;
  setCurrency: (code: string) => void;
  formatPrice: (amountInINR: number) => string;
  currencies: CurrencyConfig[];
  isBaseCurrency: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(SUPPORTED_CURRENCIES[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found = SUPPORTED_CURRENCIES.find((c) => c.code === stored);
        if (found) {
          setCurrencyState(found);
        }
      }
    } catch {
      // ignore localStorage errors in restricted environments
    }
  }, []);

  const setCurrency = useCallback((code: string) => {
    const target = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
    setCurrencyState(target);
    try {
      localStorage.setItem(STORAGE_KEY, target.code);
      document.cookie = `preferred_currency=${target.code}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent('currency-change', { detail: target }));
    } catch {
      // ignore storage errors
    }
  }, []);

  const formatPrice = useCallback(
    (amountInINR: number): string => {
      const safeAmount = isNaN(amountInINR) ? 0 : amountInINR;
      const converted = currency.code === 'INR' ? safeAmount : safeAmount * currency.rateAgainstINR;

      try {
        const formatter = new Intl.NumberFormat(currency.locale, {
          style: 'currency',
          currency: currency.code,
          minimumFractionDigits: currency.code === 'INR' || currency.code === 'JPY' ? 0 : 2,
          maximumFractionDigits: currency.code === 'INR' || currency.code === 'JPY' ? 0 : 2,
        });
        return formatter.format(converted);
      } catch {
        // Fallback if locale or currency code is unsupported by browser
        const symbol = currency.symbol;
        const formattedNumber = converted.toFixed(currency.code === 'INR' || currency.code === 'JPY' ? 0 : 2);
        return `${symbol}${formattedNumber}`;
      }
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency: currency,
        setCurrency,
        formatPrice,
        currencies: SUPPORTED_CURRENCIES,
        isBaseCurrency: currency.code === 'INR',
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider
    return {
      currentCurrency: SUPPORTED_CURRENCIES[0],
      setCurrency: () => {},
      formatPrice: (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
        }).format(amount || 0);
      },
      currencies: SUPPORTED_CURRENCIES,
      isBaseCurrency: true,
    };
  }
  return context;
}
