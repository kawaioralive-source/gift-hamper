'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface CartItem {
  id: string;
  product_id: string | null;
  custom_hamper_id: string | null;
  quantity: number;
  price_at_add: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    images: string[];
    stock: number;
  };
  custom_hamper?: {
    id: string;
    name: string;
    total_price: number;
  };
}

interface CartData {
  items: CartItem[];
  total: number;
  count: number;
}

interface CartContextType {
  cart: CartData;
  loading: boolean;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (productId?: string, customHamperId?: string, quantity?: number, productDetails?: any) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
  getCartItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'kawaiora_cart';

function getLocalCart(): CartData {
  if (typeof window === 'undefined') return { items: [], total: 0, count: 0 };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }
  return { items: [], total: 0, count: 0 };
}

function setLocalCart(cart: CartData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartData>({ items: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const openCartDrawer = useCallback(() => setIsCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsCartDrawerOpen(false), []);

  const calculateTotals = useCallback((items: CartItem[]) => {
    const total = items.reduce((sum, item) => {
      const price = item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0;
      return sum + Number(price) * item.quantity;
    }, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    return { total, count };
  }, []);

  const refreshCart = useCallback(async () => {
    if (!mounted) return;

    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data?.items) && (
          data.data.items.length > 0 || data.data.source === 'account' || data.data.source === 'session'
        )) {
          const { total, count } = calculateTotals(data.data.items);
          setCart({ items: data.data.items, total, count });
          setLocalCart({ items: data.data.items, total, count });
          return;
        }
      }
    } catch (error) {
      // Fall back to localStorage
    } finally {
      setLoading(false);
    }

    const localCart = getLocalCart();
    if (localCart.items.length > 0) {
      setCart(localCart);
    }
  }, [mounted, calculateTotals]);

  // Initialize cart on mount
  useEffect(() => {
    setMounted(true);
    const localCart = getLocalCart();
    setCart(localCart);
    refreshCart();
  }, [refreshCart]);

  // Sync localStorage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newCart = JSON.parse(e.newValue);
          setCart(newCart);
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCart = useCallback(
    async (productId?: string, customHamperId?: string, quantity = 1, productDetails?: any) => {
      if (!productId && !customHamperId) return;

      const price = productDetails?.price !== undefined && !isNaN(Number(productDetails.price)) ? Number(productDetails.price) : 0;
      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        product_id: productId || null,
        custom_hamper_id: customHamperId || null,
        quantity,
        price_at_add: price,
        product: productDetails || undefined,
        custom_hamper: customHamperId
          ? { id: customHamperId, name: productDetails?.name || 'Custom Hamper', total_price: price }
          : undefined,
      };

      // Optimistic update
      const currentItems = [...cart.items];
      const existingIndex = currentItems.findIndex(
        (item) =>
          (productId && item.product_id === productId) ||
          (customHamperId && item.custom_hamper_id === customHamperId)
      );

      let updatedItems: CartItem[];
      if (existingIndex >= 0) {
        updatedItems = currentItems.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
                product: productDetails || item.product,
              }
            : item
        );
      } else {
        updatedItems = [...currentItems, newItem];
      }

      const { total, count } = calculateTotals(updatedItems);
      const newCart = { items: updatedItems, total, count };
      setCart(newCart);
      setLocalCart(newCart);
      setIsCartDrawerOpen(true);

      // Sync with server in background
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            custom_hamper_id: customHamperId,
            quantity,
            price,
            productDetails,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.items?.length) {
            // Ensure product metadata is preserved
            const mergedItems = data.data.items.map((srvItem: CartItem) => {
              if (!srvItem.product && (srvItem.product_id === productId || srvItem.product_id === productDetails?.id)) {
                return { ...srvItem, product: productDetails };
              }
              return srvItem;
            });
            const serverTotals = calculateTotals(mergedItems);
            setCart({ items: mergedItems, ...serverTotals });
            setLocalCart({ items: mergedItems, ...serverTotals });
          }
        }
      } catch (error) {
        console.error('Failed to sync cart with server:', error);
      }
    },
    [cart, calculateTotals]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const currentItems = [...cart.items];
      let updatedItems: CartItem[];

      if (quantity <= 0) {
        updatedItems = currentItems.filter((item) => item.id !== itemId);
      } else {
        updatedItems = currentItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
      }

      const { total, count } = calculateTotals(updatedItems);
      const newCart = { items: updatedItems, total, count };
      setCart(newCart);
      setLocalCart(newCart);
      setIsCartDrawerOpen(true);

      try {
        await fetch('/api/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: itemId, quantity }),
        });
      } catch (error) {
        console.error('Failed to update cart:', error);
      }
    },
    [cart, calculateTotals]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      const currentItems = [...cart.items];
      const updatedItems = currentItems.filter((item) => item.id !== itemId);
      const { total, count } = calculateTotals(updatedItems);
      const newCart = { items: updatedItems, total, count };
      setCart(newCart);
      setLocalCart(newCart);
      setIsCartDrawerOpen(true);

      try {
        await fetch(`/api/cart?item_id=${itemId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to remove from cart:', error);
      }
    },
    [cart, calculateTotals]
  );

  const clearCart = useCallback(async () => {
    setCart({ items: [], total: 0, count: 0 });
    setLocalCart({ items: [], total: 0, count: 0 });
    try {
      await fetch('/api/cart', { method: 'DELETE' });
    } catch {}
  }, []);

  const isInCart = useCallback(
    (productId: string) => {
      return cart.items.some((item) => item.product_id === productId);
    },
    [cart.items]
  );

  const getCartItemQuantity = useCallback(
    (productId: string) => {
      const item = cart.items.find((item) => item.product_id === productId);
      return item?.quantity || 0;
    },
    [cart.items]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        isInCart,
        getCartItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
