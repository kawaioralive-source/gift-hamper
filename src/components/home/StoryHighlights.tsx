'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryItem {
  id: string;
  name: string;
  image: string;
  href: string;
  tag?: string;
  price?: number;
  highlight?: boolean;
}

const SALTY_CIRCULAR_STORIES: StoryItem[] = [
  {
    id: 'spooky-builder',
    name: '🪄 Build a Box',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=250&q=80',
    href: '/customize/new',
    tag: 'CUSTOM',
    highlight: true,
  },
  {
    id: 'grand-royal',
    name: 'Royal Keepsakes',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=250&q=80',
    href: '/products/grand-royal-celebration',
    tag: '👑 BESTSELLER',
    price: 14999,
  },
  {
    id: 'artisan-truffles',
    name: 'Belgian Truffles',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=250&q=80',
    href: '/products/artisanal-chocolate-wine',
    tag: '🍫 GOURMET',
    price: 11950,
  },
  {
    id: 'under-999',
    name: 'Under ₹999',
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=250&q=80',
    href: '/shop?price=0-1000',
    tag: '⚡ VALUE',
  },
  {
    id: 'birthday-treats',
    name: 'Birthday Crates',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=250&q=80',
    href: '/products/sweet-birthday-basket',
    tag: '🎉 CELEBRATE',
    price: 7999,
  },
  {
    id: 'anniversary-luxe',
    name: 'Anniversary Luxe',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=250&q=80',
    href: '/shop?occasion=anniversary',
    tag: '💍 COUPLES',
    price: 8999,
  },
  {
    id: 'executive-crate',
    name: 'Corporate VIP',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=250&q=80',
    href: '/products/executive-corporate-crate',
    tag: '💼 VIP',
    price: 18900,
  },
  {
    id: 'zen-spa',
    name: 'Spa & Wellness',
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=250&q=80',
    href: '/products/zen-wellness-spa',
    tag: '🕯️ RELAX',
    price: 9500,
  },
  {
    id: 'festival-treats',
    name: 'Festive Delights',
    image: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=250&q=80',
    href: '/products/festival-sunshine-treats',
    tag: '✨ SPECIAL',
    price: 8550,
  },
  {
    id: 'view-all',
    name: 'All Hampers',
    image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=250&q=80',
    href: '/shop',
    tag: '🎁 EXPLORE',
  },
];

export function StoryHighlights() {
  const [items, setItems] = useState<StoryItem[]>(SALTY_CIRCULAR_STORIES);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    async function loadCircularProducts() {
      try {
        const [prodRes, siteImagesRes] = await Promise.all([
          fetch('/api/products?limit=10', { cache: 'no-store' }),
          fetch('/api/admin/site-images', { cache: 'no-store' }),
        ]);

        let customConfig = null;
        if (siteImagesRes.ok) {
          const imgJson = await siteImagesRes.json();
          if (imgJson.success && imgJson.data?.circular_products) {
            customConfig = imgJson.data.circular_products;
          }
        }

        if (
          customConfig &&
          !customConfig.use_live_products &&
          Array.isArray(customConfig.items) &&
          customConfig.items.length > 0
        ) {
          setItems(
            customConfig.items.map((it: any) => ({
              id: it.id,
              name: it.name,
              image: it.image_url,
              href: it.href,
              tag: it.tag,
            }))
          );
          return;
        }

        if (prodRes.ok) {
          const pJson = await prodRes.json();
          if (pJson.success && Array.isArray(pJson.data) && pJson.data.length > 0) {
            const tags = ['👑 ROYAL', '🍫 GOURMET', '🎉 BIRTHDAY', '💍 ANNIVERSARY', '⭐ TOP', '✨ LUXE'];
            const liveItems: StoryItem[] = pJson.data.slice(0, 9).map((prod: any, idx: number) => ({
              id: String(prod.id),
              name: prod.name,
              image:
                prod.image ||
                prod.images?.[0] ||
                'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=250&q=80',
              href: `/products/${prod.slug}`,
              tag: idx === 0 ? '👑 BESTSELLER' : tags[idx % tags.length],
              price: prod.price,
            }));

            // Prepend Custom Builder story circle
            liveItems.unshift({
              id: 'custom-builder-pill',
              name: '🪄 Build a Box',
              image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=250&q=80',
              href: '/customize/new',
              tag: 'CUSTOM',
              highlight: true,
            });

            setItems(liveItems);
          }
        }
      } catch (e) {
        console.warn('Using baseline circular stories', e);
      }
    }

    loadCircularProducts();
  }, []);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const amount = direction === 'left' ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  return (
    <section className="w-full bg-gradient-to-b from-[#faf6f7] via-white to-[#faf6f7] dark:from-slate-900/95 dark:via-slate-900 dark:to-slate-950 border-b border-rose-100/70 dark:border-slate-800/80 py-4 sm:py-6 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle Top Header Label */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-rose-100 uppercase tracking-widest font-serif flex items-center gap-1.5">
              <span>Curated Hamper Collections</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
          </div>
          <Link
            href="/shop"
            className="text-[11px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 transition"
          >
            <span>All Hampers</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Story Scroller Container with Left/Right Chevrons */}
        <div className="relative group/scroller">
          {/* Desktop Left Scroll Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-700 transition shadow-lg items-center justify-center z-30"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Right Scroll Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-700 transition shadow-lg items-center justify-center z-30"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Horizontal Circular Scroll Strip */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {items.map((story) => (
              <Link
                key={story.id}
                href={story.href}
                className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none transition-transform hover:-translate-y-1"
              >
                {/* Salty Circular Story Avatar with Radiant Gradient Ring */}
                <div
                  className={cn(
                    'relative p-0.5 sm:p-1 rounded-full transition-all duration-300 shadow-sm',
                    story.highlight
                      ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md group-hover:shadow-rose-400/40'
                      : 'bg-gradient-to-tr from-rose-400 via-amber-300 to-rose-500 group-hover:from-rose-500 group-hover:to-amber-400'
                  )}
                >
                  <div className="p-0.5 rounded-full bg-white dark:bg-slate-900">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-rose-50 dark:bg-slate-800 border border-rose-100/60 dark:border-slate-700/60 relative">
                      <img
                        src={story.image}
                        alt={story.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        loading="eager"
                      />
                    </div>
                  </div>

                  {/* Salty Pill Badge */}
                  {story.tag && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-[8px] sm:text-[9px] font-black tracking-wider text-white uppercase shadow-sm border border-white/60 whitespace-nowrap">
                      {story.tag}
                    </span>
                  )}
                </div>

                {/* Story Title & Price */}
                <div className="flex flex-col items-center max-w-[80px] sm:max-w-[95px] text-center pt-0.5">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors tracking-tight truncate w-full">
                    {story.name}
                  </span>
                  {story.price ? (
                    <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                      ₹{story.price.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-medium">Explore →</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
