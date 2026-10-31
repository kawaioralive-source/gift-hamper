'use client';

import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const MOODS = [
  {
    id: 'royal-grandeur',
    title: 'Royal Grandeur',
    tagline: 'Opulent hampers with sparkling wine & gold accents',
    tag: 'Luxury Mood',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    href: '/shop?category=Luxury',
  },
  {
    id: 'midnight-romance',
    title: 'Midnight Romance',
    tagline: 'Aged Pinot Noir, Belgian truffles & handcrafted candles',
    tag: 'Romantic Vibe',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
    href: '/occasions/anniversary',
  },
  {
    id: 'warm-sunshine',
    title: 'Sweet Celebration',
    tagline: 'Macarons, caramel treats, flowers & plush surprises',
    tag: 'Joyful Mood',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    href: '/occasions/birthday',
  },
  {
    id: 'executive-prestige',
    title: 'Executive Prestige',
    tagline: 'Single malt, leather journals, roasted nuts & luxury pens',
    tag: 'Corporate Vibe',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
    href: '/corporate',
  },
];

export function ShopByMood() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Gifting Vibes</span>
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
          className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1"
        >
          <span>View All Themes</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {MOODS.map((mood) => (
          <Link
            key={mood.id}
            href={mood.href}
            className="group relative rounded-3xl overflow-hidden aspect-[3/4] flex flex-col justify-end p-6 border border-slate-200/50 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Background Image with Zoom */}
            <img
              src={mood.image}
              alt={mood.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700 brightness-90 group-hover:brightness-95"
              loading="lazy"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Pill Tag */}
            <div className="relative z-10 mb-auto">
              <Badge variant="amber" className="text-[10px] uppercase font-bold tracking-wider backdrop-blur-md">
                {mood.tag}
              </Badge>
            </div>

            {/* Content */}
            <div className="relative z-10 text-white">
              <h3 className="text-xl font-bold font-serif group-hover:text-amber-300 transition-colors flex items-center justify-between">
                <span>{mood.title}</span>
                <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {mood.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
