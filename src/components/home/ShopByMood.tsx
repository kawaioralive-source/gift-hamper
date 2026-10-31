'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface MoodItem {
  id: string;
  title: string;
  tagline: string;
  tag: string;
  image: string;
  href: string;
}

const DEFAULT_HALLOWEEN_MOODS: MoodItem[] = [
  {
    id: 'trick-or-treat',
    title: '🎃 Trick or Treat',
    tagline: 'Artisan dark chocolates, caramel skulls & gourmet confectionery',
    tag: 'Spooky Treats',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    href: '/shop?category=Gourmet',
  },
  {
    id: 'midnight-magic',
    title: '🕯️ Midnight Magic',
    tagline: 'Gothic scented candles, Pinot Noir & handcrafted silk cards',
    tag: 'Mystic Vibe',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
    href: '/occasions/anniversary',
  },
  {
    id: 'pumpkin-warmth',
    title: '🍂 Pumpkin Warmth',
    tagline: 'Wildflower honey, cinnamon crisps, amber tea & wool keepsakes',
    tag: 'Autumn Mood',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    href: '/occasions/birthday',
  },
  {
    id: 'bewitched-royale',
    title: '👑 Bewitched Royale',
    tagline: 'French sparkling champagne, gold-leaf pralines & rigid keepsake crate',
    tag: 'Luxury Mood',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
    href: '/shop?category=Luxury',
  },
];

export function ShopByMood() {
  const [moods, setMoods] = useState<MoodItem[]>(DEFAULT_HALLOWEEN_MOODS);

  useEffect(() => {
    async function loadMoods() {
      try {
        const res = await fetch('/api/admin/site-images');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.shop_by_mood) && json.data.shop_by_mood.length > 0) {
            setMoods(
              json.data.shop_by_mood.map((m: any) => ({
                id: m.id,
                title: m.title,
                tagline: m.tagline,
                tag: m.tag,
                image: m.image_url,
                href: m.href,
              }))
            );
          }
        }
      } catch (e) {
        console.warn('Using baseline mood cards:', e);
      }
    }
    loadMoods();
  }, []);

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Halloween Vibes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">
            Shop by Gifting Mood
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Find the hamper that perfectly mirrors the emotion of your celebration
          </p>
        </div>
        <Link
          href="/shop"
          className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1"
        >
          <span>View All Themes</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {moods.map((mood) => (
          <Link
            key={mood.id}
            href={mood.href}
            className="group relative rounded-3xl overflow-hidden aspect-[3/4] flex flex-col justify-end p-6 border border-orange-500/20 dark:border-orange-500/30 shadow-md hover:shadow-glow-halloween/30 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Background Image with Zoom */}
            <img
              src={mood.image}
              alt={mood.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700 brightness-90 group-hover:brightness-95"
              loading="lazy"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-85 group-hover:opacity-90 transition-opacity" />

            {/* Content */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="rose" className="text-[10px] uppercase font-bold tracking-wider bg-orange-600/90 text-white border-none">
                  {mood.tag}
                </Badge>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-200">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white font-serif leading-tight">
                {mood.title}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {mood.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
