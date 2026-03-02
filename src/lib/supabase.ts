import { createClient } from '@supabase/supabase-js'

// TODO: Add Database type after TICKET-02 (supabase gen types typescript)
// import type { Database } from '@/types'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
