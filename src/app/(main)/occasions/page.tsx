import { Metadata } from 'next';
import { ShopPageClient } from '@/components/shop/ShopPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop Hampers by Occasion',
  description: 'Find gift hampers tailored for Birthdays, Anniversaries, Weddings, Valentine\'s, Baby Showers, Corporate, and Festivals.',
};

export default function OccasionsPage() {
  return <ShopPageClient showFilters={false} />;
}
