import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with KawaiOra customer support for corporate gifting, order inquiries, or custom hamper requests.',
};

export default function ContactPage() {
  return (
    <div className="container-custom py-16 space-y-12">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-bold font-display">Contact Us</h1>
        <p className="text-slate-500">We'd love to hear from you! Reach out for custom orders, corporate inquiries, or support.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card variant="elevated" padding="lg" className="space-y-6">
          <h2 className="text-2xl font-bold">Send a Message</h2>
          <form className="space-y-4">
            <Input label="Your Name" placeholder="John Doe" required />
            <Input label="Email Address" type="email" placeholder="you@example.com" required />
            <Textarea label="Message" placeholder="How can we help you?" rows={4} required />
            <Button variant="primary" className="w-full">Send Message</Button>
          </form>
        </Card>

        <div className="space-y-6 flex flex-col justify-center">
          <Card variant="outlined" padding="md" className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-amber-500" />
            <div>
              <p className="font-semibold text-sm">Email Support</p>
              <p className="text-slate-500 text-sm">hello@kawaiora.com</p>
            </div>
          </Card>

          <Card variant="outlined" padding="md" className="flex items-center gap-4">
            <Phone className="w-6 h-6 text-amber-500" />
            <div>
              <p className="font-semibold text-sm">Phone Hotline</p>
              <p className="text-slate-500 text-sm">+91 98765 43210</p>
            </div>
          </Card>

          <Card variant="outlined" padding="md" className="flex items-center gap-4">
            <MapPin className="w-6 h-6 text-amber-500" />
            <div>
              <p className="font-semibold text-sm">Headquarters</p>
              <p className="text-slate-500 text-sm">Mumbai, Maharashtra, India</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
