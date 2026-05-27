import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bwzrbneskvvddukivphk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3enJibmVza3Z2ZGR1a2l2cGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDExNDksImV4cCI6MjA5NDUxNzE0OX0.cIBiipAFFiGqqP89sHxHg2RDbHKrrB5SxkCfcI7Tq8Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// For operations on the public schema (e.g. market_listings)
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
