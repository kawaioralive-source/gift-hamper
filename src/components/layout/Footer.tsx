'use client';

import Link from 'next/link';
import { Gift, Truck, Shield, Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrand } from '@/hooks/useBrand';

const FOOTER_LINKS = {
  shop: [
    { label: 'All Gift Hampers', href: '/shop' },
    { label: 'Birthday Hampers', href: '/occasions/birthday' },
    { label: 'Anniversary Hampers', href: '/occasions/anniversary' },
    { label: 'Wedding Hampers', href: '/occasions/wedding' },
    { label: 'Corporate Gifts', href: '/categories/corporate' },
    { label: 'Custom Builder', href: '/customize/new' },
    { label: 'Gift Cards', href: '/gift-cards' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQs', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
  support: [
    { label: 'Track Order', href: '/track' },
    { label: 'Shipping Info', href: '/shipping' },
    { label: 'Returns & Refunds', href: '/returns' },
    { label: 'Cancellation Policy', href: '/cancellation' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  contact: {
    email: 'hello@kawaiora.com',
    phone: '+91 98765 43210',
    address: 'Mumbai, Maharashtra, India',
  },
};

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com/kawaiora', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/kawaiora', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/kawaiora', label: 'Twitter' },
  { icon: Youtube, href: 'https://youtube.com/kawaiora', label: 'YouTube' },
];

export function Footer() {
  const { brand } = useBrand();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-300">
      <div className="container-custom py-16 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="inline-flex items-center group" aria-label={`${brand.brand_short_name || 'Kavayura Hampers'} Home`}>
              <div className="h-12 px-3 py-1 bg-transparent rounded-xl flex items-center justify-center transition group-hover:scale-105">
                <img
                  src={brand.logo_url || '/images/kawaiora-logo.png'}
                  alt={brand.brand_name || 'Kavayura Hampers'}
                  className="h-9 w-auto object-contain"
                />
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {brand.brand_tagline || "Crafting bespoke luxury hampers and personalized gift boxes for life's unforgettable moments."}
            </p>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <nav aria-label="Shop links">
            <h3 className="font-bold text-white mb-4">Shop Hampers</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company links">
            <h3 className="font-bold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support links">
            <h3 className="font-bold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-bold text-white mb-4">Contact Us</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${FOOTER_LINKS.contact.email}`}
                className="flex items-center gap-3 text-sm text-slate-400 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span>{brand.support_email || FOOTER_LINKS.contact.email}</span>
              </a>
              <a
                href={`tel:${(brand.support_phone || FOOTER_LINKS.contact.phone).replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-sm text-slate-400 hover:text-amber-400 transition-colors"
              >
                <Phone className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span>{brand.support_phone || FOOTER_LINKS.contact.phone}</span>
              </a>
              <address className="flex items-start gap-3 text-sm text-slate-400 not-italic">
                <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{brand.support_address || FOOTER_LINKS.contact.address}</span>
              </address>
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Secure SSL</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Express Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 text-center md:text-left">
              &copy; {new Date().getFullYear()} {brand.brand_name || 'Kavayura Hampers'}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-amber-400 transition-colors">Cookie Policy</Link>
              <Link href="/accessibility" className="hover:text-amber-400 transition-colors">Accessibility</Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">Payments:</span>
              <div className="flex gap-2 text-lg">
                <span className="text-blue-600" aria-label="Visa">💳</span>
                <span className="text-red-600" aria-label="Mastercard">💳</span>
                <span className="text-purple-600" aria-label="Amex">💳</span>
                <span className="text-black" aria-label="UPI">📱</span>
                <span className="text-indigo-600" aria-label="Net Banking">🏦</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
