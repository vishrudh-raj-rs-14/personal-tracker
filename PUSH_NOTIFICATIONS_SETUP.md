# Push Notifications Setup Guide

This guide explains how to set up push notifications so you receive reminders on your phone at 8 AM and 9 PM.

## How Push Notifications Work

1. **User enables notifications** in the Settings page
2. **Browser requests permission** and creates a push subscription
3. **Subscription is saved** to the database
4. **Edge functions send notifications** at scheduled times (8 AM and 9 PM)
5. **Phone receives notification** even if the app is closed

## Step 1: Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using Node.js:

### Option A: Using npx (Recommended)

```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: <your-public-key>
Private Key: <your-private-key>
```

### Option B: Using Node.js script

Create a file `generate-vapid-keys.js`:

```javascript
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

Run it:
```bash
node generate-vapid-keys.js
```

## Step 2: Add VAPID Keys to Environment

### For Frontend (.env file)

Add the **public key** to your `.env` file:

```env
VITE_VAPID_PUBLIC_KEY=your-public-key-here
```

**Important**: Only the public key goes in `.env` (it's safe to expose).

### For Edge Functions (Supabase Dashboard)

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add two secrets:

   - **Name**: `VAPID_PUBLIC_KEY`
     **Value**: Your public key

   - **Name**: `VAPID_PRIVATE_KEY`
     **Value**: Your private key

   ⚠️ **Keep the private key secret!** Never commit it to git or expose it in client-side code.

## Step 3: Update Edge Function Contact Email

In both edge functions (`morning-reminder` and `daily-checker`), update the contact email:

```typescript
webPush.setVapidDetails(
  'mailto:your-email@example.com', // ← Change this to your email
  vapidPublicKey,
  vapidPrivateKey
)
```

## Step 4: Enable Notifications in App

1. **Deploy your app** (or run locally)
2. **Open the app** in your browser
3. **Go to Settings** page
4. **Toggle "Push Notifications"** ON
5. **Allow notifications** when your browser prompts you

## Step 5: Test Notifications

### Test Morning Reminder (8 AM)

The cron job runs at 8 AM UTC. To test immediately:

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on `morning-reminder`
3. Click **"Invoke"** button
4. You should receive a push notification!

### Test Evening Reminder (9 PM)

Same process, but invoke `daily-checker` function.

## Troubleshooting

### "Push notifications are not supported"
- Make sure you're using a modern browser (Chrome, Firefox, Edge, Safari 16+)
- Ensure you're accessing the app via HTTPS (required for push notifications)
- Localhost works for development, but production must be HTTPS

### "Permission denied"
- Check browser settings → Notifications
- Make sure notifications are allowed for your site
- Try clearing site data and re-enabling

### "VAPID public key not configured"
- Check that `VITE_VAPID_PUBLIC_KEY` is in your `.env` file
- Restart your dev server after adding it
- Make sure there are no extra spaces or quotes

### Notifications not received
- Check that VAPID keys are set in Supabase Edge Functions secrets
- Verify the cron jobs are scheduled correctly
- Check Edge Functions logs in Supabase Dashboard
- Make sure you enabled notifications in the Settings page

### Notifications work on desktop but not phone
- Make sure you installed the PWA on your phone
- Check that notifications are enabled in phone settings
- Some browsers on mobile don't support push notifications

## How It Works on Your Phone

1. **Install the PWA** on your phone (Add to Home Screen)
2. **Enable notifications** in the app Settings
3. **Allow browser notifications** when prompted
4. **Receive notifications** at 8 AM and 9 PM, even when the app is closed!

## Security Notes

- ✅ **Public VAPID key**: Safe to expose in frontend code
- ❌ **Private VAPID key**: Must be kept secret, only in Edge Functions
- ✅ **Push subscriptions**: Stored securely in database with RLS
- ✅ **Notifications**: Only sent to authenticated users who opted in

## Browser Support

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Firefox (Android & Desktop)
- ✅ Safari 16+ (iOS & macOS)
- ❌ Safari < 16 (no push support)
- ❌ Some mobile browsers

## Next Steps

After setup:
1. Test notifications work
2. Set up cron jobs (see README.md)
3. Deploy to production
4. Enable notifications on your phone!

