import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about shipping, custom hampers, payments, and returns.',
};

const FAQS = [
  { q: 'How long does express delivery take?', a: 'Standard delivery takes 2-4 business days across India. Same-day express delivery is available in metro cities.' },
  { q: 'Can I add a personalized message?', a: 'Yes! Every hamper includes a complimentary gold foil greeting card with up to 200 characters of custom text.' },
  { q: 'How does the Custom Hamper Builder work?', a: 'Select your preferred gift container, pick gourmet snacks or keepsakes, add greeting card, ribbon color, and preview before checkout.' },
  { q: 'What payment methods do you support?', a: 'We accept Razorpay (UPI, Credit/Debit cards, Net Banking) and Stripe for international payments.' },
];

export default function FAQPage() {
  return (
    <div className="container-custom py-16 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="text-slate-500">Everything you need to know about KawaiOra Hampers</p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, i) => (
          <Card key={i} variant="elevated" padding="lg" className="space-y-2">
            <h3 className="font-semibold text-lg">{faq.q}</h3>
            <p className="text-slate-500 text-sm">{faq.a}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
