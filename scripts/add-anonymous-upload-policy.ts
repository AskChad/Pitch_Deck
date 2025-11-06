/**
 * Add anonymous upload policy to storage bucket
 * Run with: npx tsx scripts/add-anonymous-upload-policy.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohmioijbzvhoydyhdkdk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAnonymousUploadPolicy() {
  console.log('🚀 Adding anonymous upload policy...\n');

  const sql = `
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');
  `;

  try {
    console.log('Calling exec_sql function...\n');

    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('❌ Error:', error);
      throw error;
    }

    console.log('✅ Anonymous upload policy added successfully!');
    console.log('Response:', data);
    console.log('\n📦 Anyone can now upload files to the bucket (no login required)\n');

    return data;
  } catch (error: any) {
    console.error('❌ Failed to add policy:', error.message);
    throw error;
  }
}

addAnonymousUploadPolicy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
