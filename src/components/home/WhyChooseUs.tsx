'use client';

import { Gift, Truck, Ribbon, Shield, Heart, Sparkles, Palette, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrand } from '@/hooks/useBrand';

const FEATURES = [
  {
    icon: Gift,
    title: 'Beautifully Curated',
    description: 'Every hamper is thoughtfully designed by our gifting experts with premium, artisanal products sourced globally.',
  },
  {
    icon: Ribbon,
    title: 'Premium Packaging',
    description: 'Satin ribbons, luxury boxes, hand-tied bows, and custom wrapping - every detail exudes elegance and care.',
  },
  {
    icon: Heart,
    title: 'Personalized Messages',
    description: 'Add handwritten notes, photos, names, and custom themes to make your gift truly one-of-a-kind.',
  },
  {
    icon: Truck,
    title: 'Reliable Delivery',
    description: 'Nationwide express delivery with real-time tracking, scheduled dates, and same-day options in major cities.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: '256-bit SSL encryption with multiple payment options including UPI, cards, net banking, and COD.',
  },
  {
    icon: Sparkles,
    title: 'Custom Hamper Builder',
    description: 'Design your own gift from scratch - choose the box, items, card, packaging, and add personal touches.',
  },
  {
    icon: Palette,
    title: 'Occasion-Specific Collections',
    description: 'Curated collections for birthdays, anniversaries, weddings, corporate, festivals, and every celebration.',
  },
  {
    icon: Star,
    title: '5-Star Customer Service',
    description: 'Dedicated support team available via chat, email, and phone to ensure your gifting experience is perfect.',
  },
];

const STATS = [
  { value: '50,000+', label: 'Happy Customers' },
  { value: '100+', label: 'Unique Hampers' },
  { value: '98%', label: 'On-Time Delivery' },
  { value: '4.9/5', label: 'Average Rating' },
];

export function WhyChooseUs() {
  const { brand } = useBrand();

  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="container-custom">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                'glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center relative',
                index < 3 && 'lg:after:content-[""] lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:-translate-y-1/2 lg:after:w-[1px] lg:after:h-1/2 lg:after:bg-slate-200 dark:lg:after:bg-slate-800'
              )}
            >
              <div className="text-3xl sm:text-4xl font-extrabold gold-gradient-text">{stat.value}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">
            Why Choose {brand.brand_short_name || 'KawaiOra'}?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base mt-3">
            We don't just deliver gifts - we deliver unforgettable experiences crafted with love and attention to detail.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                'glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-300/50 dark:hover:border-amber-500/30 transition-all group',
                'animate-in'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                <feature.icon className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}