import { Metadata } from 'next';
import { AdminBrandClient } from '@/components/admin/AdminBrandClient';

export const metadata: Metadata = {
  title: 'Global Brand Identity Management | Admin',
  description: 'Manage store brand name, logos, contact identity, and global headers with version history and rollback.',
};

export default function AdminBrandPage() {
  return <AdminBrandClient />;
}
