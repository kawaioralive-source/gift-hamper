import { Metadata } from 'next';
import { CustomBuilderClient } from '@/components/builder/CustomBuilderClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Custom Hamper #${id}`,
    description: 'Customize your saved gift hamper',
  };
}

export default async function CustomizeIdPage() {
  return <CustomBuilderClient />;
}
