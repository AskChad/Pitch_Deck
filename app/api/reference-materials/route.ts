import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all reference materials for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');
    const fileType = searchParams.get('fileType');

    let query = supabase
      .from('reference_materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (deckId) {
      query = query.eq('deck_id', deckId);
    }

    if (fileType) {
      query = query.eq('file_type', fileType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching reference materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference materials' },
      { status: 500 }
    );
  }
}
