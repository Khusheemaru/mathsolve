import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

// Use the Vercel proxy URL since the local network blocks supabase.co
const supabaseUrl = 'https://mathsolve-xi.vercel.app/supabase-proxy'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const CATEGORY_MAP = {
  'algebra': 'ALGEBRA',
  'counting_and_probability': 'PROBABILITY',
  'geometry': 'GEOMETRY',
  'intermediate_algebra': 'ALGEBRA',
  'number_theory': 'NUMBER THEORY',
  'prealgebra': 'ARITHMETIC',
  'precalculus': 'CALCULUS'
}

const DIFFICULTY_MAP = {
  'Level 1': 2,
  'Level 2': 4,
  'Level 3': 6,
  'Level 4': 8,
  'Level 5': 10
}

const jsonPath = process.argv[2]
if (!jsonPath) {
  console.error('Usage: node seed_hf_math.js <path-to-json>')
  process.exit(1)
}

async function run() {
  console.log(`Reading dataset from ${jsonPath}...`)
  const allData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

  // Fetch all existing problems from db to prevent exact duplicates being inserted again
  // (We'll check problem statements to avoid re-inserting)
  console.log('Fetching existing problems from Supabase for deduplication...')
  const existingSet = new Set()
  
  // Fetch in pages to get everything
  let offset = 0
  const limit = 1000
  while (true) {
    const { data, error } = await supabase.from('problems').select('statement_latex').range(offset, offset + limit - 1)
    if (error) {
      console.error('Error fetching existing problems:', error)
      break
    }
    if (!data || data.length === 0) break
    
    for (const row of data) {
      existingSet.add((row.statement_latex || '').trim().toLowerCase().replace(/\s+/g, ' '))
    }
    
    if (data.length < limit) break
    offset += limit
  }
  console.log(`Currently there are ${existingSet.size} problems in the database.`)

  let problemsToInsert = []
  
  for (const data of allData) {
    const problemNormalize = (data.problem || '').trim().toLowerCase().replace(/\s+/g, ' ')
    
    // Check if it's already in the DB
    if (existingSet.has(problemNormalize)) {
      continue
    }

    const category = CATEGORY_MAP[data.type?.toLowerCase()] || 'ALGEBRA'
    const difficulty = DIFFICULTY_MAP[data.level] || 5

    let finalAnswer = ''
    const match = (data.solution || '').match(/\\boxed{((?:[^{}]|{(?:[^{}]|{[^{}]*})*})*)}/)
    if (match) {
      finalAnswer = match[1]
    } else {
      finalAnswer = (data.solution || '').split(' ').pop().replace(/[\.\$\\}]/g, '')
    }

    problemsToInsert.push({
      source: (data.type || 'MATH').replace(/_/g, ' ') + ` (HF MATH ${data.split || ''})`.trim(),
      category: category,
      difficulty: difficulty,
      statement_latex: data.problem,
      question_text: "Solve the problem above. Ensure your answer matches the expected format.",
      solution_latex: data.solution,
      final_answer: finalAnswer
    })
    
    // add to set so we don't insert it twice right now
    existingSet.add(problemNormalize)
  }

  console.log(`\nFound ${problemsToInsert.length} new, unique problems to insert.`)
  if (problemsToInsert.length === 0) {
    console.log('Nothing to do.')
    return
  }

  console.log('Uploading to Supabase database...')
  
  const batchSize = 100
  let successCount = 0
  
  // Send 5 concurrent batches at a time
  for (let i = 0; i < problemsToInsert.length; i += (batchSize * 5)) {
    const promises = []
    for (let j = 0; j < 5; j++) {
      const start = i + (j * batchSize)
      if (start >= problemsToInsert.length) break
      const batch = problemsToInsert.slice(start, start + batchSize)
      promises.push(supabase.from('problems').insert(batch).then(r => {
        if (r.error) throw r.error
        return batch.length
      }))
    }

    try {
      const results = await Promise.all(promises)
      successCount += results.reduce((a, b) => a + b, 0)
      console.log(`✓ Inserted ${successCount}/${problemsToInsert.length} problems`)
    } catch (error) {
      console.error(`Error inserting batch block starting at ${i}:`, JSON.stringify(error, null, 2))
      break
    }
  }

  console.log(`\n✅ Database seeded successfully with ${successCount} new problems!`)
}

run()
