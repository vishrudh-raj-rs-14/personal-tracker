# Deployment Guide

## Quick Start

1. **Set up Supabase**
   - Create account at supabase.com
   - Create new project
   - Run `supabase/schema.sql` in SQL Editor
   - Create storage bucket `progress-photos`

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy weekly-reminder
   supabase functions deploy daily-checker
   supabase functions deploy monthly-report
   ```

4. **Set up Cron Jobs** (see README.md)

5. **Deploy to Vercel**
   - Connect GitHub repo
   - Add environment variables
   - Deploy!

## Environment Variables

Required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional (for push notifications):
- `VITE_VAPID_PUBLIC_KEY`

## Storage Bucket Setup

1. Go to Supabase Dashboard > Storage
2. Create bucket: `progress-photos`
3. Set to private
4. RLS policies are handled in schema.sql

## Testing Checklist

- [ ] User registration/login works
- [ ] Daily tracking saves correctly
- [ ] Calendar shows red/green dots
- [ ] Analytics charts render
- [ ] Photo upload works
- [ ] Goals can be set
- [ ] Dark mode toggles
- [ ] PWA installs on mobile
- [ ] Offline mode works

