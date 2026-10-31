'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, WandSparkles, Heart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { Badge } from '@/components/ui/Badge';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cart, openCartDrawer } = useCart();
  const { wishlist } = useWishlist();

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  const cartCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) ?? cart?.count ?? 0;
  const wishlistCount = wishlist?.items?.length ?? wishlist?.count ?? 0;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-200"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* 1. Home */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold transition',
            pathname === '/'
              ? 'text-orange-500 font-bold'
              : 'text-slate-400 hover:text-orange-400'
          )}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        {/* 2. Shop */}
        <Link
          href="/shop"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold transition',
            pathname === '/shop'
              ? 'text-orange-500 font-bold'
              : 'text-slate-400 hover:text-orange-400'
          )}
        >
          <Gift className="w-5 h-5" />
          <span>Shop</span>
        </Link>

        {/* 3. Custom Builder (Highlighted Center Pill) */}
        <Link
          href="/customize/new"
          className="flex flex-col items-center justify-center relative -top-2"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-slate-950 transition-transform active:scale-95">
            <WandSparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] font-extrabold text-orange-400 mt-0.5">
            🎃 Curate
          </span>
        </Link>

        {/* 4. Wishlist */}
        <Link
          href="/wishlist"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold transition relative',
            pathname === '/wishlist'
              ? 'text-rose-600 dark:text-rose-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'
          )}
        >
          <div className="relative">
            <Heart className={cn('w-5 h-5', wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : '')} />
            {wishlistCount > 0 && (
              <Badge
                variant="rose"
                className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 text-[9px] font-black leading-none flex items-center justify-center"
              >
                {wishlistCount}
              </Badge>
            )}
          </div>
          <span>Wishlist</span>
        </Link>

        {/* 5. Cart (Triggers Slide-Out Cart Drawer) */}
        <button
          type="button"
          onClick={openCartDrawer}
          className="flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <Badge
                variant="amber"
                className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 text-[9px] font-black leading-none flex items-center justify-center"
              >
                {cartCount}
              </Badge>
            )}
          </div>
          <span>Bag</span>
        </button>
      </div>
    </nav>
  );
}
