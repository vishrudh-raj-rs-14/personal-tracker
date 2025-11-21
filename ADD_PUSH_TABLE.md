# Fix: Add Push Subscriptions Table

You're getting the error: "Could not find the table 'public.push_subscriptions' in the schema cache"

This means the `push_subscriptions` table doesn't exist in your Supabase database yet.

## Quick Fix

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase Dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Run the SQL

Copy and paste this entire SQL script:

```sql
-- Push subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON push_subscriptions;

-- RLS policies for push_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 3: Execute

1. Click **"Run"** (or press Cmd/Ctrl + Enter)
2. You should see: **"Success. No rows returned"**

### Step 4: Verify

1. Go to **Database** → **Tables**
2. You should see `push_subscriptions` in the list
3. Click on it to verify the columns are correct

### Step 5: Test Again

1. Go back to your deployed app
2. Go to **Settings**
3. Try enabling **Push Notifications** again
4. It should work now! ✅

## Alternative: Use the SQL File

You can also use the file `supabase/add-push-subscriptions.sql`:

1. Open the file in your project
2. Copy all the contents
3. Paste into Supabase SQL Editor
4. Run it

## Troubleshooting

**Error: "relation 'users' does not exist"**
- Make sure you've run the main `supabase/schema.sql` first
- The `users` table must exist before creating `push_subscriptions`

**Error: "policy already exists"**
- The DROP POLICY statements should handle this, but if you still get errors:
- Go to **Database** → **Tables** → `push_subscriptions` → **Policies**
- Delete any existing policies manually
- Then run the SQL again

**Still getting the error after running SQL**
- Clear your browser cache
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Try again

## What This Does

This creates:
- ✅ `push_subscriptions` table to store user push notification subscriptions
- ✅ Row Level Security (RLS) enabled for security
- ✅ Policies so users can only manage their own subscriptions

After running this, push notifications should work!

