import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { WhatsAppConcierge } from '@/components/layout/WhatsAppConcierge';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <WhatsAppConcierge />
    </div>
  );
}
