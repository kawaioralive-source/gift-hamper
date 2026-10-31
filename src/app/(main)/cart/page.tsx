import { Metadata } from 'next';
import { CartClient } from '@/components/cart/CartClient';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'View your selected hampers, custom gifts, and manage item quantities.',
};

export default function CartPage() {
  return <CartClient />;
}
