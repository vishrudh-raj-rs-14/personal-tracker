# Quick Deployment Checklist

Follow these steps in order to deploy your app to Vercel.

## ✅ Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema run (`supabase/schema.sql`)
- [ ] Storage bucket created (`progress-photos`)
- [ ] Environment variables ready (Supabase URL and keys)

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# 1. Create a new repository on GitHub (don't initialize with README)

# 2. Add remote and push (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "Add New..." → "Project"**
3. **Import your GitHub repository**
4. **Add Environment Variables** (BEFORE clicking Deploy!):
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `VITE_VAPID_PUBLIC_KEY` = Your VAPID public key (optional, for push notifications)
5. **Click "Deploy"**
6. **Wait 2-3 minutes** for build to complete
7. **Visit your deployed app URL!**

### Step 3: Deploy Edge Functions

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Login
supabase login

# Link project (get project-ref from Supabase dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy morning-reminder
supabase functions deploy daily-checker
supabase functions deploy weekly-reminder
supabase functions deploy monthly-report
```

### Step 4: Configure Edge Function Secrets

In Supabase Dashboard → Settings → Edge Functions → Secrets, add:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY` (if using push notifications)
- `VAPID_PRIVATE_KEY` (if using push notifications)

### Step 5: Set Up Cron Jobs

See `README.md` for cron job setup instructions.

## 🎉 Done!

Your app is now live! Test it and share the URL.

## 📝 Notes

- Vercel automatically deploys on every push to `main` branch
- Environment variables are encrypted and secure
- Your app runs on HTTPS automatically (required for push notifications)
- Check Vercel dashboard for build logs and deployment status

