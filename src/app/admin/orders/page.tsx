import { Metadata } from 'next';
import { AdminOrdersClient } from '@/components/admin/AdminOrdersClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Orders Management',
  description: 'Manage customer orders',
};

export default function AdminOrdersPage() {
  return (
    <AdminLayout>
      <AdminOrdersClient />
    </AdminLayout>
  );
}