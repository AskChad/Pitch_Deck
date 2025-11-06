/**
 * Complete storage setup: Create exec_sql function + storage bucket
 * Run with: npx tsx scripts/setup-storage-complete.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohmioijbzvhoydyhdkdk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  console.log('🚀 Setting up storage for 1GB file uploads...\n');

  console.log('Creating storage bucket...');

  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('pitch-deck-uploads', {
    public: true,
    fileSizeLimit: 1073741824, // 1GB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv'
    ]
  });

  if (bucketError) {
    if (bucketError.message?.includes('already exists')) {
      console.log('✅ Bucket already exists');
    } else {
      console.error('❌ Error creating bucket:', bucketError);
      throw bucketError;
    }
  } else {
    console.log('✅ Bucket created successfully!');
  }

  console.log('\n📦 Bucket: pitch-deck-uploads');
  console.log('📏 Max size: 1GB per file');
  console.log('🔓 Access: Public');
  console.log('\n✨ Storage setup complete!\n');
}

setupStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
