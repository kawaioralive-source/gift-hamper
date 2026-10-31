import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminImageManagerClient } from '@/components/admin/AdminImageManagerClient';

export const metadata: Metadata = {
  title: 'Website Image & Theme Manager | KawaiOra Admin',
  description: 'Manage and replace any image, banner, circular product highlight, and theme across the website.',
};

export default function AdminImagesPage() {
  return (
    <AdminLayout>
      <AdminImageManagerClient />
    </AdminLayout>
  );
}
