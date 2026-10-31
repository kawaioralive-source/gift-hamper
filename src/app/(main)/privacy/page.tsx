import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How we protect your personal data and privacy.',
};

export default function PrivacyPage() {
  return (
    <div className="container-custom py-16 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <Card padding="lg" className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <p>Your privacy is important to us. We use 256-bit SSL encryption to protect your transaction details and personal information.</p>
      </Card>
    </div>
  );
}
