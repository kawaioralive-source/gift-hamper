import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Digital Gift Cards',
  description: 'Give the gift of choice with KawaiOra E-Gift Cards.',
};

export default function GiftCardsPage() {
  return (
    <div className="container-custom py-16 flex justify-center">
      <Card variant="elevated" padding="lg" className="max-w-lg text-center space-y-6">
        <h1 className="text-3xl font-bold font-display gold-gradient-text">KawaiOra Digital Gift Card</h1>
        <p className="text-slate-500">Delivered instantly via email with custom gift message and no expiration date.</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline">₹2,500</Button>
          <Button variant="outline">₹5,000</Button>
          <Button variant="primary">₹10,000</Button>
        </div>
      </Card>
    </div>
  );
}
