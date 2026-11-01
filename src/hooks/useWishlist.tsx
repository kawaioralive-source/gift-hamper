'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface WishlistItem {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    images: string[];
    stock: number;
    is_active: boolean;
    status: string;
  };
}

interface WishlistData {
  items: WishlistItem[];
  count: number;
}

interface WishlistContextType {
  wishlist: WishlistData;
  loading: boolean;
  addToWishlist: (productId: string, productDetails?: any) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'kawaiora_wishlist';

function getLocalWishlist(): WishlistData {
  if (typeof window === 'undefined') return { items: [], count: 0 };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }
  return { items: [], count: 0 };
}

function setLocalWishlist(wishlist: WishlistData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistData>({ items: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!mounted) return;

    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data?.items) && (data.data.items.length > 0 || data.data.source === 'account')) {
          const activeItems = (data.data.items || []).filter(
            (item: WishlistItem) => item.product?.is_active !== false
          );
          const newWishlist = { items: activeItems, count: activeItems.length };
          setWishlist(newWishlist);
          setLocalWishlist(newWishlist);
          return;
        }
      }
    } catch (error) {
      // Fall back to localStorage
    } finally {
      setLoading(false);
    }

    const localWishlist = getLocalWishlist();
    setWishlist(localWishlist);
  }, [mounted]);

  // Initialize wishlist on mount
  useEffect(() => {
    setMounted(true);
    const localWishlist = getLocalWishlist();
    setWishlist(localWishlist);
    refreshWishlist();
  }, [refreshWishlist]);

  // Sync localStorage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newWishlist = JSON.parse(e.newValue);
          setWishlist(newWishlist);
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToWishlist = useCallback(
    async (productId: string, productDetails?: any) => {
      if (!productId) return;

      const currentItems = [...wishlist.items];
      const existingIndex = currentItems.findIndex((item) => item.product_id === productId);

      let updatedItems: WishlistItem[];
      if (existingIndex >= 0) {
        // Toggle removal if already in wishlist
        updatedItems = currentItems.filter((item) => item.product_id !== productId);
      } else {
        const newItem: WishlistItem = {
          id: `wish-${Date.now()}`,
          product_id: productId,
          product: productDetails,
        };
        updatedItems = [...currentItems, newItem];
      }

      const newWishlist = { items: updatedItems, count: updatedItems.length };
      setWishlist(newWishlist);
      setLocalWishlist(newWishlist);

      // Sync with server
      try {
        if (existingIndex >= 0) {
          await fetch(`/api/wishlist?product_id=${productId}`, { method: 'DELETE' });
        } else {
          await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
          });
        }
      } catch (error) {
        console.error('Failed to sync wishlist with server:', error);
      }
    },
    [wishlist]
  );

  const removeFromWishlist = useCallback(
    async (itemId: string) => {
      const currentItems = [...wishlist.items];
      const updatedItems = currentItems.filter((item) => item.id !== itemId && item.product_id !== itemId);
      const newWishlist = { items: updatedItems, count: updatedItems.length };
      setWishlist(newWishlist);
      setLocalWishlist(newWishlist);

      try {
        await fetch(`/api/wishlist?item_id=${itemId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to remove from wishlist:', error);
      }
    },
    [wishlist]
  );

  const clearWishlist = useCallback(async () => {
    setWishlist({ items: [], count: 0 });
    setLocalWishlist({ items: [], count: 0 });
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.items.some((item) => item.product_id === productId);
    },
    [wishlist.items]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
