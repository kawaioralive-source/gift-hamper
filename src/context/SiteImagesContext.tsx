'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  DEFAULT_SITE_IMAGES,
  mergeSiteImagesConfig,
  SiteImagesConfig,
} from '@/types/site-images';

interface SiteImagesContextValue {
  config: SiteImagesConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteImagesContext = createContext<SiteImagesContextValue | undefined>(undefined);

export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteImagesConfig>(() =>
    mergeSiteImagesConfig(DEFAULT_SITE_IMAGES, DEFAULT_SITE_IMAGES)
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/site-images', { cache: 'no-store' });
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        setConfig(mergeSiteImagesConfig(DEFAULT_SITE_IMAGES, result.data));
      }
    } catch {
      // Keep the built-in settings available when the settings API is offline.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleUpdate = () => void refresh();
    window.addEventListener('site-images-updated', handleUpdate);
    window.addEventListener('brand-identity-updated', handleUpdate);
    return () => {
      window.removeEventListener('site-images-updated', handleUpdate);
      window.removeEventListener('brand-identity-updated', handleUpdate);
    };
  }, [refresh]);

  return (
    <SiteImagesContext.Provider value={{ config, loading, refresh }}>
      {children}
    </SiteImagesContext.Provider>
  );
}

export function useSiteImages() {
  const context = useContext(SiteImagesContext);
  if (!context) throw new Error('useSiteImages must be used within a SiteImagesProvider');
  return context;
}
