import { Metadata } from 'next';
import { AdminHomepageEditorClient } from '@/components/admin/AdminHomepageEditorClient';

export const metadata: Metadata = {
  title: 'Homepage Visual Editor | Admin',
  description: 'Manage homepage hero content, promotional strips, section sequence, and brand storytelling live.',
};

export default function AdminHomepageEditorPage() {
  return <AdminHomepageEditorClient />;
}
