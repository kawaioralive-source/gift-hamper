'use client';

import React, { useState, useEffect } from 'react';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/context/CurrencyContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Globe, DollarSign, Bell, Shield, CheckCircle2, User, Sparkles, MapPin, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export function UserSettingsClient() {
  const { currentCurrency, setCurrency, formatPrice } = useCurrency();
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(currentCurrency.code);
  const [user, setUser] = useState<{ name: string; email: string; phone?: string; role?: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferredSlot, setPreferredSlot] = useState('morning');
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  useEffect(() => {
    setSelectedCurrencyCode(currentCurrency.code);
  }, [currentCurrency]);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.warn('Failed to load user info:', err);
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();

    // Load saved preferences
    try {
      const savedSlot = localStorage.getItem('kawaiora_preferred_slot');
      if (savedSlot) setPreferredSlot(savedSlot);
      const savedNotifs = localStorage.getItem('kawaiora_notifications');
      if (savedNotifs !== null) setOrderNotifications(savedNotifs === 'true');
    } catch {}
  }, []);

  const handleSaveCurrency = () => {
    setSavingCurrency(true);
    setCurrency(selectedCurrencyCode);
    const chosen = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode);
    setTimeout(() => {
      setSavingCurrency(false);
      toast.success(`Display currency updated to ${chosen?.flag} ${chosen?.code} (${chosen?.symbol})!`);
    }, 300);
  };

  const handleSavePreferences = () => {
    setSavingPreferences(true);
    try {
      localStorage.setItem('kawaiora_preferred_slot', preferredSlot);
      localStorage.setItem('kawaiora_notifications', String(orderNotifications));
      localStorage.setItem('kawaiora_promo_alerts', String(promoAlerts));
    } catch {}
    setTimeout(() => {
      setSavingPreferences(false);
      toast.success('Your preferences have been successfully saved!');
    }, 400);
  };

  const samplePriceINR = 2499;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4 sm:py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Settings & Regional Preferences
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Customize your currency, display preferences, delivery options, and notification settings
            </p>
          </div>
        </div>
      </div>

      {/* 1. Regional & Currency Selection (Primary Requirement) */}
      <Card variant="elevated" padding="lg" className="border-amber-200/60 dark:border-amber-900/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Currency & Regional Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose your preferred currency for browsing products and viewing order estimates
              </p>
            </div>
          </div>
          <Badge variant="amber" className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1">
            Current: {currentCurrency.flag} {currentCurrency.code} ({currentCurrency.symbol})
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Currency Dropdown Selector */}
          <div className="space-y-2">
            <label htmlFor="currency-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Display Currency
            </label>
            <select
              id="currency-select"
              value={selectedCurrencyCode}
              onChange={(e) => setSelectedCurrencyCode(e.target.value)}
              className="w-full h-11 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.flag} {cur.code} - {cur.name} ({cur.symbol})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Persisted across your session, profile, and subsequent visits.
            </p>
          </div>

          {/* Real-time Formatted Price Preview */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Preview
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {(() => {
                  const target = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode) || currentCurrency;
                  const amt = target.code === 'INR' ? samplePriceINR : samplePriceINR * target.rateAgainstINR;
                  try {
                    return new Intl.NumberFormat(target.locale, {
                      style: 'currency',
                      currency: target.code,
                      minimumFractionDigits: target.code === 'INR' || target.code === 'JPY' ? 0 : 2,
                    }).format(amt);
                  } catch {
                    return `${target.symbol}${amt.toFixed(2)}`;
                  }
                })()}
              </span>
              <span className="text-xs text-slate-400 line-through">
                {(() => {
                  const target = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode) || currentCurrency;
                  const amt = (target.code === 'INR' ? samplePriceINR : samplePriceINR * target.rateAgainstINR) * 1.25;
                  try {
                    return new Intl.NumberFormat(target.locale, {
                      style: 'currency',
                      currency: target.code,
                      minimumFractionDigits: target.code === 'INR' || target.code === 'JPY' ? 0 : 2,
                    }).format(amt);
                  } catch {
                    return `${target.symbol}${amt.toFixed(2)}`;
                  }
                })()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Sample artisan gift hamper pricing shown in {selectedCurrencyCode}.
            </p>
          </div>
        </div>

        {/* Currency Transparency Note */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            Authoritative Payment Notice
          </p>
          <p className="text-[11px] text-blue-800/90 dark:text-blue-300">
            For maximum financial transparency and compliance with Indian banking standards, display prices are converted for browsing convenience. All payment gateway checkouts (via Razorpay Live UPI and Cards) are charged authoritatively in base INR (₹).
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSaveCurrency}
            disabled={savingCurrency}
            className="w-full sm:w-auto min-h-[44px]"
            leftIcon={savingCurrency ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          >
            {savingCurrency ? 'Applying Currency...' : 'Save Currency Preference'}
          </Button>
        </div>
      </Card>

      {/* 2. User Account Overview */}
      <Card variant="elevated" padding="lg" className="space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Information</h2>
            <p className="text-xs text-slate-500">Details tied to your KawaiOra profile</p>
          </div>
        </div>

        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Full Name</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{user.name}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Email Address</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{user.email}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Account Type</span>
              <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 capitalize">{user.role || 'Customer'}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">You are currently browsing as a guest.</p>
            <Link href="/login">
              <Button size="sm" variant="secondary">Sign In to sync across all devices</Button>
            </Link>
          </div>
        )}
      </Card>

      {/* 3. Delivery & Notification Preferences */}
      <Card variant="elevated" padding="lg" className="space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delivery & Communication Preferences</h2>
            <p className="text-xs text-slate-500">Control default slot preferences and order updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Preferred Delivery Time Slot
            </label>
            <select
              value={preferredSlot}
              onChange={(e) => setPreferredSlot(e.target.value)}
              className="w-full sm:w-80 h-11 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="morning">Morning (9:00 AM – 12:00 PM)</option>
              <option value="afternoon">Afternoon (12:00 PM – 4:00 PM)</option>
              <option value="evening">Evening (4:00 PM – 8:00 PM)</option>
            </select>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={orderNotifications}
                onChange={(e) => setOrderNotifications(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Order Updates & Dispatch Tracking</span>
                <p className="text-xs text-slate-500">Receive instant status updates via email / SMS</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={promoAlerts}
                onChange={(e) => setPromoAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Seasonal Artisan Hampers & Exclusive Promotions</span>
                <p className="text-xs text-slate-500">Get notified about Diwali, Christmas, Valentine, and Wedding curation releases</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSavePreferences}
            disabled={savingPreferences}
            className="w-full sm:w-auto min-h-[44px]"
            leftIcon={savingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          >
            {savingPreferences ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
