import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPromoCodeFormClient } from '@/components/admin/AdminPromoCodeFormClient';

export const metadata: Metadata = {
  title: 'Create Promo Code',
  description: 'Create a new promotional code',
};

export default function AdminPromoCodeNewPage() {
  return (
    <AdminLayout>
      <AdminPromoCodeFormClient />
    </AdminLayout>
  );
}