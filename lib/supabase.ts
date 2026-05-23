import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are missing. Please add them to .env.local');
}

/**
 * Single instance of the Supabase client for client-side use.
 * Switched to standard createClient for consistent client-side session management.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
