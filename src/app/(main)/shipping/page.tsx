import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Details on shipping rates, delivery timelines, and nationwide coverage.',
};

export default function ShippingPage() {
  return (
    <div className="container-custom py-16 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Shipping Policy</h1>
      <Card padding="lg" className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <p>We provide nationwide express delivery across India. Free standard shipping applies to orders over ₹999.</p>
        <p>Orders are dispatched within 24 hours of placement. Live tracking links are sent via SMS and email.</p>
      </Card>
    </div>
  );
}
