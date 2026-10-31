import { Metadata } from 'next';
import { CustomBuilderClient } from '@/components/builder/CustomBuilderClient';

export const metadata: Metadata = {
  title: 'Build Custom Hamper',
  description: 'Design your own gift hamper.',
};

export default function CustomizeNewPage() {
  return <CustomBuilderClient />;
}
