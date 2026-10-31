import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using KawaiOra Artisan Hampers.',
};

export default function TermsPage() {
  return (
    <div className="container-custom py-16 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <Card padding="lg" className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <p>Welcome to KawaiOra Artisan Hampers. By using our website and services, you agree to comply with our terms and policies.</p>
      </Card>
    </div>
  );
}
