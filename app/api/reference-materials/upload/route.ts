import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFileCategory } from '@/types/reference';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const deckId = formData.get('deckId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${timestamp}-${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('reference-materials')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('reference-materials')
      .getPublicUrl(storagePath);

    // Save metadata to database
    const fileCategory = getFileCategory(file.type);
    const { data: referenceMaterial, error: dbError } = await supabase
      .from('reference_materials')
      .insert({
        user_id: user.id,
        deck_id: deckId,
        file_name: file.name,
        file_type: fileCategory,
        file_size: file.size,
        storage_path: storagePath,
        storage_url: urlData.publicUrl,
        mime_type: file.type,
        metadata: {
          original_name: file.name,
          uploaded_at: new Date().toISOString(),
        },
        tags: [],
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabase.storage
        .from('reference-materials')
        .remove([storagePath]);

      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json(referenceMaterial, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
