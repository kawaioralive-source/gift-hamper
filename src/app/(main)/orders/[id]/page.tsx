import { Metadata } from 'next';
import { OrderDetailClient } from '@/components/orders/OrderDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id} Details`,
    description: `Track order #${id}`,
  };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
