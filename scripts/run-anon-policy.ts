import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ohmioijbzvhoydyhdkdk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0'
);

async function run() {
  const sql = `DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');`;

  console.log('Running SQL through exec_sql...\n');

  const { data, error } = await supabase.rpc('exec_sql', { query: sql });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Success!');
  console.log('Result:', data);
}

run();
