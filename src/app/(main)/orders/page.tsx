import { Metadata } from 'next';
import { OrdersClient } from '@/components/orders/OrdersClient';

export const metadata: Metadata = {
  title: 'My Orders',
  description: 'Track your active gift hamper orders and view order history.',
};

export default function OrdersPage() {
  return <OrdersClient />;
}
