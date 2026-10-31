'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award as BadgeIcon, Heart, ShoppingBag, Star } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import toast from 'react-hot-toast';

const BEST_SELLERS = [
  {
    id: '1',
    name: 'Grand Royal Celebration Hamper',
    category: 'Luxury',
    price: 14999,
    originalPrice: 17999,
    rating: 4.9,
    reviewCount: 48,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    tag: 'Bestseller',
    slug: 'grand-royal-celebration',
    rank: 1,
  },
  {
    id: '2',
    name: 'Artisanal Chocolate & Wine Opulence',
    category: 'Romantic',
    price: 11950,
    originalPrice: 13500,
    rating: 4.8,
    reviewCount: 32,
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
    tag: 'Trending',
    slug: 'artisanal-chocolate-wine',
    rank: 2,
  },
  {
    id: '4',
    name: 'Sweet Birthday Delight Basket',
    category: 'Birthday',
    price: 7999,
    originalPrice: 8999,
    rating: 4.7,
    reviewCount: 56,
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    tag: 'Popular',
    slug: 'sweet-birthday-basket',
    rank: 3,
  },
  {
    id: '3',
    name: 'Executive Corporate Achievement Crate',
    category: 'Corporate',
    price: 18900,
    originalPrice: 21000,
    rating: 5.0,
    reviewCount: 19,
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238cd48?auto=format&fit=crop&w=800&q=80',
    tag: 'Corporate Fav',
    slug: 'executive-corporate-crate',
    rank: 4,
  },
  {
    id: '5',
    name: 'Zen Wellness & Spa Retreat Hamper',
    category: 'Wellness',
    price: 9500,
    originalPrice: 11000,
    rating: 4.9,
    reviewCount: 27,
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
    tag: 'Relaxation',
    slug: 'zen-wellness-spa',
    rank: 5,
  },
];

export function BestSellers() {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [bestsellers, setBestsellers] = useState(BEST_SELLERS);

  useEffect(() => {
    fetch('/api/products?sort=popular&limit=4')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setBestsellers(
            data.data.slice(0, 4).map((p: any, idx: number) => ({
              id: String(p.id),
              name: p.name,
              category: typeof p.category === 'object' ? p.category?.name || 'Luxury' : p.category || 'Luxury',
              price: p.price,
              originalPrice: p.compare_at_price,
              rating: p.rating,
              reviewCount: p.review_count || p.reviews_count || 12,
              image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
              tag: 'Bestseller',
              slug: p.slug,
              rank: idx + 1,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleAdd = (e: React.MouseEvent, hamper: (typeof BEST_SELLERS)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(hamper.id, undefined, 1, {
      id: hamper.id,
      name: hamper.name,
      slug: hamper.slug,
      price: hamper.price,
      compare_at_price: hamper.originalPrice,
      images: [hamper.image],
      stock: 25,
    });
    toast.success(`${hamper.name} added to cart!`);
  };

  const handleWish = (e: React.MouseEvent, hamper: (typeof BEST_SELLERS)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist(hamper.id, {
      id: hamper.id,
      name: hamper.name,
      slug: hamper.slug,
      price: hamper.price,
      images: [hamper.image],
    });
    toast.success(isInWishlist(hamper.id) ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif flex items-center gap-3">
              <BadgeIcon className="w-6 h-6 text-amber-500" />
              Best Sellers
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Our most loved hampers, chosen by thousands of happy customers</p>
          </div>
          <Link
            href="/shop?sort=popular"
            className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1"
          >
            View All <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="space-y-6">
          {bestsellers.map((hamper) => {
            const inWish = isInWishlist(hamper.id);
            const discountPct =
              hamper.originalPrice && hamper.originalPrice > hamper.price
                ? Math.round(((hamper.originalPrice - hamper.price) / hamper.originalPrice) * 100)
                : null;

            return (
              <Link
                key={hamper.id}
                href={`/products/${hamper.slug}`}
                className={cn(
                  'group flex flex-col md:flex-row glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 transition-all shadow-sm hover:shadow-xl',
                  'hover:border-amber-400/60 dark:hover:border-amber-500/40 bg-white dark:bg-slate-900/90'
                )}
              >
                <div className="relative md:w-72 h-56 md:h-auto flex-shrink-0 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <img
                    src={hamper.image}
                    alt={hamper.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <Badge variant="amber" className="text-[10px] font-black">
                      #{hamper.rank} Top
                    </Badge>
                    {discountPct && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md">
                        -{discountPct}%
                      </span>
                    )}
                    {hamper.tag && (
                      <Badge variant={hamper.tag === 'Trending' ? 'rose' : 'amber'} className="text-[10px]">
                        {hamper.tag}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col p-6 md:flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px]">{hamper.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {hamper.rating} ({hamper.reviewCount})
                      </span>
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition font-serif">
                      {hamper.name}
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">{formatCurrency(hamper.price)}</span>
                      {hamper.originalPrice && (
                        <span className="text-xs sm:text-sm text-slate-400 line-through leading-none">{formatCurrency(hamper.originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => handleWish(e, hamper)}
                        className="text-xs px-3 py-2 h-9 rounded-xl"
                        leftIcon={<Heart className={cn('w-3.5 h-3.5', inWish ? 'fill-rose-500 text-rose-500' : '')} />}
                      >
                        {inWish ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => handleAdd(e, hamper)}
                        className="text-xs font-bold px-4 py-2 h-9 rounded-xl shadow-sm hover:shadow shrink-0 whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-black border-none"
                        leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
