# API Documentation

## Authentication

All API calls use Supabase client-side SDK. Authentication is handled through Supabase Auth.

### Sign Up
```typescript
await supabase.auth.signUp({ email, password })
```

### Sign In
```typescript
await supabase.auth.signInWithPassword({ email, password })
```

### Magic Link
```typescript
await supabase.auth.signInWithOtp({ email })
```

### Sign Out
```typescript
await supabase.auth.signOut()
```

## Database Tables

### users
- **GET**: `supabase.from('users').select('*').eq('id', userId).single()`
- **UPDATE**: `supabase.from('users').update(data).eq('id', userId)`

### daily_logs
- **GET**: `supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', date).single()`
- **GET (range)**: `supabase.from('daily_logs').select('*').eq('user_id', userId).gte('date', start).lte('date', end)`
- **INSERT**: `supabase.from('daily_logs').insert({ user_id, date, ...data })`
- **UPDATE**: `supabase.from('daily_logs').update(data).eq('id', logId)`

### weekly_photos
- **GET**: `supabase.from('weekly_photos').select('*').eq('user_id', userId).order('week_start', { ascending: false })`
- **INSERT**: `supabase.from('weekly_photos').insert({ user_id, week_start, image_url })`

### foods
- **GET**: `supabase.from('foods').select('*').ilike('name', '%term%')`
- **INSERT**: `supabase.from('foods').insert({ name, calories_per_unit, unit })`

## Storage

### Upload Photo
```typescript
const { error } = await supabase.storage
  .from('progress-photos')
  .upload(fileName, file)

const { data: { publicUrl } } = supabase.storage
  .from('progress-photos')
  .getPublicUrl(fileName)
```

## Edge Functions

### Weekly Reminder
- **URL**: `https://your-project.supabase.co/functions/v1/weekly-reminder`
- **Method**: POST
- **Auth**: Service role key in header
- **Schedule**: Monday 7 AM (via cron)

### Daily Checker
- **URL**: `https://your-project.supabase.co/functions/v1/daily-checker`
- **Method**: POST
- **Auth**: Service role key in header
- **Schedule**: Daily 9 PM (via cron)

### Monthly Report
- **URL**: `https://your-project.supabase.co/functions/v1/monthly-report`
- **Method**: POST
- **Auth**: Service role key in header
- **Schedule**: 1st of month 8 AM (via cron)

## React Query Hooks

The app uses React Query for data fetching. All hooks are in `src/hooks/`:

- `useUser()` - Get current user
- `useUpdateUser()` - Update user profile
- `useDailyLog(date)` - Get log for specific date
- `useUpdateDailyLog()` - Create/update daily log
- `useDailyLogs(start, end)` - Get logs for date range
- `useWeeklyPhotos()` - Get all weekly photos
- `useUploadPhoto()` - Upload progress photo
- `useFoods(searchTerm)` - Search foods
- `useAddFood()` - Add food to database

