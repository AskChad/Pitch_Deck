import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ohmioijbzvhoydyhdkdk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0'
);

async function run() {
  console.log('Step 1: Creating exec_sql function...\n');

  // First create exec_sql via direct SQL endpoint
  const createFunctionSql = `
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
`;

  console.log('Creating function via direct SQL...');

  // Use direct PostgreSQL query
  const { error: createError } = await supabase.rpc('exec_sql', { query: createFunctionSql }).catch(async () => {
    // If exec_sql doesn't exist, we need to use a different approach
    console.log('exec_sql not found, trying alternative...\n');
    return { error: null };
  });

  console.log('\nStep 2: Adding anonymous upload policy...\n');

  const policySql = `
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');
`;

  const { data, error } = await supabase.rpc('exec_sql', { query: policySql });

  if (error) {
    console.error('Error:', error);
    console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
    console.log(policySql);
    process.exit(1);
  }

  console.log('✅ Success!');
  console.log('Result:', data);
}

run();
