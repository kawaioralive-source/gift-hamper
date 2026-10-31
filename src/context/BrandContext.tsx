'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BrandConfig {
  id?: number;
  brand_name: string;
  brand_short_name: string;
  brand_tagline: string;
  logo_url: string;
  logo_mobile_url: string;
  favicon_url: string;
  support_email: string;
  support_phone: string;
  support_address: string;
  primary_color: string;
  accent_color: string;
  announcement_text: string;
  is_active?: boolean;
}

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brand_name: 'Kavayura Hampers',
  brand_short_name: 'Kavayura',
  brand_tagline: 'Artisan Handcrafted Hampers & Nationwide Luxury Gifting',
  logo_url: '/images/kawaiora-logo.png',
  logo_mobile_url: '/images/kawaiora-logo.png',
  favicon_url: '/images/kawaiora-logo.png',
  support_email: 'support@kavayurahampers.com',
  support_phone: '+91 98201 45821',
  support_address: 'Mumbai, Maharashtra, India',
  primary_color: '#d97706',
  accent_color: '#e11d48',
  announcement_text: '✨ Kavayura Hampers | Handcrafted Luxury Gifts & Nationwide Express Delivery',
};

interface BrandContextType {
  brand: BrandConfig;
  loading: boolean;
  refreshBrand: () => Promise<void>;
  updateLocalPreview: (preview: Partial<BrandConfig>) => void;
}

const BrandContext = createContext<BrandContextType>({
  brand: DEFAULT_BRAND_CONFIG,
  loading: false,
  refreshBrand: async () => {},
  updateLocalPreview: () => {},
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND_CONFIG);
  const [loading, setLoading] = useState(false);

  const fetchBrand = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/brand', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBrand((prev) => ({
            ...prev,
            ...json.data,
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic brand config, using default:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrand();

    // Listen for custom brand-change events dispatched when admin publishes
    const handleBrandChange = () => fetchBrand();
    window.addEventListener('brand-identity-updated', handleBrandChange);
    return () => window.removeEventListener('brand-identity-updated', handleBrandChange);
  }, [fetchBrand]);

  const updateLocalPreview = (preview: Partial<BrandConfig>) => {
    setBrand((prev) => ({ ...prev, ...preview }));
  };

  return (
    <BrandContext.Provider
      value={{
        brand,
        loading,
        refreshBrand: fetchBrand,
        updateLocalPreview,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    return {
      brand: DEFAULT_BRAND_CONFIG,
      loading: false,
      refreshBrand: async () => {},
      updateLocalPreview: () => {},
    };
  }
  return context;
}
