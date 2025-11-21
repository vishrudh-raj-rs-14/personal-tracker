# Import Food Data Guide

## Step 1: Update Database Schema

First, add the protein and carbs columns to your database:

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase/add-macros.sql`:

```sql
-- Add protein and carbs columns to daily_logs table
ALTER TABLE daily_logs 
ADD COLUMN IF NOT EXISTS protein DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS carbs DECIMAL(6,2);

-- Update foods table to include protein and carbs
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS protein_per_unit DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbs_per_unit DECIMAL(6,2) DEFAULT 0;
```

## Step 2: Install CSV Parser

```bash
npm install csv-parse
```

## Step 3: Import Food Data

### Option A: Using Node.js Script (Recommended)

1. Make sure you have your `.env` file with Supabase credentials
2. **Important**: Add your service role key to `.env` for bulk imports:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   (Find this in Supabase Dashboard → Settings → API → service_role → secret)
   
   ⚠️ **Security Note**: Service role key bypasses RLS. Only use for scripts, never expose in client code!

3. Run the import script:

```bash
npm run import-foods
```

Or:
```bash
node scripts/import-foods.js
```

The script will:
- Read the CSV file from `data/Indian_Food_Nutrition_Processed.csv`
- Parse all food items with calories, protein, and carbs
- Import them into the `foods` table
- Handle duplicates (uses upsert)

### Option B: Manual Import via Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor → `foods`
2. Click "Insert" → "Import data from CSV"
3. Upload `data/Indian_Food_Nutrition_Processed.csv`
4. Map columns:
   - `Dish Name` → `name`
   - `Calories (kcal)` → `calories_per_unit`
   - `Protein (g)` → `protein_per_unit`
   - `Carbohydrates (g)` → `carbs_per_unit`
   - Set `unit` to `100g` for all rows

## Step 4: Verify Import

1. Go to your app's dashboard
2. Try searching for a food (e.g., "tea" or "rice")
3. You should see foods with protein and carbs information

## CSV Format

The CSV file should have these columns:
- `Dish Name` - Food name
- `Calories (kcal)` - Calories per 100g
- `Carbohydrates (g)` - Carbs per 100g
- `Protein (g)` - Protein per 100g

All values are per 100g serving.

