import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Returns & Refund Policy',
  description: 'Learn about our 100% satisfaction guarantee and return procedures.',
};

export default function ReturnsPage() {
  return (
    <div className="container-custom py-16 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Returns & Refund Policy</h1>
      <Card padding="lg" className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <p>If your gift hamper arrives damaged or defective, please notify us within 48 hours for an instant replacement or full refund.</p>
        <p>Due to the perishable nature of gourmet products, un-damaged food items cannot be returned.</p>
      </Card>
    </div>
  );
}
