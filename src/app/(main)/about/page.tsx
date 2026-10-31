import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about KawaiOra Artisan Hampers and our mission to craft unforgettable gift experiences.',
};

export default function AboutPage() {
  return (
    <div className="container-custom py-16 space-y-8">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-bold font-display gold-gradient-text">About KawaiOra</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Crafting bespoke luxury hampers and personalized gift boxes for life's unforgettable moments.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card variant="elevated" padding="lg" className="space-y-3">
          <h3 className="text-xl font-bold text-amber-600">Artisan Curation</h3>
          <p className="text-sm text-slate-500">Every item is handpicked from top global chocolatiers, winemakers, and fragrance artisans.</p>
        </Card>
        <Card variant="elevated" padding="lg" className="space-y-3">
          <h3 className="text-xl font-bold text-amber-600">Satin Ribbon Packaging</h3>
          <p className="text-sm text-slate-500">Luxury rigid boxes, gold foil greeting cards, and satin ribbons tied to perfection.</p>
        </Card>
        <Card variant="elevated" padding="lg" className="space-y-3">
          <h3 className="text-xl font-bold text-amber-600">Express Delivery</h3>
          <p className="text-sm text-slate-500">Scheduled date delivery and nationwide express shipping with live tracking.</p>
        </Card>
      </div>
    </div>
  );
}
