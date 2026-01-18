/**
 * Import teams from CSV into Supabase database
 * Run with: npx tsx scripts/import-teams.ts
 */

import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables FIRST
config({ path: join(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { customAlphabet } from 'nanoid'

// Generate invite codes
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Map CSV category to league slug
function mapCategoryToLeagueSlug(category: string): string | null {
  const cat = category.toLowerCase()

  if (cat.includes('pro level league')) {
    return 'pro'
  }
  if (cat.includes('45+')) {
    return '45plus'
  }
  if (cat.includes('throwball')) {
    return 'throwball'
  }
  if (cat.includes("men's volleyball") || cat.includes('volleyball')) {
    return 'regular'
  }

  return null
}

// Normalize phone number
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

interface CSVRow {
  timestamp: string
  email: string
  paid: string
  score: string
  category: string
  teamName: string
  captainName: string
  phone: string
  contact2: string
  numPlayers: string
  specialRequests: string
  rulesAgreed: string
  signedBy: string
  dateTime: string
}

async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const rows: CSVRow[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handling commas in quoted fields)
    const fields: string[] = []
    let field = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(field.trim())
        field = ''
      } else {
        field += char
      }
    }
    fields.push(field.trim())

    rows.push({
      timestamp: fields[0] || '',
      email: fields[1] || '',
      paid: fields[2] || '',
      score: fields[3] || '',
      category: fields[4] || '',
      teamName: fields[5] || '',
      captainName: fields[6] || '',
      phone: fields[7] || '',
      contact2: fields[8] || '',
      numPlayers: fields[9] || '',
      specialRequests: fields[10] || '',
      rulesAgreed: fields[11] || '',
      signedBy: fields[12] || '',
      dateTime: fields[13] || '',
    })
  }

  return rows
}

async function importTeams() {
  console.log('Starting team import...\n')

  // Get leagues from database
  const { data: leagues, error: leagueError } = await supabase
    .from('leagues')
    .select('*')

  if (leagueError) {
    console.error('Error fetching leagues:', leagueError)
    process.exit(1)
  }

  const leagueMap = new Map(leagues.map(l => [l.slug, l.id]))
  console.log('Leagues loaded:', leagues.map(l => `${l.slug} -> ${l.id}`).join(', '))
  console.log()

  // Parse CSV
  const csvPath = join(__dirname, '../data/2026 Republic Day Volleyball_Throwball Tournament (Responses) - Form Responses 1.csv')
  const rows = await parseCSV(csvPath)

  console.log(`Found ${rows.length} rows in CSV\n`)

  // Filter to only paid teams (Y in paid column)
  const paidTeams = rows.filter(row => row.paid.toUpperCase() === 'Y')
  console.log(`${paidTeams.length} teams have paid\n`)

  // Track results
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  }

  // Process each team
  for (const row of paidTeams) {
    const leagueSlug = mapCategoryToLeagueSlug(row.category)

    if (!leagueSlug) {
      console.log(`⚠️  Skipping "${row.teamName}" - unknown category: ${row.category}`)
      results.skipped++
      continue
    }

    const leagueId = leagueMap.get(leagueSlug)
    if (!leagueId) {
      console.log(`⚠️  Skipping "${row.teamName}" - league not found: ${leagueSlug}`)
      results.skipped++
      continue
    }

    // Check if team already exists
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', row.teamName.trim())
      .eq('league_id', leagueId)
      .single()

    if (existingTeam) {
      console.log(`⏭️  Skipping "${row.teamName}" (${leagueSlug}) - already exists`)
      results.skipped++
      continue
    }

    // Generate unique invite code
    let inviteCode = nanoid()
    let attempts = 0
    while (attempts < 10) {
      const { data: existingCode } = await supabase
        .from('teams')
        .select('id')
        .eq('invite_code', inviteCode)
        .single()

      if (!existingCode) break
      inviteCode = nanoid()
      attempts++
    }

    // Insert team
    const { error: insertError } = await supabase
      .from('teams')
      .insert({
        name: row.teamName.trim(),
        league_id: leagueId,
        captain_name: row.captainName.trim(),
        captain_email: row.email.trim() || null,
        captain_phone: normalizePhone(row.phone),
        invite_code: inviteCode,
      })

    if (insertError) {
      console.log(`❌ Error importing "${row.teamName}": ${insertError.message}`)
      results.errors.push(`${row.teamName}: ${insertError.message}`)
      continue
    }

    console.log(`✅ Imported "${row.teamName}" (${leagueSlug}) - Code: ${inviteCode}`)
    results.imported++
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('Import Summary')
  console.log('='.repeat(50))
  console.log(`✅ Imported: ${results.imported}`)
  console.log(`⏭️  Skipped: ${results.skipped}`)
  console.log(`❌ Errors: ${results.errors.length}`)

  if (results.errors.length > 0) {
    console.log('\nErrors:')
    results.errors.forEach(err => console.log(`  - ${err}`))
  }
}

importTeams().catch(console.error)
