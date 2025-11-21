# Storage Bucket Setup Guide

## Method 1: Using Supabase Dashboard (Recommended)

Since storage policies require special permissions, it's easier to set them up through the Dashboard:

### Step 1: Create the Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **"New bucket"**
3. Configure:
   - **Name**: `progress-photos` (exactly this)
   - **Public bucket**: ❌ **Unchecked** (private)
   - **File size limit**: 5MB (or your preference)
   - **Allowed MIME types**: `image/*` (optional)
4. Click **"Create bucket"**

### Step 2: Set Up Policies via Dashboard

1. Go to **Storage** → **Policies** (or click on the `progress-photos` bucket)
2. Click **"New Policy"** or **"Add Policy"**

#### Policy 1: Allow Upload (INSERT)

1. Click **"New Policy"**
2. Select **"For full customization"** or **"Custom policy"**
3. Configure:
   - **Policy name**: `Users can upload own photos`
   - **Allowed operation**: `INSERT`
   - **Policy definition**: Paste this SQL:

```sql
(bucket_id = 'progress-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

4. Click **"Review"** then **"Save policy"**

#### Policy 2: Allow View (SELECT)

1. Click **"New Policy"**
2. Select **"For full customization"**
3. Configure:
   - **Policy name**: `Users can view own photos`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: Paste this SQL:

```sql
(bucket_id = 'progress-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

4. Click **"Review"** then **"Save policy"**

#### Policy 3: Allow Delete (DELETE)

1. Click **"New Policy"**
2. Select **"For full customization"**
3. Configure:
   - **Policy name**: `Users can delete own photos`
   - **Allowed operation**: `DELETE`
   - **Policy definition**: Paste this SQL:

```sql
(bucket_id = 'progress-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

4. Click **"Review"** then **"Save policy"**

## Method 2: Using SQL with Service Role (Advanced)

If you have access to the service role key, you can run this via the Supabase API or using a script:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'progress-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note**: This requires service role permissions and should be done carefully.

## Verification

After setting up policies:

1. Try uploading a photo in your app
2. Check that the file appears in Storage → `progress-photos` → `{your-user-id}/`
3. Verify you can only see your own folder

## Troubleshooting

### "Row-level security policy" error
- Make sure all 3 policies (INSERT, SELECT, DELETE) are created
- Verify the bucket name is exactly `progress-photos`
- Check that you're authenticated when uploading

### Can't see policies in dashboard
- Go to Storage → `progress-photos` → Policies tab
- Or use the SQL Editor to check: `SELECT * FROM storage.objects LIMIT 1;` (just to verify access)

### Files upload but can't view
- Check the SELECT policy is created
- Verify the file path matches `{user_id}/filename` format

