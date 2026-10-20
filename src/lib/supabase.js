import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

const isConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('your_supabase_project_url') &&
  !rawUrl.includes('placeholder')
)

const safeUrl = isConfigured ? rawUrl : 'https://placeholder.supabase.co'
const safeKey = isConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM0NDk2MDB9.dummy'


if (!isConfigured) {
  console.info('ℹ️ Supabase not yet configured. Running in Local/Demo Mode. Add your Supabase URL & Key to .env.local to persist data in Supabase.')
}

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

export const supabaseConfigured = isConfigured
