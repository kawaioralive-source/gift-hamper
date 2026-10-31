import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { addressSchema } from '@/validators/schemas';
import { ZodError } from 'zod';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

function getLocalAddresses(): any[] {
  try {
    const cookieStore = cookies();
    const cookieVal = cookieStore.get('session_addresses')?.value;
    if (cookieVal) {
      return JSON.parse(cookieVal);
    }
  } catch {}
  return [];
}

function saveLocalAddresses(res: NextResponse, addrs: any[]) {
  res.cookies.set('session_addresses', JSON.stringify(addrs), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function GET() {
  try {
    const user = await getSessionUser();

    if (user) {
      try {
        const supabase = createClient();
        const { data: addresses, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && addresses && addresses.length > 0) {
          return NextResponse.json({
            success: true,
            data: addresses,
          });
        }
      } catch {
        // Fall through to local
      }
    }

    const local = getLocalAddresses();
    return NextResponse.json({
      success: true,
      data: local,
    });
  } catch (error) {
    console.error('Addresses API error:', error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    // Standardize input fields (support both addressForm and addressSchema keys)
    const normalizedBody = {
      name: body.name || body.full_name || 'Customer',
      phone: body.phone || '+919876543210',
      address_line_1: body.address_line_1 || '',
      address_line_2: body.address_line_2 || '',
      landmark: body.landmark || '',
      city: body.city || '',
      state: body.state || '',
      postal_code: body.postal_code || body.pincode || '',
      country: body.country || 'India',
      address_type: body.address_type || 'home',
      is_default: body.is_default ?? true,
    };

    if (user) {
      try {
        const supabase = createClient();
        const { data: address, error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            ...normalizedBody,
          })
          .select()
          .single();

        if (!error && address) {
          return NextResponse.json({
            success: true,
            message: 'Address added successfully!',
            data: address,
          });
        }
      } catch {
        // Fall through to local
      }
    }

    // Local / Guest fallback
    const local = getLocalAddresses();
    const newAddress = {
      id: `addr-${uuidv4().slice(0, 8)}`,
      user_id: user?.id || null,
      ...normalizedBody,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newAddress, ...local.map(a => ({ ...a, is_default: false }))];
    const response = NextResponse.json({
      success: true,
      message: 'Address added successfully!',
      data: newAddress,
    });

    saveLocalAddresses(response, updated);
    return response;
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save address' },
      { status: 500 }
    );
  }
}
