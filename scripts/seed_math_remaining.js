import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = 'https://mathsolve.vercel.app/supabase-proxy'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in process.env (run with dotenv)')
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

const datasetPath = process.argv[2]
if (!datasetPath) {
  console.error('Usage: node seed_math_remaining.js <path-to-dataset>')
  process.exit(1)
}

const seenProblems = new Set()

async function run() {
  let problemsToInsert = []
  const foldersToProcess = ['train', 'test']

  for (const split of foldersToProcess) {
    const splitDir = path.join(datasetPath, split)
    if (!fs.existsSync(splitDir)) continue

    const categories = fs.readdirSync(splitDir)
    for (const folder of categories) {
      const folderPath = path.join(splitDir, folder)
      if (!fs.statSync(folderPath).isDirectory()) continue

      const files = fs.readdirSync(folderPath)
      let countForCategory = 0

      for (const file of files) {
        if (!file.endsWith('.json')) continue
        
        countForCategory++
        // SKIP the first 200 because we already uploaded those in the previous script!
        if (countForCategory <= 200) {
          continue
        }

        const data = JSON.parse(fs.readFileSync(path.join(folderPath, file), 'utf8'))
        
        const problemNormalize = (data.problem || '').trim().toLowerCase().replace(/\s+/g, ' ')
        if (seenProblems.has(problemNormalize)) continue
        seenProblems.add(problemNormalize)

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
          source: (data.type || 'MATH').replace(/_/g, ' ') + ` (MATH ${split})`,
          category: category,
          difficulty: difficulty,
          statement_latex: data.problem,
          question_text: "Solve the problem above. Ensure your answer matches the expected format.",
          solution_latex: data.solution,
          final_answer: finalAnswer
        })
      }
    }
  }

  console.log(`\nFound ${problemsToInsert.length} remaining problems to insert.`)
  if (problemsToInsert.length === 0) return
  
  console.log('Uploading to Supabase database...')
  
  const batchSize = 100
  let successCount = 0
  for (let i = 0; i < problemsToInsert.length; i += batchSize) {
    const batch = problemsToInsert.slice(i, i + batchSize)
    const { error } = await supabase.from('problems').insert(batch)
    if (error) {
      console.error(`Error inserting batch ${i}:`, error.message || JSON.stringify(error))
      break
    } else {
      successCount += batch.length
      console.log(`✓ Inserted ${successCount}/${problemsToInsert.length} remaining problems`)
    }
  }

  console.log(`\n✅ Database seeded successfully with ${successCount} additional problems!`)
}

run()
