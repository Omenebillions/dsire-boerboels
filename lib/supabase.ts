// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  // You can throw an error in development but handle gracefully in production
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Missing Supabase environment variables. Check your .env.local file.')
  }
}

// Create client with fallback to prevent build errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-for-build.supabase.co',
  supabaseAnonKey || 'placeholder-key-for-build'
)