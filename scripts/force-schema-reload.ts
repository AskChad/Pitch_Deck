/**
 * Attempt to force PostgREST schema cache reload
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ohmioijbzvhoydyhdkdk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0'
);

async function forceReload() {
  console.log('Attempting to force PostgREST schema reload...\n');

  // Try different approaches to reload the schema

  // Approach 1: Check if pg_notify function exists
  console.log('1. Checking for pg_notify function...');
  const { data: notifyData, error: notifyError } = await supabase
    .rpc('pg_notify', { channel: 'pgrst', payload: 'reload schema' })
    .then(res => res, err => ({ data: null, error: err }));

  if (!notifyError) {
    console.log('   ✅ pg_notify sent');
  } else {
    console.log('   ❌ pg_notify failed:', notifyError.message);
  }

  // Approach 2: Check PostgREST status
  console.log('\n2. Checking PostgREST API status...');
  try {
    const response = await fetch('https://ohmioijbzvhoydyhdkdk.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjE5OTYsImV4cCI6MjA3NzEyMTk5Nn0.lATqgywpnr1RmtfG4K3X-fxGTlBvNJxrQpW44nvHXBk'
      }
    });
    const headers = Array.from(response.headers.entries());
    console.log('   PostgREST status:', response.status);
    const schemaHeader = headers.find(([key]) => key.toLowerCase() === 'content-profile');
    if (schemaHeader) {
      console.log('   Schema profile:', schemaHeader[1]);
    }
  } catch (e: any) {
    console.log('   ❌ Could not check status:', e.message);
  }

  // Approach 3: List available RPC functions
  console.log('\n3. Checking available RPC functions...');
  const { data: functionsData, error: functionsError } = await supabase
    .from('pg_proc')
    .select('proname')
    .limit(10)
    .then(res => res, () => ({ data: null, error: { message: 'Cannot query pg_proc' } }));

  if (functionsData) {
    console.log('   Found functions:', functionsData.map((f: any) => f.proname).join(', '));
  } else {
    console.log('   ❌ Cannot list functions');
  }

  console.log('\n' + '='.repeat(80));
  console.log('NEXT STEPS:');
  console.log('='.repeat(80));
  console.log('\nPostgREST schema cache takes a few minutes to refresh automatically.');
  console.log('\nOption 1: Wait 2-3 minutes and run the test again:');
  console.log('  npx tsx scripts/exec-sql-test.ts');
  console.log('\nOption 2: Restart PostgREST manually in Supabase Dashboard:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/ohmioijbzvhoydyhdkdk/settings/api');
  console.log('  2. Look for "Restart" or "Reload" option');
  console.log('  3. After restart, run: npx tsx scripts/exec-sql-test.ts');
  console.log('\nOption 3: Skip exec_sql and verify the policy was created:');
  console.log('  The anonymous upload policy should already be active.');
  console.log('  Try uploading a file at: https://pitch-deck-kappa.vercel.app/create-ai');
  console.log();
}

forceReload()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
