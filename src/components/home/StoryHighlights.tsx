'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface StoryHighlight {
  id: string;
  name: string;
  image: string;
  href: string;
  isNew?: boolean;
}

const HIGHLIGHTS: StoryHighlight[] = [
  {
    id: 'bestsellers',
    name: 'Bestsellers',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=200&q=80',
    href: '/shop?sort=popular',
  },
  {
    id: 'custom-builder',
    name: 'Build a Box',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=200&q=80',
    href: '/customize/new',
    isNew: true,
  },
  {
    id: 'birthday',
    name: 'Birthday',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=200&q=80',
    href: '/occasions/birthday',
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=200&q=80',
    href: '/occasions/anniversary',
  },
  {
    id: 'chocolates',
    name: 'Chocolates',
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=200&q=80',
    href: '/shop?category=Gourmet',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=200&q=80',
    href: '/corporate',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=200&q=80',
    href: '/occasions/wellness',
  },
  {
    id: 'under-2999',
    name: 'Under ₹2,999',
    image: 'https://images.unsplash.com/photo-1543589077-47d51b3d4671?auto=format&fit=crop&w=200&q=80',
    href: '/shop?max_price=2999',
  },
];

export function StoryHighlights() {
  return (
    <div className="w-full bg-white/60 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-800/50 py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-1 pt-1 justify-start md:justify-center">
          {HIGHLIGHTS.map((story) => (
            <Link
              key={story.id}
              href={story.href}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              {/* Circular Avatar with Gradient Ring */}
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-400 group-hover:scale-105 transition-transform duration-200 shadow-md">
                <div className="p-0.5 rounded-full bg-white dark:bg-slate-950">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={story.image}
                      alt={story.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>
                {story.isNew && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-rose-600 text-[8px] font-black tracking-wider text-white uppercase shadow-sm">
                    NEW
                  </span>
                )}
              </div>

              {/* Title */}
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 text-center tracking-tight truncate max-w-[70px] sm:max-w-[80px]">
                {story.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
