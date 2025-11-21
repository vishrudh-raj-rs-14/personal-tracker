# Supabase Setup Guide

Complete step-by-step guide to set up Supabase for the Fitness Habit Tracker.

## Step 1: Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with GitHub (recommended) or email
4. Once logged in, click **"New Project"**
5. Fill in the project details:
   - **Name**: `fitness-habit-tracker` (or any name you prefer)
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is perfect to start
6. Click **"Create new project"**
7. Wait 2-3 minutes for the project to initialize

## Step 2: Get Your Credentials

Once your project is ready:

1. In your Supabase project dashboard, click on the **⚙️ Settings** icon (bottom left)
2. Click on **"API"** in the settings menu
3. You'll see two important values:

### Project URL
- Located under **"Project URL"**
- Looks like: `https://xxxxxxxxxxxxx.supabase.co`
- Copy this value

### Anon/Public Key
- Located under **"Project API keys"** → **"anon"** → **"public"**
- This is a long string starting with `eyJ...`
- Click the eye icon to reveal it, then copy it

### Service Role Key (for Edge Functions)
- Same section, under **"service_role"** → **"secret"**
- ⚠️ **IMPORTANT**: Never expose this in client-side code!
- Only use this in server-side code (Edge Functions)
- Copy this for later (you'll need it for cron jobs)

## Step 3: Add Credentials to Your Project

1. In your project root directory, create a file named `.env`:

```bash
# In terminal, from project root:
touch .env
```

2. Open `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzY5MjIwLCJleHAiOjE5NTczNDUyMjB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Replace the values with your actual credentials!**

3. Save the file

## Step 4: Set Up Database Schema

1. In Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy **ALL** the contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

This creates:
- All database tables (users, daily_logs, weekly_photos, foods, reminders_log)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for auto-updating timestamps

## Step 5: Set Up Storage Bucket

1. In Supabase dashboard, click on **"Storage"** in the left sidebar
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `progress-photos` (must be exactly this)
   - **Public bucket**: ❌ **Unchecked** (keep it private)
   - **File size limit**: 5MB (or your preference)
   - **Allowed MIME types**: `image/*` (or leave empty for all)
4. Click **"Create bucket"**

## Step 5b: Set Up Storage Bucket Policies

**IMPORTANT**: After creating the bucket, you must set up RLS policies for storage.

**⚠️ Note**: Storage policies cannot be created via SQL Editor due to permissions. Use the Dashboard method below.

### Option A: Using Dashboard (Recommended - Easiest)

1. Go to **Storage** → Click on **`progress-photos`** bucket
2. Click on the **"Policies"** tab
3. Click **"New Policy"** for each of the following:

**Policy 1: Upload (INSERT)**
- Policy name: `Users can upload own photos`
- Allowed operation: `INSERT`
- Policy definition:
```sql
(bucket_id = 'progress-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

**Policy 2: View (SELECT)**
- Policy name: `Users can view own photos`
- Allowed operation: `SELECT`
- Policy definition:
```sql
(bucket_id = 'progress-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

**Policy 3: Delete (DELETE)**
- Policy name: `Users can delete own photos`
- Allowed operation: `DELETE`
- Policy definition:
```sql
(bucket_id = 'progress-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

📖 **Detailed instructions**: See [STORAGE_SETUP.md](./STORAGE_SETUP.md) for step-by-step guide with screenshots.

## Step 6: Verify Setup

1. In your project, run:
```bash
npm install
npm run dev
```

2. Open `http://localhost:5173`
3. Try to sign up with a test email
4. If you can create an account and see the dashboard, setup is successful! ✅

## Step 7: (Optional) Set Up Edge Functions

For automated reminders, you'll need to deploy edge functions:

1. Install Supabase CLI:

**On macOS (using Homebrew - recommended):**
```bash
brew install supabase/tap/supabase
```

**On Linux/Windows or alternative methods:**
See the official installation guide: https://github.com/supabase/cli#install-the-cli

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```
   - Find your project ref in the Supabase dashboard URL: `https://app.supabase.com/project/xxxxx`
   - The `xxxxx` is your project ref

4. Deploy functions:
```bash
supabase functions deploy weekly-reminder
supabase functions deploy daily-checker
supabase functions deploy monthly-report
```

5. Set environment variables for functions:
   - In Supabase dashboard → Settings → Edge Functions
   - Add secrets:
     - `SUPABASE_URL` = your project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = your service role key

## Troubleshooting

### "Invalid API key" error
- Double-check you copied the **anon/public** key (not service_role)
- Make sure there are no extra spaces in `.env`
- Restart your dev server after changing `.env`

### "Row Level Security" errors
- Make sure you ran the complete `schema.sql` file
- Check that RLS is enabled: Go to Database → Tables → Check "RLS enabled" column

### "Bucket not found" error
- Verify the bucket is named exactly `progress-photos`
- Check bucket exists in Storage section

### "Row-level security policy" error when uploading photos
- Make sure you ran `supabase/storage-policies.sql` after creating the bucket
- Verify storage policies exist: Go to Storage → progress-photos → Policies
- Check that policies allow INSERT for authenticated users

### Can't sign up/login
- Check browser console for errors
- Verify your Supabase URL and key are correct
- Make sure email confirmation is disabled (or check your email)

## Quick Reference

**Where to find credentials:**
- Settings → API → Project URL
- Settings → API → Project API keys → anon public

**Files to update:**
- `.env` (create this file in project root)

**Required values:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Optional (for edge functions):**
- `SUPABASE_SERVICE_ROLE_KEY` (only in Supabase dashboard secrets, never in `.env`)

## Security Notes

✅ **Safe to expose:**
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_ANON_KEY` - Public key (protected by RLS)

❌ **Never expose:**
- Service Role Key - Only use in server-side code
- Database Password - Only needed for direct DB access

The anon key is safe to use in client-side code because Row Level Security (RLS) policies ensure users can only access their own data.

