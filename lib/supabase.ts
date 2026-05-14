import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.')
}

/**
 * Single instance of the Supabase client for client-side use.
 * Switched to standard createClient for consistent client-side session management.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
