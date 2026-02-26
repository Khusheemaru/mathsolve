import { createClient } from '@supabase/supabase-js'

// Route all Supabase calls through our own domain proxy.
// - In local dev: Vite forwards /supabase-proxy/* → supabase.co/* (see vite.config.js)
// - In production: Vercel rewrites /supabase-proxy/* → supabase.co/* (see vercel.json)
// This prevents ISP-level blocking of supabase.co since the browser only sees our domain.
const supabaseUrl = `${window.location.origin}/supabase-proxy`
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
