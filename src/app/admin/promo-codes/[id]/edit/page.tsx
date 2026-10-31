import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPromoCodeFormClient } from '@/components/admin/AdminPromoCodeFormClient';

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await Promise.resolve(params);
  return {
    title: 'Edit Promo Code',
    description: `Edit promo code ${id}`,
  };
}

export default async function AdminPromoCodeEditPage({ params }: Props) {
  const { id } = await Promise.resolve(params);
  return (
    <AdminLayout>
      <AdminPromoCodeFormClient promoCodeId={id} />
    </AdminLayout>
  );
}