import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET a specific reference material
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('reference_materials')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Reference material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching reference material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference material' },
      { status: 500 }
    );
  }
}

// DELETE a reference material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the reference material to get the storage path
    const { data: material, error: fetchError } = await supabase
      .from('reference_materials')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !material) {
      return NextResponse.json(
        { error: 'Reference material not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase
      .storage
      .from('reference-materials')
      .remove([material.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue anyway to delete database record
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('reference_materials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reference material:', error);
    return NextResponse.json(
      { error: 'Failed to delete reference material' },
      { status: 500 }
    );
  }
}

// PATCH update reference material metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { deck_id, tags, notes } = body;

    const updates: any = {};
    if (deck_id !== undefined) updates.deck_id = deck_id;
    if (tags !== undefined) updates.tags = tags;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('reference_materials')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Reference material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating reference material:', error);
    return NextResponse.json(
      { error: 'Failed to update reference material' },
      { status: 500 }
    );
  }
}
