import type { PostgrestSingleResponse, AuthResponse, AuthOtpResponse } from '@supabase/supabase-js'

export type QueryResult<T> = {
  data: T | null
  error: string | null
}

type AnySupabaseResponse<T> =
  | PostgrestSingleResponse<T>
  | AuthResponse
  | AuthOtpResponse

/**
 * Wraps a Supabase query or Auth call with unified error handling.
 *
 * Usage (PostgREST):
 *   const { data, error } = await query(supabase.from('families').select('*'))
 *
 * Usage (Auth):
 *   const { data, error } = await query(supabase.auth.signInWithPassword({ email, password }))
 */
export async function query<T>(
  promise: PromiseLike<AnySupabaseResponse<T>>,
): Promise<QueryResult<T>> {
  const { data, error } = await promise

  if (error) {
    console.error(`[Supabase] ${error.message}`, error)
    return { data: null, error: error.message }
  }

  return { data: data as T, error: null }
}
