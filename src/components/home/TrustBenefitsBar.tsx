'use client';

import { Truck, Ribbon, PenLine, ShieldCheck } from 'lucide-react';

const BENEFITS = [
  {
    icon: Truck,
    title: '🦇 Ghostly Fast Express Dispatch',
    description: 'Safe 2-3 business days delivery with live SMS & WhatsApp tracking',
  },
  {
    icon: Ribbon,
    title: '🎃 Luxury Keepsake Packaging',
    description: 'Handcrafted rigid gift box with double-faced satin ribbon finish',
  },
  {
    icon: PenLine,
    title: '📜 Free Handwritten Card',
    description: 'Complimentary textured greeting card with your bespoke message',
  },
  {
    icon: ShieldCheck,
    title: '🛡️ 100% Secure Payments',
    description: '256-bit encrypted Razorpay gateway supporting UPI, Cards & EMI',
  },
];

export function TrustBenefitsBar() {
  return (
    <section className="border-y border-orange-500/20 bg-slate-900/60 dark:bg-halloween-surface/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="flex items-start gap-3.5 group">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-tight">
                    {b.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
