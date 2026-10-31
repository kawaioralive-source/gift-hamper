import { Metadata } from 'next';
import { CustomBuilderClient } from '@/components/builder/CustomBuilderClient';

export const metadata: Metadata = {
  title: 'Custom Gift Hamper Builder',
  description: 'Design a personalized gift hamper from scratch. Choose container, items, greeting card, and personal touches.',
};

export default function CustomizePage() {
  return <CustomBuilderClient />;
}
