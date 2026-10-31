import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'KawaiOra Admin Dashboard',
};

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboardClient />
    </AdminLayout>
  );
}