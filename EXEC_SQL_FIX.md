# Fix exec_sql Function Accessibility Issue

## Problem

The `exec_sql` function exists in the database but PostgREST cannot find it in the schema cache.

**Error**: `PGRST202: Could not find the function public.exec_sql(query) in the schema cache`

## Root Cause

PostgREST maintains a schema cache that needs to be refreshed when new functions are added. The function may have been created but PostgREST hasn't detected it yet.

## Solution Options

### Option 1: Recreate exec_sql with PostgREST visibility (RECOMMENDED)

Run this SQL in Supabase SQL Editor to ensure exec_sql is properly exposed to PostgREST:

```sql
-- Drop and recreate exec_sql function with proper visibility
DROP FUNCTION IF EXISTS public.exec_sql(text);

CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant permissions for all roles
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- Wait a moment, then run the anonymous upload policy
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');
```

### Option 2: Run policy directly without exec_sql (SIMPLER)

Just run the policy SQL directly in Supabase SQL Editor:

```sql
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'pitch-deck-uploads');
```

### Option 3: Reload PostgREST manually

1. Go to Supabase Dashboard
2. Navigate to Project Settings → Database
3. Look for PostgREST settings or restart options
4. After reload, run: `npx tsx scripts/run-policy-via-rest-api.ts`

## How to Execute

### Using Supabase SQL Editor (Easiest):

1. Go to: https://supabase.com/dashboard/project/ohmioijbzvhoydyhdkdk/sql/new
2. Copy and paste **Option 1** SQL above (all of it)
3. Click "Run"
4. You should see: "Success. No rows returned"

### Verify it worked:

Run this test script:

```bash
npx tsx scripts/exec-sql-test.ts
```

If exec_sql is working, you'll see: `✅ exec_sql is working!`

## What This Enables

Once the anonymous upload policy is in place:
- Users can upload files up to 1GB without logging in
- Files are uploaded directly to Supabase Storage from the browser
- API routes receive file paths instead of file content (bypassing Vercel's 4.5MB limit)
- The pitch deck generation can handle large reference documents
