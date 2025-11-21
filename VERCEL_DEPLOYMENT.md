# Vercel Deployment Guide

Complete step-by-step guide to deploy your Fitness Habit Tracker to Vercel.

## Prerequisites

- ✅ Supabase project set up (database, storage, edge functions)
- ✅ GitHub account (free)
- ✅ Vercel account (free)

## Step 1: Prepare Your Code

### 1.1 Initialize Git Repository

If you haven't already, initialize git and commit your code:

```bash
# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Fitness Habit Tracker"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon → **"New repository"**
3. Fill in:
   - **Repository name**: `fitness-habit-tracker` (or your preferred name)
   - **Visibility**: Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

### 1.3 Push to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Sign Up / Login to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (or **"Log In"** if you have an account)
3. Sign up with GitHub (recommended for easy integration)

### 2.2 Import Your Project

1. Once logged in, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find your `fitness-habit-tracker` repository
4. Click **"Import"**

### 2.3 Configure Project Settings

Vercel should auto-detect Vite settings, but verify:

- **Framework Preset**: Vite (should be auto-detected)
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` (should be auto-filled)
- **Output Directory**: `dist` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

### 2.4 Add Environment Variables

**IMPORTANT**: Add these before deploying!

Click **"Environment Variables"** and add:

#### Required Variables:

1. **`VITE_SUPABASE_URL`**
   - Value: Your Supabase project URL
   - Example: `https://xxxxxxxxxxxxx.supabase.co`
   - Where to find: Supabase Dashboard → Settings → API → Project URL

2. **`VITE_SUPABASE_ANON_KEY`**
   - Value: Your Supabase anon/public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Where to find: Supabase Dashboard → Settings → API → Project API keys → anon → public

#### Optional (for Push Notifications):

3. **`VITE_VAPID_PUBLIC_KEY`**
   - Value: Your VAPID public key (if you set up push notifications)
   - Generate with: `npx web-push generate-vapid-keys`
   - Only add the **public** key here

**Make sure to:**
- ✅ Add to **Production**, **Preview**, and **Development** environments
- ✅ Click **"Save"** after adding each variable

### 2.5 Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://fitness-habit-tracker.vercel.app`

## Step 3: Post-Deployment Setup

### 3.1 Update Supabase Settings (if needed)

If you have any CORS or redirect URL restrictions:

1. Go to Supabase Dashboard → Settings → API
2. Add your Vercel URL to allowed origins (if required)

### 3.2 Test Your Deployment

1. Visit your Vercel URL
2. Try signing up/logging in
3. Test the dashboard
4. Check if everything works!

### 3.3 Set Up Custom Domain (Optional)

1. In Vercel project settings → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Step 4: Deploy Edge Functions to Supabase

Your frontend is deployed, but you still need to deploy the backend edge functions:

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase  # macOS
# Or see: https://github.com/supabase/cli#install-the-cli

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref
# Find project ref in Supabase dashboard URL: https://app.supabase.com/project/xxxxx

# Deploy all edge functions
supabase functions deploy morning-reminder
supabase functions deploy daily-checker
supabase functions deploy weekly-reminder
supabase functions deploy monthly-report
```

### 4.1 Add Edge Function Secrets

1. Go to Supabase Dashboard → Settings → Edge Functions → Secrets
2. Add:
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key (from Settings → API)
   - `VAPID_PUBLIC_KEY` = Your VAPID public key (if using push notifications)
   - `VAPID_PRIVATE_KEY` = Your VAPID private key (if using push notifications)

### 4.2 Set Up Cron Jobs

See `README.md` section "Configure Cron Jobs" for setting up scheduled reminders.

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Environment variable not found"**
- Double-check all environment variables are added in Vercel
- Make sure variable names start with `VITE_` for Vite apps

### App Doesn't Work After Deployment

**"Invalid API key" error**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check for extra spaces or quotes in environment variables

**404 errors on routes**
- Verify `vercel.json` has the rewrite rule for SPA routing
- Check that `outputDirectory` is set to `dist`

**Push notifications don't work**
- Make sure you're accessing via HTTPS (Vercel provides this automatically)
- Verify `VITE_VAPID_PUBLIC_KEY` is set
- Check browser console for errors

### Service Worker Not Working

- Make sure `public/sw.js` exists
- Check browser console for service worker registration errors
- Verify HTTPS is enabled (required for service workers)

## Continuous Deployment

Once set up, Vercel will automatically:
- ✅ Deploy on every push to `main` branch
- ✅ Create preview deployments for pull requests
- ✅ Show build logs and errors

## Updating Your App

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Vercel automatically deploys the new version!

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard
**Your Deployed App**: Check Vercel project page for URL
**Environment Variables**: Vercel Project → Settings → Environment Variables
**Build Logs**: Vercel Project → Deployments → Click on deployment

## Next Steps

After deployment:
1. ✅ Test all features
2. ✅ Set up push notifications (see `PUSH_NOTIFICATIONS_SETUP.md`)
3. ✅ Configure cron jobs for reminders
4. ✅ Share your app URL!

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Project Issues: Check GitHub repository

