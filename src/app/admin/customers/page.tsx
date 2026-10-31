import { Metadata } from 'next';
import { AdminCustomersClient } from '@/components/admin/AdminCustomersClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Customers',
  description: 'Manage customer accounts',
};

export default function AdminCustomersPage() {
  return (
    <AdminLayout>
      <AdminCustomersClient />
    </AdminLayout>
  );
}