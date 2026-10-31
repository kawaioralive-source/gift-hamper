import { Metadata } from 'next';
import { AdminPromoCodesClient } from '@/components/admin/AdminPromoCodesClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Promo Codes',
  description: 'Manage promotional codes',
};

export default function AdminPromoCodesPage() {
  return (
    <AdminLayout>
      <AdminPromoCodesClient />
    </AdminLayout>
  );
}