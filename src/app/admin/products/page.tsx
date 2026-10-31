import { Metadata } from 'next';
import { AdminProductsClient } from '@/components/admin/AdminProductsClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Products Management',
  description: 'Manage products and inventory',
};

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <AdminProductsClient />
    </AdminLayout>
  );
}