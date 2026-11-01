'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export function WishlistPageClient() {
  const { wishlist, loading, refreshWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    void refreshWishlist();
  }, [refreshWishlist]);

  const items = wishlist.items.filter((item) => item.product && item.product.is_active !== false);

  return (
    <main className="min-h-[65vh] bg-[#faf7f8] dark:bg-slate-950 py-10 sm:py-14">
      <div className="container-custom px-4">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              <Heart className="h-4 w-4 fill-current" /> Saved for later
            </p>
            <h1 className="font-serif text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">My Wishlist</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Only hampers you have liked appear here.</p>
          </div>
          <Link href="/shop">
            <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>Continue shopping</Button>
          </Link>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-rose-100 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Heart className="mx-auto h-10 w-10 text-rose-300" />
            <h2 className="mt-4 font-serif text-xl font-bold text-slate-900 dark:text-white">Your wishlist is empty</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tap the heart on a hamper to save it here.</p>
            <Link href="/shop" className="mt-6 inline-flex">
              <Button>Explore hampers</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const product = item.product!;
              const image = product.images?.[0] || '/images/kawaiora-logo.png';
              return (
                <article key={item.id} className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Link href={`/products/${product.slug}`} className="block aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                  </Link>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/products/${product.slug}`} className="line-clamp-2 font-serif text-lg font-bold text-slate-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
                          {product.name}
                        </Link>
                        <p className="mt-2 font-mono text-lg font-black text-slate-900 dark:text-white">{formatCurrency(product.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeFromWishlist(item.id)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                      className="mt-5 w-full"
                      leftIcon={<ShoppingBag className="h-4 w-4" />}
                      onClick={() => {
                        void addToCart(item.product_id, undefined, 1, product);
                        toast.success(`${product.name} added to cart`);
                      }}
                    >
                      Add to cart
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
