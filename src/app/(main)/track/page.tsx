'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function TrackPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/orders/${orderId.trim()}`);
    }
  };

  return (
    <div className="container-custom py-16 flex justify-center">
      <Card variant="elevated" padding="lg" className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Track Your Order</h1>
          <p className="text-sm text-slate-500">Enter your order ID or tracking number to see real-time status</p>
        </div>

        <form onSubmit={handleTrack} className="space-y-4">
          <Input
            label="Order ID / Tracking Number"
            placeholder="e.g. ORD-1002"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" className="w-full">
            Track Order
          </Button>
        </form>
      </Card>
    </div>
  );
}
