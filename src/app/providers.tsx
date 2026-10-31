'use client';

import { ReactNode } from 'react';
import { BrandProvider } from '@/context/BrandContext';
import { CartProvider } from '@/hooks/useCart';
import { WishlistProvider } from '@/hooks/useWishlist';
import { CurrencyProvider } from '@/context/CurrencyContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </CurrencyProvider>
    </BrandProvider>
  );
}