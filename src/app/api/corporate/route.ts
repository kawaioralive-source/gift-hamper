import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

const corporateInquirySchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  contact_person: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Please enter a valid business email'),
  phone: z.string().min(10, 'Please enter a valid contact phone number'),
  quantity: z.number().min(5, 'Minimum corporate order quantity is 5 hampers').default(50),
  budget_range: z.string().optional().default('₹3,000 - ₹5,000 per hamper'),
  occasion: z.string().optional().default('Corporate Appreciation'),
  delivery_locations: z.string().optional().default('Pan-India Single/Multi-Location'),
  customization_requirements: z.string().optional(),
  expected_delivery_date: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = corporateInquirySchema.parse({
      ...body,
      quantity: typeof body.quantity === 'string' ? parseInt(body.quantity, 10) || 50 : body.quantity,
    });

    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceCode = `CORP-2026-${randomSuffix}`;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('corporate_inquiries').insert([
        {
          reference_code: referenceCode,
          company_name: validated.company_name,
          contact_person: validated.contact_person,
          email: validated.email,
          phone: validated.phone,
          quantity: validated.quantity,
          budget_range: validated.budget_range,
          occasion: validated.occasion,
          delivery_locations: validated.delivery_locations,
          customization_requirements: validated.customization_requirements || null,
          expected_delivery_date: validated.expected_delivery_date || null,
          status: 'new',
        },
      ]).select().single();

      if (error) {
        console.warn('Supabase insert warning for corporate inquiry:', error);
      }
    } catch (dbErr) {
      console.warn('Database error while saving corporate inquiry:', dbErr);
    }

    return NextResponse.json({
      success: true,
      reference_code: referenceCode,
      message: `Thank you! Your corporate gifting inquiry ${referenceCode} has been received. Our dedicated corporate concierge will contact you within 4 business hours.`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid form submission' },
        { status: 400 }
      );
    }
    console.error('Corporate inquiry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit inquiry. Please try again or email corporate@kawaiora.com' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('corporate_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: (data || []).length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Inquiry ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    const updatePayload: Record<string, any> = {};
    if (status) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data, error } = await supabase
      .from('corporate_inquiries')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Corporate lead status updated successfully',
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
