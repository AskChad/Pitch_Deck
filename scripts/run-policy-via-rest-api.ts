/**
 * Run anonymous upload policy using Supabase REST API
 * This bypasses exec_sql and uses direct API calls
 */

const SUPABASE_URL = 'https://ohmioijbzvhoydyhdkdk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0';

async function runPolicyViaRestApi() {
  console.log('🔧 Running anonymous upload policy via Supabase REST API...\n');

  const policySql = `
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');
  `.trim();

  console.log('Policy SQL:');
  console.log(policySql);
  console.log();

  try {
    // Try using the /rest/v1/rpc/exec_sql endpoint with proper headers
    console.log('Attempting to call exec_sql via REST API...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: policySql
      })
    });

    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('\n✅ SUCCESS! Anonymous upload policy created');
      return;
    } else {
      console.log('\n❌ REST API call failed');

      // Try alternative: Check if we can reload PostgREST schema
      console.log('\nTrying to reload PostgREST schema cache...');
      const reloadResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          channel: 'pgrst',
          payload: 'reload schema'
        })
      });

      if (reloadResponse.ok) {
        console.log('✅ Schema reload signal sent');
        console.log('Wait a few seconds and try running this script again.');
      } else {
        console.log('⚠️  Could not send schema reload signal');
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  // Print manual instructions
  console.log('\n' + '='.repeat(80));
  console.log('📋 ALTERNATIVE: MANUAL SQL EXECUTION');
  console.log('='.repeat(80));
  console.log('\nThe exec_sql function is not accessible via the API due to PostgREST');
  console.log('schema cache issues. To add the anonymous upload policy:');
  console.log('\n1. Go to: https://supabase.com/dashboard/project/ohmioijbzvhoydyhdkdk/sql/new');
  console.log('2. Paste this SQL:');
  console.log('\n' + '-'.repeat(80));
  console.log(policySql);
  console.log('-'.repeat(80));
  console.log('\n3. Click "Run"');
  console.log('\n4. You should see: "Success. No rows returned"');
  console.log('\nThis will enable anonymous file uploads to the pitch-deck-uploads bucket.\n');
}

runPolicyViaRestApi()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
