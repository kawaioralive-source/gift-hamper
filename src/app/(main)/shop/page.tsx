import { Metadata } from 'next';
import { ShopPageClient } from '@/components/shop/ShopPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop Gift Hampers',
  description: 'Explore our full collection of curated artisan gift hampers for all occasions.',
};

export default function ShopPage() {
  return <ShopPageClient />;
}
