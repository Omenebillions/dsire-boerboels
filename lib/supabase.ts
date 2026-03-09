// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Regular client for normal operations
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// FIXED: Admin client with proper configuration to prevent session conflicts
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        // Explicitly set Authorization header to ensure service role is used
        Authorization: `Bearer ${supabaseServiceKey}`
      }
    }
  }
)