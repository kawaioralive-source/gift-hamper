'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export function WhatsAppConcierge() {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
      <a
        href={`https://wa.me/919820145821?text=${encodeURIComponent('Hi Kawaiora Hampers! I need help selecting a luxury gift hamper.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 border border-emerald-400/30 transition hover:scale-105 active:scale-95 group"
        aria-label="Chat with Hamper Concierge on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white text-emerald-600 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Hamper Concierge</span>
      </a>
    </div>
  );
}
