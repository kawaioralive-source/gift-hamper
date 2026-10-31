import { Metadata } from 'next';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Complete your order with flexible payment methods and express shipping.',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
