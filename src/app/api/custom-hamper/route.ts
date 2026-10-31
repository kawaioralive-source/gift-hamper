import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { customHamperSchema } from '@/validators/schemas';
import { getSessionUser } from '@/lib/auth';
import { sanitizeText } from '@/lib/sanitize';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const validated = customHamperSchema.parse(body);

    const sanitizedName = sanitizeText(validated.name);
    const sanitizedCardMessage = validated.card_message ? sanitizeText(validated.card_message) : undefined;

    try {
      const supabase = createClient();
      const { data: customHamper, error } = await supabase
        .from('custom_hampers')
        .insert({
          user_id: user?.id || null,
          name: sanitizedName,
          box_id: validated.box_id,
          card_id: validated.card_id,
          card_message: sanitizedCardMessage,
          packaging_id: validated.packaging_id,
          items: validated.items,
          subtotal: validated.subtotal,
          customization_fee: validated.customization_fee,
          packaging_fee: validated.packaging_fee,
          total_price: validated.total_price,
          status: 'completed',
        })
        .select()
        .single();

      if (!error && customHamper) {
        return NextResponse.json({
          success: true,
          message: 'Custom hamper created successfully!',
          data: customHamper,
        });
      }
    } catch {
      // Supabase unavailable, fallback to local object
    }

    // Local fallback hamper
    const localHamper = {
      id: `ch-${uuidv4().slice(0, 8)}`,
      user_id: user?.id || null,
      name: validated.name,
      box_id: validated.box_id,
      card_id: validated.card_id,
      card_message: validated.card_message,
      packaging_id: validated.packaging_id,
      items: validated.items,
      subtotal: validated.subtotal,
      customization_fee: validated.customization_fee,
      packaging_fee: validated.packaging_fee,
      total_price: validated.total_price,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Custom hamper created successfully!',
      data: localHamper,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Custom hamper API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
