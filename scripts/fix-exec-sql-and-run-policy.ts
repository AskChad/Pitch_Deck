/**
 * Fix exec_sql accessibility and run anonymous upload policy
 * This script tries multiple approaches to make exec_sql work
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohmioijbzvhoydyhdkdk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runPolicy() {
  console.log('🔧 Attempting to fix exec_sql and run anonymous upload policy...\n');

  // The policy SQL we need to run
  const policySql = `
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');
  `.trim();

  console.log('Policy SQL to execute:');
  console.log(policySql);
  console.log();

  // Approach 1: Try to reload PostgREST schema cache first
  console.log('Approach 1: Trying to reload PostgREST schema cache...');
  try {
    // PostgREST listens for NOTIFY pgrst, 'reload schema' to reload cache
    const result = await supabase.rpc('exec_sql', {
      query: "NOTIFY pgrst, 'reload schema';"
    });

    const { data: reloadData, error: reloadError } = result;

    if (!reloadError) {
      console.log('✅ Schema cache reload signal sent');
      // Wait a moment for cache to reload
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('⚠️  Could not send reload signal:', reloadError.message);
    }
  } catch (e: any) {
    console.log('⚠️  Schema reload failed:', e.message);
  }

  // Approach 2: Try exec_sql directly
  console.log('\nApproach 2: Trying exec_sql function...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: policySql });

    if (error) {
      console.log('❌ exec_sql failed:', error.message);
      console.log('Error code:', error.code);
    } else {
      console.log('✅ SUCCESS! Policy created via exec_sql');
      console.log('Result:', data);
      return;
    }
  } catch (e: any) {
    console.log('❌ exec_sql exception:', e.message);
  }

  // Approach 3: Try using direct SQL endpoint (if available)
  console.log('\nApproach 3: Trying direct SQL execution via storage admin...');
  try {
    // Use storage admin endpoint to run SQL
    const { data, error } = await supabase
      .from('_sql')
      .select('*')
      .single();

    if (!error) {
      console.log('Found _sql endpoint');
    }
  } catch (e: any) {
    console.log('⚠️  No direct SQL endpoint available');
  }

  // Approach 4: Manual instruction
  console.log('\n' + '='.repeat(80));
  console.log('📋 MANUAL STEPS REQUIRED:');
  console.log('='.repeat(80));
  console.log('\nThe exec_sql function exists but is not accessible via PostgREST API.');
  console.log('This is a PostgREST schema cache issue.');
  console.log('\nTo fix this, you need to:');
  console.log('\n1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ohmioijbzvhoydyhdkdk');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Click "New query"');
  console.log('4. Paste this SQL and click "Run":');
  console.log('\n' + '-'.repeat(80));
  console.log(policySql);
  console.log('-'.repeat(80));
  console.log('\n5. After running, the anonymous uploads will be enabled\n');
  console.log('Alternative: Try restarting the PostgREST service in Supabase settings');
  console.log('to refresh the schema cache, then run this script again.\n');
}

runPolicy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
