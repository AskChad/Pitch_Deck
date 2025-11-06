-- Create storage bucket for pitch deck file uploads
-- Supports files up to 1GB

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitch-deck-uploads',
  'pitch-deck-uploads',
  true,
  1073741824, -- 1GB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'text/csv']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pitch-deck-uploads');

-- Policy: Allow authenticated users to read their own files
CREATE POLICY IF NOT EXISTS "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'pitch-deck-uploads');

-- Policy: Allow public reads (so API can access files)
CREATE POLICY IF NOT EXISTS "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pitch-deck-uploads');

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'pitch-deck-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
