import { Metadata } from 'next';
import { AdminCustomerDetailClient } from '@/components/admin/AdminCustomerDetailClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customer Lifetime Orders & Profile',
  description: 'View customer lifetime purchase history, items, receipts, and order details.',
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolved = await Promise.resolve(params);
  return <AdminCustomerDetailClient customerId={resolved.id} />;
}
