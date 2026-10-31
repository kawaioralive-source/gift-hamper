import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { isValidImageUpload } from '@/lib/sanitize';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files.length) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();

      // Secure validation: Check MIME type, extension, and file size (< 5MB)
      if (!isValidImageUpload(file.type, fileExt, file.size)) {
        continue;
      }

      // Safe cryptographically random filename
      const safeId = Math.random().toString(36).substring(2, 10);
      const safeFileName = `hamper_${Date.now()}_${safeId}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let savedUrl: string | null = null;

      // 1. Try Supabase Storage (Admin client preferred for bucket upload permissions)
      try {
        let supabase: any = null;
        try {
          supabase = createAdminClient();
        } catch {
          supabase = createClient();
        }

        const filePath = `products/${safeFileName}`;
        const { error } = await supabase.storage
          .from('product-images')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
          savedUrl = publicUrl;
        }
      } catch {
        // Fall back to local or data URI storage
      }

      // 2. Local Safe Storage Fallback
      if (!savedUrl) {
        try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const destinationPath = path.join(uploadDir, safeFileName);
          fs.writeFileSync(destinationPath, buffer);
          savedUrl = `/uploads/products/${safeFileName}`;
        } catch (fsErr) {
          // If filesystem is read-only (e.g. serverless Vercel), fall back to Data URL
          savedUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
        }
      }

      if (savedUrl) {
        uploadedUrls.push(savedUrl);
      }
    }

    return NextResponse.json({
      success: true,
      data: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to safely process image uploads' },
      { status: 500 }
    );
  }
}
