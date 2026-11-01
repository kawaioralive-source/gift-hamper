import { Metadata } from 'next';
import { ShopPageClient } from '@/components/shop/ShopPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hamper Categories',
  description: 'Browse gift hampers by luxury, birthday, romantic, corporate, wellness, and festive categories.',
};

export default function CategoriesPage() {
  return <ShopPageClient showFilters={false} />;
}
