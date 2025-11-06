import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ohmioijbzvhoydyhdkdk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

async function testExecSql() {
  console.log('Testing exec_sql function...\n');

  // Test with a simple query first
  const testQuery = 'SELECT 1 as test';

  console.log('Test query:', testQuery);
  const { data: testData, error: testError } = await supabase.rpc('exec_sql', {
    query: testQuery
  });

  console.log('Test result:', { data: testData, error: testError });

  if (testError) {
    console.error('\n❌ exec_sql function not accessible');
    console.error('Error:', testError);
    return;
  }

  console.log('\n✅ exec_sql is working!\n');

  // Now run the real policy SQL
  const policySql = `DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');`;

  console.log('Running policy SQL...\n');
  const { data, error } = await supabase.rpc('exec_sql', { query: policySql });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Success!');
  console.log('Result:', data);
}

testExecSql();
