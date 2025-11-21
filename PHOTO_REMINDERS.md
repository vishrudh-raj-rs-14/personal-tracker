# Weekly Photo Reminders

This document explains how weekly photo reminders work in the Fitness Habit Tracker app.

## Overview

The app now includes two types of weekly photo reminders:
1. **Push Notifications** - Sent via web push notifications (if enabled)
2. **In-App Notifications** - Toast notifications shown when the app is open

## How It Works

### Push Notifications

The weekly reminder edge function (`supabase/functions/weekly-reminder/index.ts`) runs every Monday at 7 AM (configured via cron job). It:

1. Checks if the user has uploaded photos for the current week
2. Sends a push notification with one of two messages:
   - **If photos exist**: "Great job! You've uploaded X photo(s) this week. Keep tracking your progress! 📸"
   - **If no photos**: "📸 Weekly Photo Reminder: Don't forget to upload your progress photo this week! Track your transformation over time."

3. The notification includes:
   - Title: "Weekly Photo Reminder 📸" or "Weekly Check-in ✅"
   - Body: Personalized message based on photo status
   - Action: Clicking opens the `/photos` page

### In-App Notifications

The `usePhotoReminder` hook automatically checks when the app loads:

1. Checks if the user has uploaded photos for the current week
2. Shows a toast notification if no photos are found
3. Only shows once per browser session (uses `sessionStorage`)
4. Waits 2 seconds after page load to ensure photos have loaded

### Visual Reminder Banner

The Photos page (`/photos`) displays a prominent banner at the top if:
- The user hasn't uploaded any photos for the current week
- The banner includes:
  - Alert icon
  - Reminder message
  - "Upload Photo Now" button

## Setup

### 1. Cron Job Configuration

The weekly reminder is scheduled via Supabase's `pg_cron` extension:

```sql
SELECT cron.schedule(
  'weekly-reminder',
  '0 7 * * 1',  -- Every Monday at 7 AM
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/weekly-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

### 2. Environment Variables

Make sure these are set in your Supabase Edge Function environment:
- `VAPID_PUBLIC_KEY` - Your VAPID public key
- `VAPID_PRIVATE_KEY` - Your VAPID private key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

### 3. Update Email in Function

In `supabase/functions/weekly-reminder/index.ts`, update line 97:
```typescript
'mailto:vishrudh.shrinivas@gmail.com', // Change to your actual email
```

## User Experience

### When User Has Photos
- Push notification: Encouraging message about their progress
- No in-app toast (since they've already uploaded)
- No banner on photos page

### When User Hasn't Uploaded Photos
- Push notification: Reminder to upload photos
- In-app toast: Shows once per session when app opens
- Banner: Always visible on photos page until photos are uploaded

## Testing

To test the reminders:

1. **Push Notifications**:
   - Ensure push notifications are enabled in Settings
   - Wait for Monday 7 AM, or manually trigger the edge function
   - Check that notification appears on your device

2. **In-App Notifications**:
   - Clear `sessionStorage` in browser console: `sessionStorage.removeItem('photo-reminder-shown')`
   - Refresh the app
   - Should see toast notification after 2 seconds if no photos for current week

3. **Visual Banner**:
   - Navigate to `/photos` page
   - Banner should appear if no photos uploaded for current week
   - Upload a photo and banner should disappear

## Code Files

- **Edge Function**: `supabase/functions/weekly-reminder/index.ts`
- **Hook**: `src/hooks/use-photo-reminder.ts`
- **Photos Page**: `src/pages/photos.tsx` (includes banner)
- **App Integration**: `src/App.tsx` (includes hook)

## Notes

- Reminders are sent weekly on Mondays at 7 AM
- In-app notifications only show once per browser session
- The banner on the photos page updates in real-time when photos are uploaded
- Push notifications require the user to have enabled push notifications in Settings

