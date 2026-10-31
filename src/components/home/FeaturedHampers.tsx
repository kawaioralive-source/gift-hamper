'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import toast from 'react-hot-toast';

const FEATURED_HAMPERS = [
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
    description: 'The pinnacle of elegance featuring imported French sparkling wine, artisanal Swiss chocolates, truffle crackers, and handcrafted candles.',
    slug: 'grand-royal-celebration',
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
    description: 'Express your feelings with aged Pinot Noir, handcrafted belgian truffles, dark chocolate almond bark, and a plush romantic card.',
    slug: 'artisanal-chocolate-wine',
  },
  {
    id: '3',
    name: 'Executive Corporate Achievement Crate',
    category: 'Corporate',
    price: 18900,
    originalPrice: 21000,
    rating: 5.0,
    reviewCount: 19,
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
    tag: 'Corporate Fav',
    description: 'Make a lasting professional impression with premium single malt whiskey, roasted macadamia nuts, leather journal, and luxury pen set.',
    slug: 'executive-corporate-crate',
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
    description: 'Bring joy on their special day with colorful birthday macarons, gourmet caramel popcorn, birthday confetti, and a soft teddy bear.',
    slug: 'sweet-birthday-basket',
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
    description: 'Recharge mind and soul with organic herbal chamomile tea, silk eye mask, eucalyptus bath salts, and essential oil diffuser.',
    slug: 'zen-wellness-spa',
  },
  {
    id: '6',
    name: 'Festival Sunshine & Treats Basket',
    category: 'Festive',
    price: 8550,
    originalPrice: 9900,
    rating: 4.8,
    reviewCount: 41,
    image: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=800&q=80',
    tag: 'Festive Special',
    description: 'Spread holiday cheer with organic honey, butter cookies, roasted pistachios, dried fruits, and festive golden ornaments.',
    slug: 'festival-sunshine-treats',
  },
];

export function FeaturedHampers() {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [hampers, setHampers] = useState(FEATURED_HAMPERS);

  useEffect(() => {
    fetch('/api/products?limit=8')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setHampers(
            data.data.map((p: any) => ({
              id: String(p.id),
              name: p.name,
              category: typeof p.category === 'object' ? p.category?.name || 'Luxury' : p.category || 'Luxury',
              price: p.price,
              originalPrice: p.compare_at_price,
              rating: p.rating,
              reviewCount: p.review_count || p.reviews_count || 12,
              image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
              tag: p.is_bestseller ? 'Bestseller' : 'Curated',
              description: p.short_description || p.description,
              slug: p.slug,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleAdd = (e: React.MouseEvent, hamper: (typeof FEATURED_HAMPERS)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(hamper.slug || hamper.id, undefined, 1, {
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

  const handleWish = (e: React.MouseEvent, hamper: (typeof FEATURED_HAMPERS)[0]) => {
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
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">Popular Gift Hampers</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">Hand-picked bestsellers ready for instant dispatch</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {hampers.map((hamper) => {
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
                  'glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 flex flex-col group relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
                  'hover:border-amber-400/60 dark:hover:border-amber-500/40 bg-white dark:bg-slate-900/90'
                )}
              >
                <div className="relative overflow-hidden aspect-square sm:aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900">
                  <img
                    src={hamper.image}
                    alt={hamper.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {discountPct && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-sm">
                        -{discountPct}% OFF
                      </span>
                    )}
                    {hamper.tag && (
                      <Badge variant="amber" className="shadow-md text-[10px]">
                        {hamper.tag}
                      </Badge>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleWish(e, hamper)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center justify-center transition hover:scale-110 shadow-md z-10"
                    aria-label="Wishlist"
                  >
                    <Heart className={cn('w-4 h-4 transition', inWish ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500')} />
                  </button>
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px]">{hamper.category}</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {hamper.rating} ({hamper.reviewCount})
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition leading-snug line-clamp-1 font-serif">
                      {hamper.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{hamper.description}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3.5 mt-auto border-t border-slate-100 dark:border-slate-800">
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none">
                        {formatCurrency(hamper.price)}
                      </div>
                      {hamper.originalPrice && (
                        <div className="text-xs text-slate-400 line-through mt-1 leading-none">
                          {formatCurrency(hamper.originalPrice)}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => handleAdd(e, hamper)}
                      className="shrink-0 whitespace-nowrap text-xs font-bold px-3.5 py-2 h-9 rounded-xl shadow-sm hover:shadow bg-amber-500 hover:bg-amber-400 text-black border-none"
                      leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/shop">
            <Button variant="outline" size="lg" leftIcon={<Sparkles className="w-5 h-5" />}>
              View All Hampers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
