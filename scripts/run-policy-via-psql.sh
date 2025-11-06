#!/bin/bash

# Run the anonymous upload policy directly via psql
# This bypasses the exec_sql function entirely

echo "🔧 Running anonymous upload policy via direct PostgreSQL connection..."
echo ""

POLICY_SQL="DROP POLICY IF EXISTS \"Allow anonymous uploads\" ON storage.objects;

CREATE POLICY \"Allow anonymous uploads\"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');"

echo "Policy SQL:"
echo "--------------------------------------------------------------------------------"
echo "$POLICY_SQL"
echo "--------------------------------------------------------------------------------"
echo ""

# Run using psql with service role key as password
# Note: Supabase uses the service role key as the database password
PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obWlvaWpienZob3lkeWhka2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc2MTk5NiwiZXhwIjoyMDc3MTIxOTk2fQ.tb9381pAgmz8jHSqvtDqHaRQDNhFPOmQsga7iY1m1j0" psql \
  -h db.ohmioijbzvhoydyhdkdk.supabase.co \
  -U postgres \
  -d postgres \
  -c "$POLICY_SQL"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Anonymous upload policy created successfully!"
  echo ""
  echo "You can now upload files up to 1GB without logging in."
else
  echo ""
  echo "❌ Failed to create policy"
  echo ""
  echo "Alternative: Run this SQL manually in Supabase Dashboard:"
  echo "https://supabase.com/dashboard/project/ohmioijbzvhoydyhdkdk/sql/new"
  echo ""
  echo "$POLICY_SQL"
fi
