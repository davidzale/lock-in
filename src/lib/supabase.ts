import { createClient } from '@supabase/supabase-js'

// Public project values (safe to ship in client code; access is enforced by RLS).
export const SUPABASE_URL = 'https://haurbvvzogrhayeonjuq.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_2Y3UQfzhWnX5d9znk0DtFg_cfTbxxLn'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'lockin-auth' },
})
