'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, Sparkles, MessageCircle, ShieldCheck, Truck, Gift, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Personalization',
    question: 'How do I personalize my MyKavayora gift hamper?',
    answer:
      'You can easily personalize any hamper! Visit our interactive Custom Hamper Builder (/customize/new) to handpick artisanal items, select luxury ribbon colors, and add a personalized message. You can also add custom greetings or recipient notes during checkout for any pre-curated collection.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'What are your delivery timelines across India?',
    answer:
      'We offer pan-India express shipping. Most metro orders (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai) arrive in 2–3 business days. Tier-2 and Tier-3 cities typically take 3–5 business days. Real-time SMS and email tracking links are shared immediately upon dispatch.',
  },
  {
    category: 'Greeting Cards',
    question: 'Can I include a handwritten note or greeting card?',
    answer:
      'Yes! Every MyKavayora luxury box includes a complimentary premium greeting card. Enter your heartfelt message at checkout or inside the custom builder, and our artisans will print or handwrite your note on thick 300 GSM textured cardstock.',
  },
  {
    category: 'Packaging Quality',
    question: 'How is the packaging handled for fragile items and chocolates?',
    answer:
      'We take utmost care with transit safety. Temperature-sensitive items like artisanal chocolates are shipped in thermal-shielded protective packaging. Every hamper is housed in heavy-gauge rigid keepsake boxes, nestled in eco-cushioning shred, and finished with double-faced satin ribbons.',
  },
  {
    category: 'Corporate & Bulk',
    question: 'Do you offer bulk orders, custom branding, and GST invoices for companies?',
    answer:
      'Yes, we specialize in corporate celebrations, Diwali & festive kits, employee onboarding crates, and wedding gifting. We provide custom logo embossing, branded ribbons, personalized sleeves, multi-destination dispatch, and valid GST input tax credit invoices.',
  },
  {
    category: 'Payments & Security',
    question: 'Which payment methods are supported on MyKavayora?',
    answer:
      'We accept all payment modes via our bank-grade encrypted Razorpay gateway: UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit & Debit Cards (Visa, Mastercard, RuPay, American Express), Net Banking, and convenient EMI options.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Everything you need to know about our handcrafted luxury hampers, custom notes, packaging, and pan-India delivery.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={cn(
                  'rounded-2xl border transition-all duration-200 overflow-hidden',
                  isOpen
                    ? 'bg-white dark:bg-slate-900 border-amber-500/40 dark:border-amber-500/30 shadow-lg shadow-amber-500/5'
                    : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0',
                      isOpen && 'transform rotate-180 text-amber-500'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                    <p className="pl-9">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Concierge Assistance Card */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-500/20 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-serif">
                Have a specialized gifting requirement?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Our gifting concierge is available 7 days a week to assist with custom themes, bulk quotes, or express delivery queries.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/919999999999?text=${encodeURIComponent('Hi MyKavayora, I have a question regarding an order or custom hamper.')}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md"
                leftIcon={<MessageCircle className="w-4 h-4" />}
              >
                Chat on WhatsApp
              </Button>
            </a>
            <Link href="/corporate">
              <Button variant="outline" size="sm" className="rounded-xl">
                Corporate Enquiries
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
