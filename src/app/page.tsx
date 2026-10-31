import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DynamicHomepage } from '@/components/home/DynamicHomepage';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { WhatsAppConcierge } from '@/components/layout/WhatsAppConcierge';

export const metadata: Metadata = {
  title: 'Premium Gift Hampers for Every Occasion',
  description: 'Discover thoughtfully curated artisan gift hampers for birthdays, anniversaries, weddings, corporate gifting, and more. Premium packaging, personalized messages, and reliable delivery across India.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
      <Header />
      <DynamicHomepage />
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <WhatsAppConcierge />
    </div>
  );
}