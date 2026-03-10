import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 1. Set up headless browser to talk to the UAlberta Asymptote compiler
async function compileAsySvgWithPuppeteer(asyCode, browser) {
  const page = await browser.newPage()
  
  try {
    // Navigate to the online IDE
    await page.goto('https://asymptote.ualberta.ca/', { waitUntil: 'networkidle2' })
    
    // The IDE uses CodeMirror. We can inject our code directly into the editor instance
    await page.evaluate((code) => {
      // Find the CodeMirror instance and set its value
      const editorElement = document.querySelector('.CodeMirror').CodeMirror
      // We must add 'import graph;' and 'size(300);' if they are missing to ensure it fits and renders well
      let finalCode = code
      if (!finalCode.includes('import graph;')) finalCode = 'import graph;\n' + finalCode
      if (!finalCode.includes('size(') && !finalCode.includes('unitsize(')) finalCode = 'size(350);\n' + finalCode
      
      editorElement.setValue(finalCode)
    }, asyCode)
    
    // Click the "Run" button
    // It's the button inside the app header. Just find the button containing "Run" or "Render"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const runBtn = buttons.find(b => b.textContent && b.textContent.includes('Render') || b.textContent.includes('Run'))
      if (runBtn) runBtn.click()
    })
    
    // Wait for the SVG output to appear in the output pane
    // The WebAssembly usually takes 1-3 seconds to compile
    console.log('   Waiting for WebAssembly to compile...')
    
    // The output is rendered into an SVG embedded in a div
    await page.waitForSelector('svg', { timeout: 15000 })
    
    // Extract the SVG outerHTML
    const svgContent = await page.evaluate(() => {
      const svgElement = document.querySelector('svg')
      if (!svgElement) return null
      
      // Ensure SVG has proper XML namespace if missing
      let markup = svgElement.outerHTML
      if (!markup.includes('xmlns=')) {
        markup = markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
      }
      return markup
    })
    
    await page.close()
    return svgContent
    
  } catch (e) {
    if (!page.isClosed()) await page.close()
    throw e
  }
}

// 2. Upload SVG to Supabase Storage
async function uploadToSupabase(svgString, fileName) {
  const { data, error } = await supabase.storage
    .from('geometry-diagrams')
    .upload(fileName, svgString, {
      contentType: 'image/svg+xml',
      upsert: true
    })
    
  if (error) throw error
  
  const { data: publicUrlData } = supabase.storage
    .from('geometry-diagrams')
    .getPublicUrl(fileName)
    
  return publicUrlData.publicUrl
}

// 3. Process the entire database
async function main() {
  console.log('Fetching problems with [asy] blocks...')
  
  // Find all problems with an [asy] block that hasn't been replaced by an image yet
  const { data: problems, error } = await supabase
    .from('problems')
    .select('id, statement_latex, solution_latex')
    .or('statement_latex.ilike.%[asy]%,solution_latex.ilike.%[asy]%')
    
  if (error) {
    console.error('DB Error:', error)
    process.exit(1)
  }
  
  if (!problems || problems.length === 0) {
    console.log('No Asymptote blocks found to process!')
    return
  }
  
  console.log(`Found ${problems.length} problems with Geometry Code. Launching Puppeteer...`)
  
  const browser = await puppeteer.launch({
    headless: "new", // Run in modern headless mode without UI
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  let successCount = 0
  
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i]
    console.log(`\n[${i+1}/${problems.length}] Processing Problem ID: ${p.id}`)
    
    let statementLatex = p.statement_latex || ''
    let solutionLatex = p.solution_latex || ''
    const asyRegex = /\[asy\]([\s\S]+?)\[\/asy\]/g
    let match
    
    let updatedStatement = statementLatex
    let updatedSolution = solutionLatex
    let replaceCount = 0
    let globalAsyCount = 0
    
    // Process Statement
    while ((match = asyRegex.exec(statementLatex)) !== null) {
      const rawCode = match[1].trim()
      console.log(`   Found [asy] snippet in Statement... length: ${rawCode.length} chars`)
      
      try {
        const svgCode = await compileAsySvgWithPuppeteer(rawCode, browser)
        if (svgCode) {
          const fileName = `${p.id}_stmt_diagram_${globalAsyCount}.svg`
          console.log(`   Uploading ${fileName} to Supabase...`)
          const publicUrl = await uploadToSupabase(svgCode, fileName)
          const markdownImageAttr = `\n\n![Geometry Diagram](${publicUrl})\n`
          updatedStatement = updatedStatement.replace(match[0], markdownImageAttr)
          replaceCount++
          globalAsyCount++
        }
      } catch (e) {
        console.error(`   Error compiling this specific block:`, e.message)
      }
    }

    // Reset regex index for the second string
    asyRegex.lastIndex = 0

    // Process Solution
    while ((match = asyRegex.exec(solutionLatex)) !== null) {
      const rawCode = match[1].trim()
      console.log(`   Found [asy] snippet in Solution... length: ${rawCode.length} chars`)
      
      try {
        const svgCode = await compileAsySvgWithPuppeteer(rawCode, browser)
        if (svgCode) {
          const fileName = `${p.id}_sol_diagram_${globalAsyCount}.svg`
          console.log(`   Uploading ${fileName} to Supabase...`)
          const publicUrl = await uploadToSupabase(svgCode, fileName)
          const markdownImageAttr = `\n\n![Geometry Diagram](${publicUrl})\n`
          updatedSolution = updatedSolution.replace(match[0], markdownImageAttr)
          replaceCount++
          globalAsyCount++
        }
      } catch (e) {
        console.error(`   Error compiling this specific block:`, e.message)
      }
    }
    
    // Update DB row if replacements occurred
    if (replaceCount > 0) {
      console.log(`   Updating database row for ${p.id}...`)
      const { error: updateError } = await supabase
        .from('problems')
        .update({ 
          statement_latex: updatedStatement,
          solution_latex: updatedSolution
        })
        .eq('id', p.id)
        
      if (updateError) {
        console.error('   Failed to update DB:', updateError)
      } else {
        console.log(`   DB Updated!`)
        successCount++
      }
    }
  }
  
  console.log(`\nDone! Successfully updated ${successCount} geometry problems.`)
  await browser.close()
}

main().catch(console.error)
