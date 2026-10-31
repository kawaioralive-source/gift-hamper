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
}

const HALLOWEEN_FALLBACK_STORIES: StoryItem[] = [
  {
    id: 'grand-royal',
    name: '🎃 Grand Royal',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=250&q=80',
    href: '/products/grand-royal-celebration',
    tag: '🎃 SPOOKY',
    price: 14999,
  },
  {
    id: 'artisan-truffles',
    name: '🍫 Dark Truffles',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=250&q=80',
    href: '/products/artisanal-chocolate-wine',
    tag: 'BELGIAN',
    price: 11950,
  },
  {
    id: 'spooky-builder',
    name: '🪄 Build a Box',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=250&q=80',
    href: '/customize/new',
    tag: 'CUSTOM',
    price: 4999,
  },
  {
    id: 'executive-crate',
    name: 'Executive Crate',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=250&q=80',
    href: '/products/executive-corporate-crate',
    tag: 'VIP',
    price: 18900,
  },
  {
    id: 'zen-spa',
    name: '🕯️ Midnight Spa',
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=250&q=80',
    href: '/products/zen-wellness-spa',
    tag: 'RELAX',
    price: 9500,
  },
  {
    id: 'birthday-treats',
    name: 'Sweet Birthday',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=250&q=80',
    href: '/products/sweet-birthday-basket',
    tag: 'POPULAR',
    price: 7999,
  },
  {
    id: 'festival-treats',
    name: 'Festive Delight',
    image: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=250&q=80',
    href: '/products/festival-sunshine-treats',
    tag: 'SPECIAL',
    price: 8550,
  },
  {
    id: 'under-2999',
    name: 'Under ₹2,999',
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=250&q=80',
    href: '/shop?max_price=2999',
    tag: '⚡ VALUE',
  },
];

export function StoryHighlights() {
  const [items, setItems] = useState<StoryItem[]>(HALLOWEEN_FALLBACK_STORIES);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    async function loadCircularProducts() {
      try {
        const [prodRes, siteImagesRes] = await Promise.all([
          fetch('/api/products?limit=12', { cache: 'no-store' }),
          fetch('/api/admin/site-images', { cache: 'no-store' }),
        ]);

        let customConfig = null;
        if (siteImagesRes.ok) {
          const imgJson = await siteImagesRes.json();
          if (imgJson.success && imgJson.data?.circular_products) {
            customConfig = imgJson.data.circular_products;
          }
        }

        if (customConfig && !customConfig.use_live_products && Array.isArray(customConfig.items) && customConfig.items.length > 0) {
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
            const liveItems: StoryItem[] = pJson.data.slice(0, 10).map((prod: any, idx: number) => {
              const tags = ['🎃 SPOOKY', '🔥 HOT', '🍫 TRUFFLE', '✨ LUXE', 'NEW', '⭐ TOP'];
              return {
                id: String(prod.id),
                name: prod.name,
                image: prod.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=250&q=80',
                href: `/products/${prod.slug}`,
                tag: idx === 0 ? '🎃 SPOOKY' : tags[idx % tags.length],
                price: prod.price,
              };
            });

            liveItems.unshift({
              id: 'custom-builder-pill',
              name: '🪄 Build a Box',
              image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=250&q=80',
              href: '/customize/new',
              tag: 'CUSTOM',
            });

            setItems(liveItems);
          }
        }
      } catch (e) {
        console.warn('Using fallback circular stories', e);
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
    const amount = direction === 'left' ? -300 : 300;
    scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  return (
    <section className="w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-3 relative z-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-glow-halloween" />
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
            🎃 Curated Hamper Highlights
          </h3>
        </div>
        <Link
          href="/shop"
          className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1 transition"
        >
          <span>View All Hampers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Illuminated Circular Story Showcase Card */}
      <div className="relative rounded-3xl bg-slate-900/90 dark:bg-halloween-surface/90 border border-orange-500/25 p-4 sm:p-6 shadow-2xl shadow-orange-950/20 backdrop-blur-xl group/container">
        
        {/* Desktop Left Scroll Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950 border border-orange-500/40 text-orange-400 hover:text-white hover:bg-orange-600 transition shadow-xl items-center justify-center z-30"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Right Scroll Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950 border border-orange-500/40 text-orange-400 hover:text-white hover:bg-orange-600 transition shadow-xl items-center justify-center z-30"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Scroll Strip */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1 justify-start"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((story) => (
            <Link
              key={story.id}
              href={story.href}
              className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none transition-transform hover:-translate-y-1"
            >
              {/* Circular Avatar with Glowing Ring */}
              <div className="relative p-0.5 sm:p-1 rounded-full bg-gradient-to-tr from-orange-500 via-purple-600 to-amber-400 group-hover:from-orange-400 group-hover:to-amber-300 shadow-glow-halloween/30 transition-all duration-300">
                <div className="p-0.5 rounded-full bg-slate-950">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src={story.image}
                      alt={story.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Badge */}
                {story.tag && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-600 to-purple-700 text-[8px] sm:text-[9px] font-black tracking-wider text-white uppercase shadow-md border border-orange-400/30 whitespace-nowrap">
                    {story.tag}
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="flex flex-col items-center max-w-[80px] sm:max-w-[95px] text-center pt-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-orange-400 transition-colors tracking-tight truncate w-full">
                  {story.name}
                </span>
                {story.price && (
                  <span className="text-[10px] sm:text-[11px] text-orange-400 font-mono font-bold">
                    ₹{story.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
