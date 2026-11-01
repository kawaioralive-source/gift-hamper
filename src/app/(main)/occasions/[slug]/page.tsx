import { Metadata } from 'next';
import { ShopPageClient } from '@/components/shop/ShopPageClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `${name} Hampers`,
    description: `Explore curated gift hampers for ${name}.`,
  };
}

export default async function OccasionDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ShopPageClient initialOccasion={slug} showFilters={false} />;
}
