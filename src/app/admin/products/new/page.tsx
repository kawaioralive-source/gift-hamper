import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminProductFormClient } from '@/components/admin/AdminProductFormClient';

export const metadata: Metadata = {
  title: 'Create Product',
  description: 'Create a new product',
};

export default function AdminProductNewPage() {
  return (
    <AdminLayout>
      <AdminProductFormClient />
    </AdminLayout>
  );
}