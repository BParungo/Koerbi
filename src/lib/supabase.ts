import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    db: { timeout: 10_000 }
  }
)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    supabase.auth.startAutoRefresh()
    supabase.realtime.connect()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
