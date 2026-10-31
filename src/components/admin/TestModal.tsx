'use client';

import { Modal } from '@/components/ui/Modal';

export function TestModal() {
  return (
    <div>
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <div>Test content</div>
      </Modal>
    </div>
  );
}