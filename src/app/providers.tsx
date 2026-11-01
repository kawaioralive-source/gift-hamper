'use client';

import { ReactNode } from 'react';
import { BrandProvider } from '@/context/BrandContext';
import { CartProvider } from '@/hooks/useCart';
import { WishlistProvider } from '@/hooks/useWishlist';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SiteImagesProvider } from '@/context/SiteImagesContext';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandProvider>
      <SiteImagesProvider>
        <CurrencyProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <CartDrawer />
            </WishlistProvider>
          </CartProvider>
        </CurrencyProvider>
      </SiteImagesProvider>
    </BrandProvider>
  );
}
