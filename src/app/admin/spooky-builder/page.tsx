import { Metadata } from 'next';
import { AdminSpookyBuilderClient } from '@/components/admin/AdminSpookyBuilderClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: '🎃 Spooky Builder Products | Admin Dashboard',
  description: 'Manage boxes, treats, beverages, keepsakes, cards, and packaging in the custom hamper builder.',
};

export default function AdminSpookyBuilderPage() {
  return (
    <AdminLayout>
      <AdminSpookyBuilderClient />
    </AdminLayout>
  );
}
