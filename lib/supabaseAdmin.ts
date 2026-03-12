// lib/supabaseAdmin.ts
import 'server-only' // ← Add this line!
import { createClient } from '@supabase/supabase-js'

// This file will now throw an error if accidentally imported in client components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)