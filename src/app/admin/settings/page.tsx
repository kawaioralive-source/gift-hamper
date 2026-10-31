import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Admin settings',
};

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <AdminSettingsClient />
    </AdminLayout>
  );
}