-- Add protein and carbs columns to daily_logs table
ALTER TABLE daily_logs 
ADD COLUMN IF NOT EXISTS protein DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS carbs DECIMAL(6,2);

-- Update foods table to include protein and carbs
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS protein_per_unit DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbs_per_unit DECIMAL(6,2) DEFAULT 0;

-- Add unique constraint on food name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'foods_name_unique'
  ) THEN
    ALTER TABLE foods ADD CONSTRAINT foods_name_unique UNIQUE (name);
  END IF;
END $$;

-- Allow service role to insert foods (for bulk imports)
CREATE POLICY IF NOT EXISTS "Service role can insert foods"
ON foods FOR INSERT
TO service_role
WITH CHECK (true);

