import { Metadata } from 'next';
import { CustomerReviews } from '@/components/home/CustomerReviews';

export const metadata: Metadata = {
  title: 'Customer Reviews & Testimonials',
  description: 'Read real stories and 5-star reviews from KawaiOra customers.',
};

export default function ReviewsPage() {
  return (
    <div className="py-12">
      <CustomerReviews />
    </div>
  );
}
