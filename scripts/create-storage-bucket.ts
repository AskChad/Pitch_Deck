/**
 * Create Supabase Storage Bucket for file uploads
 * Run with: npx tsx scripts/create-storage-bucket.ts
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

async function createStorageBucket() {
  console.log('🚀 Creating storage bucket for file uploads...\n');

  try {
    // Create the bucket using the storage API
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
      // Bucket might already exist
      if (bucketError.message?.includes('already exists')) {
        console.log('⚠️  Bucket already exists, updating settings...');

        // Try to update bucket settings
        const { error: updateError } = await supabase.storage.updateBucket('pitch-deck-uploads', {
          public: true,
          fileSizeLimit: 1073741824,
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown',
            'text/csv'
          ]
        });

        if (updateError) {
          console.log('⚠️  Could not update bucket:', updateError.message);
        } else {
          console.log('✅ Bucket settings updated!');
        }
      } else {
        console.error('❌ Error creating bucket:', bucketError);
        throw bucketError;
      }
    } else {
      console.log('✅ Bucket created successfully!');
    }

    console.log('\n📦 Bucket name: pitch-deck-uploads');
    console.log('📏 Max file size: 1GB');
    console.log('🔓 Public access: enabled');
    console.log('\n✨ You can now upload files up to 1GB!\n');

    return bucket;
  } catch (error: any) {
    console.error('❌ Failed to create storage bucket:', error.message);
    throw error;
  }
}

// Run the script
createStorageBucket()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
