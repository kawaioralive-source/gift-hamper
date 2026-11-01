import { Metadata } from 'next';
import { ShopPageClient } from '@/components/shop/ShopPageClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${name} Hampers`,
    description: `Shop our curated collection of ${name} gift hampers.`,
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ShopPageClient initialCategory={slug} showFilters={false} />;
}
