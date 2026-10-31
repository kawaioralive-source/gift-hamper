import { Metadata } from 'next';
import { AdminCancellationTicketsClient } from '@/components/admin/AdminCancellationTicketsClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Order Cancellation Tickets | Admin',
  description: 'Manage and review customer order cancellation tickets',
};

export default function AdminCancellationTicketsPage() {
  return (
    <AdminLayout>
      <AdminCancellationTicketsClient />
    </AdminLayout>
  );
}
