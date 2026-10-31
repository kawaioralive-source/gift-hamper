import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { addressSchema } from '@/validators/schemas';
import { ZodError } from 'zod';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const user = await getSessionUser();
    const { id } = await params;
    const body = await request.json();
    const validated = addressSchema.parse(body);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // If setting as default, unset other defaults
    if (validated.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: address, error } = await supabase
      .from('addresses')
      .update(validated)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Address update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update address' },
        { status: 500 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully!',
      data: address,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Addresses PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const user = await getSessionUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if this is the default address
    const { data: address } = await supabase
      .from('addresses')
      .select('is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Address deletion error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete address' },
        { status: 500 }
      );
    }

    // If deleted address was default, set another as default
    if (address?.is_default) {
      const { data: otherAddresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (otherAddresses && otherAddresses.length > 0) {
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', otherAddresses[0].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}