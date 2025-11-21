# Quick Start Guide

Get your Fitness Habit Tracker up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (note the project URL and anon key)
3. In the SQL Editor, paste and run the contents of `supabase/schema.sql`
4. Go to Storage and create a bucket named `progress-photos` (private)

## Step 3: Configure Environment

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` and start tracking!

## Next Steps

- Set up edge functions for reminders (see README.md)
- Configure cron jobs for automated reminders
- Deploy to Vercel for production

## Troubleshooting

**"Not authenticated" errors:**
- Make sure you've signed up/logged in
- Check that RLS policies are enabled in Supabase

**Photo upload fails:**
- Verify the `progress-photos` bucket exists
- Check bucket is set to private with RLS enabled

**Charts not showing:**
- Make sure you have some daily logs entered
- Check browser console for errors

