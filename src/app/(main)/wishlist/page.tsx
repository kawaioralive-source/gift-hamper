import { Metadata } from 'next';
import { WishlistPageClient } from '@/components/wishlist/WishlistPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Your saved gift hampers and favorite items.',
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
