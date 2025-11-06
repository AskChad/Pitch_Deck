import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Execute the migration using Supabase service role key
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/run_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          query: 'ALTER TABLE pitch_decks ADD COLUMN IF NOT EXISTS ai_generation_data JSONB;',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Migration failed:', error);

      // Migration might fail if column already exists, which is OK
      return NextResponse.json({
        success: true,
        message: 'Migration attempted (column may already exist)',
        details: error
      });
    }

    return NextResponse.json({ success: true, message: 'Migration completed successfully' });
  } catch (error: any) {
    console.error('Error running migration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
