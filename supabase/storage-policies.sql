-- Storage Bucket Policies for progress-photos
-- 
-- ⚠️ IMPORTANT: This SQL cannot be run directly in SQL Editor due to permissions.
-- Use the Supabase Dashboard method instead (see STORAGE_SETUP.md)
--
-- This file is for reference only. To set up policies:
-- 1. Go to Storage → progress-photos → Policies tab
-- 2. Create policies via the Dashboard UI using the SQL below
-- OR use this SQL with service role key via API
--
-- Make sure the bucket is named exactly 'progress-photos'

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
-- Files are stored as: {user_id}/{filename}
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'progress-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

