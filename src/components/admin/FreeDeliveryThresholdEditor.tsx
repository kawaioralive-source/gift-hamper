'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DEFAULT_SITE_IMAGES } from '@/types/site-images';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export function FreeDeliveryThresholdEditor() {
  const [threshold, setThreshold] = useState(String(DEFAULT_SITE_IMAGES.store_settings.free_shipping_threshold));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/site-images', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        const value = Number(result.data?.store_settings?.free_shipping_threshold);
        if (!cancelled && result.success && Number.isFinite(value) && value > 0) setThreshold(String(value));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const amount = Number(threshold);
  const validAmount = Number.isFinite(amount) && amount > 0;

  const handleSave = async () => {
    if (!validAmount) {
      toast.error('Enter a delivery threshold greater than zero.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/site-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteImages: { store_settings: { free_shipping_threshold: amount } } }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save delivery settings');
      window.dispatchEvent(new Event('site-images-updated'));
      toast.success('Free delivery threshold saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save delivery settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Free delivery threshold</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Customers see how much more they need to spend in the cart and drawer.</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[250px] sm:flex-row">
          <label className="sr-only" htmlFor="free-delivery-threshold">Free delivery threshold in INR</label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
            <input
              id="free-delivery-threshold"
              type="number"
              min="1"
              step="1"
              value={threshold}
              disabled={loading || saving}
              onChange={(event) => setThreshold(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <Button onClick={handleSave} disabled={loading || saving || !validAmount} leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}>
            {saving ? 'Saving' : 'Save amount'}
          </Button>
        </div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Example: a {formatCurrency(validAmount ? amount : DEFAULT_SITE_IMAGES.store_settings.free_shipping_threshold)} order unlocks free delivery.
      </p>
    </Card>
  );
}
