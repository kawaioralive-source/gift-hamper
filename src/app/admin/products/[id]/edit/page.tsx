import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminProductFormClient } from '@/components/admin/AdminProductFormClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Edit Product',
    description: `Edit product ${id}`,
  };
}

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminLayout>
      <AdminProductFormClient productId={id} />
    </AdminLayout>
  );
}