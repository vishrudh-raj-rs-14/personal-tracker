import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
// Use service role key for imports to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials')
  console.error('For bulk imports, set SUPABASE_SERVICE_ROLE_KEY in .env file')
  console.error('Or use VITE_SUPABASE_ANON_KEY (may have RLS restrictions)')
  process.exit(1)
}

// Use service role client for imports (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function importFoods() {
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, '../data/Indian_Food_Nutrition_Processed.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    })

    console.log(`Found ${records.length} foods to import`)

    // Transform data
    const foods = records.map((record) => {
      const dishName = record['Dish Name']?.trim()
      const calories = parseFloat(record['Calories (kcal)']) || 0
      const carbs = parseFloat(record['Carbohydrates (g)']) || 0
      const protein = parseFloat(record['Protein (g)']) || 0

      if (!dishName || calories === 0) {
        return null
      }

      return {
        name: dishName,
        calories_per_unit: Math.round(calories * 100) / 100, // Round to 2 decimals
        carbs_per_unit: Math.round(carbs * 100) / 100,
        protein_per_unit: Math.round(protein * 100) / 100,
        unit: '100g', // Default unit from the dataset
      }
    }).filter(Boolean)

    console.log(`Prepared ${foods.length} valid foods`)

    // Insert in batches of 100
    const batchSize = 100
    let imported = 0
    let skipped = 0

    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize)
      
      // Insert with conflict handling
      const { data, error } = await supabase
        .from('foods')
        .upsert(batch, {
          onConflict: 'name',
        })
        .select()

      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error.message)
        skipped += batch.length
      } else {
        imported += data?.length || 0
        console.log(`Imported batch ${i / batchSize + 1}: ${data?.length || 0} foods`)
      }
    }

    console.log('\n✅ Import complete!')
    console.log(`   Imported: ${imported} foods`)
    console.log(`   Skipped: ${skipped} foods`)
    console.log(`   Total: ${foods.length} foods`)
  } catch (error) {
    console.error('Error importing foods:', error)
    process.exit(1)
  }
}

importFoods()

