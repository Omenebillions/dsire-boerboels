// utils/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: SUPABASE_URL');
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Create a single Supabase client for your API routes.
// Using the Service Role Key gives it full access, so use it only on the server.
export const supabaseServerClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);
