import { Metadata } from 'next';
import { AdminAnalyticsClient } from '@/components/admin/AdminAnalyticsClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Store analytics and insights',
};

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <AdminAnalyticsClient />
    </AdminLayout>
  );
}