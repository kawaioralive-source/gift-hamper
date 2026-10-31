import { Metadata } from 'next';
import { AdminCorporateClient } from '@/components/admin/AdminCorporateClient';

export const metadata: Metadata = {
  title: 'Corporate & Bulk Inquiries | KawaiOra Admin',
  description: 'Manage corporate gifting leads, enterprise bulk quotations, and custom packaging orders.',
};

export default function AdminCorporatePage() {
  return <AdminCorporateClient />;
}
