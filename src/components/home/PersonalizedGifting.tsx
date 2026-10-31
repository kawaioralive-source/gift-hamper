'use client';

import Link from 'next/link';
import { Heart, PenTool, Image, Palette, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const PERSONALIZATION_OPTIONS = [
  {
    icon: PenTool,
    title: 'Custom Message',
    description: 'Add a heartfelt handwritten note on a premium greeting card with gold foil detailing.',
    features: ['Up to 200 characters', 'Multiple font styles', 'Gold/silver foil options'],
  },
  {
    icon: Image,
    title: 'Photo Upload',
    description: 'Include a cherished photo printed on premium cardstock inside the hamper.',
    features: ['High-quality photo print', 'Custom photo frame', 'Optional photo collage'],
  },
  {
    icon: Palette,
    title: 'Theme & Colors',
    description: 'Choose ribbon colors, wrapping paper, and box style to match the occasion perfectly.',
    features: ['10+ ribbon colors', 'Custom wrapping paper', 'Box style selection'],
  },
  {
    icon: Gift,
    title: 'Name Personalization',
    description: 'Engrave the recipient\'s name on keepsake items like tumblers, jewelry boxes, or wooden crates.',
    features: ['Laser engraving', 'Multiple item options', 'Preview before ordering'],
  },
];

export function PersonalizedGifting() {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Make It Personal
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">
            Create Truly Unique<br />
            <span className="gold-gradient-text">Personalized Gifts</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base mt-3 max-w-lg mx-auto">
            Transform any hamper into a one-of-a-kind keepsake with custom messages, photos, names, and themed packaging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {PERSONALIZATION_OPTIONS.map((option, index) => (
            <div
              key={option.title}
              className={cn(
                'glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-300/50 dark:hover:border-amber-500/30 transition-all',
                'group'
              )}
            >
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                <option.icon className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{option.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{option.description}</p>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                {option.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="glass-panel p-8 lg:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Create Your Perfect Gift?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Use our intuitive Custom Hamper Builder to design a gift that speaks from the heart.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/customize/new">
                <Button size="xl" leftIcon={<Sparkles className="w-5 h-5" />}>
                  Start Building Now
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" size="xl">
                  Browse Ready-Made Hampers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}