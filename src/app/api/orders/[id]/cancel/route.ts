import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Orders cannot be cancelled directly by customers.
// Direct cancellation attempts return guidance to submit a cancellation ticket.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved = await Promise.resolve(params);
  return NextResponse.json(
    {
      success: false,
      error: 'Direct order cancellation is disabled for customer safety. Please submit an official cancellation ticket via the order details page for administrative review.',
      action_required: 'submit_cancellation_ticket',
      order_id: resolved.id,
    },
    { status: 400 }
  );
}
