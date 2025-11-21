# Fitness Habit Tracker

A comprehensive, production-ready fitness habit tracking web application built with React, TypeScript, and Supabase. Track your daily fitness metrics, visualize progress, and build consistent habits through gamification and reminders.

## 🚀 Features

### Core Functionality
- **One-Tap Daily Tracking**: Fast, minimal UI for logging all daily metrics
- **Red/Green Calendar**: Visual consistency tracking with streak counter
- **Analytics Dashboard**: Beautiful charts showing weight, steps, calories, workouts, sleep, and water trends
- **Weekly Progress Photos**: Upload and compare progress photos
- **Goal Setting**: Customizable daily goals for steps, water, workouts, and sleep
- **Food Search**: Search and add foods with calorie information
- **Auto-Save**: Automatic saving every 2 seconds with visual feedback

### Technical Features
- **PWA Support**: Installable on mobile and desktop with offline caching
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile-first design that works on all devices
- **Push Notifications**: Weekly and monthly reminders (via Supabase Edge Functions)
- **Row Level Security**: Secure data access with Supabase RLS policies

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Vercel account (for deployment)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

📖 **Detailed instructions**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete step-by-step guide.

**Quick steps:**
1. Create a new project at [supabase.com](https://supabase.com)
2. Get your credentials from Settings → API:
   - Project URL
   - Anon/Public key
3. Go to SQL Editor and run the schema from `supabase/schema.sql`
4. Go to Storage and create a bucket named `progress-photos` (private)
5. Create `.env` file in project root with your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find credentials:**
- Supabase Dashboard → ⚙️ Settings → API
- Project URL: Under "Project URL"
- Anon Key: Under "Project API keys" → "anon" → "public"

### 4. Set Up Edge Functions

Deploy the edge functions to Supabase:

# Install Supabase CLI (macOS with Homebrew)
brew install supabase/tap/supabase

# Or see: https://github.com/supabase/cli#install-the-cli for other platforms

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy weekly-reminder
supabase functions deploy daily-checker
supabase functions deploy monthly-report
supabase functions deploy morning-reminder
```

### 5. Configure Cron Jobs

In Supabase Dashboard, go to Database > Cron Jobs and set up:

- **Weekly Reminder**: Every Monday at 7 AM
  ```sql
  SELECT cron.schedule('weekly-reminder', '0 7 * * 1', $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/weekly-reminder',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$);
  ```

- **Morning Reminder**: Every day at 8 AM
  ```sql
  SELECT cron.schedule('morning-reminder', '0 8 * * *', $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/morning-reminder',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$);
  ```

- **Daily Checker (Evening)**: Every day at 9 PM
  ```sql
  SELECT cron.schedule('daily-checker', '0 21 * * *', $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/daily-checker',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$);
  ```

- **Monthly Report**: First day of each month at 8 AM
  ```sql
  SELECT cron.schedule('monthly-report', '0 8 1 * *', $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/monthly-report',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$);
  ```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📁 Project Structure

```
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components (Navbar)
│   │   └── food-search.tsx
│   ├── contexts/         # React contexts (Auth)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and Supabase client
│   ├── pages/            # Page components
│   ├── styles/           # Global styles
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── supabase/
│   ├── schema.sql        # Database schema
│   └── functions/        # Edge functions
├── public/               # Static assets
└── package.json
```

## 🗄️ Database Schema

### Tables

- **users**: User profiles and goals
- **daily_logs**: Daily fitness tracking data
- **weekly_photos**: Progress photos linked to weeks
- **foods**: Food database with calories
- **reminders_log**: Track sent reminders

See `supabase/schema.sql` for full schema with RLS policies.

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Service role used only in edge functions
- Public read access for foods table only

## 📱 PWA Features

- Installable on mobile and desktop
- Offline caching for daily tracking page
- Service worker for background sync
- App icons and splash screens

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Build for Production

```bash
npm run build
```

The `dist/` folder contains the production build.

## 🧪 Testing

Test the following scenarios:

1. **Offline PWA**: Disable network and verify offline functionality
2. **Auto-save**: Make changes and verify auto-save after 2 seconds
3. **Photo Upload**: Upload large images (test 5MB limit)
4. **Mobile View**: Test on mobile devices
5. **Dark Mode**: Toggle dark mode and verify persistence

## 📊 Analytics & Charts

The analytics page includes:

- Weight over time (line chart)
- Steps over time (line chart)
- Calories over time (line chart)
- Water intake trend (bar chart)
- Sleep hours (line chart)
- Workout count per week (bar chart)
- Consistency score trend (line chart)

All charts support:
- Weekly/monthly view toggle
- Smooth animations
- Interactive tooltips
- Responsive design

## 🔔 Notifications

### Weekly Reminders (Monday 7 AM)
- Upload weekly progress photo
- Enter weight measurement
- Review calories trend

### Daily Checker (9 PM)
- Reminds if steps not logged
- Reminds if workout not logged
- Reminds if water below goal

### Monthly Report (1st of month, 8 AM)
- Monthly summary
- Trends report
- Streak performance

## 🎨 Design Principles

- **One tap to track**: Minimal friction in logging
- **Motivating**: Green success indicators, streak counters
- **Dense but clean**: Information-rich without clutter
- **Mobile-first**: 80% usage on mobile devices
- **Instant feedback**: "Saved ✓" indicators

## 📝 API Routes

All API calls go through Supabase:

- Authentication: `supabase.auth.*`
- Database: `supabase.from('table').*`
- Storage: `supabase.storage.from('bucket').*`
- Edge Functions: `supabase.functions.invoke('function-name')`

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Components from [shadcn/ui](https://ui.shadcn.com/)
- Charts from [Recharts](https://recharts.org/)
- Backend by [Supabase](https://supabase.com/)

