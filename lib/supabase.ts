// lib/supabase.ts - Add this debug line
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// DEBUG: Check if key is loaded (remove after testing)
console.log('Service Key loaded:', !!supabaseServiceKey)
console.log('Service Key first 10 chars:', supabaseServiceKey?.substring(0, 10))

// Rest of your code...

// Check if environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Missing Supabase environment variables. Check your .env.local file.')
  }
}

// Regular client for normal operations (public)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-for-build.supabase.co',
  supabaseAnonKey || 'placeholder-key-for-build'
)

// Admin client with service role for user management (server-side only)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder-for-build.supabase.co',
  supabaseServiceKey || 'placeholder-key-for-build'
)