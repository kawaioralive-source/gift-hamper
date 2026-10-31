'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const OCCASIONS = [
  { slug: 'birthday', label: 'Birthday', icon: '🎂', description: 'Sweet surprises', color: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30' },
  { slug: 'anniversary', label: 'Anniversary', icon: '💍', description: 'For your love', color: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30' },
  { slug: 'wedding', label: 'Wedding', icon: '👰', description: 'New beginnings', color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/30' },
  { slug: 'valentine', label: 'Valentine\'s', icon: '💝', description: 'Romantic gestures', color: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30' },
  { slug: 'baby-shower', label: 'Baby Shower', icon: '👶', description: 'Welcome baby', color: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 border-pink-500/30' },
  { slug: 'corporate', label: 'Corporate', icon: '💼', description: 'VIP client gifts', color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/30' },
  { slug: 'festival', label: 'Festivals', icon: '🪔', description: 'Holiday cheer', color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/30' },
  { slug: 'friendship', label: 'Friendship', icon: '🤝', description: 'Bestie gifts', color: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30' },
];

export function ShopByOccasion() {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">Curated by Occasion</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Find the perfect gift tailored for every milestone</p>
          </div>
          <Link
            href="/occasions"
            className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1"
          >
            View All Occasions <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {OCCASIONS.map((occasion) => (
            <Link
              key={occasion.slug}
              href={`/occasions/${occasion.slug}`}
              className={cn(
                'glass-card p-5 rounded-2xl text-center group transition-all duration-300',
                occasion.color
              )}
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {occasion.icon}
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">{occasion.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{occasion.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}