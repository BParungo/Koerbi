import type { PostgrestSingleResponse, AuthResponse, AuthOtpResponse } from '@supabase/supabase-js'

export type QueryResult<T> = {
  data: T | null
  error: string | null
}

/**
 * Wraps a Supabase Postgrest query with unified error handling.
 *
 * Usage:
 *   const { data, error } = await query(supabase.from('families').select('*'))
 */
export async function query<T>(
  promise: PromiseLike<PostgrestSingleResponse<T>>,
): Promise<QueryResult<T>> {
  const { data, error } = await promise

  if (error) {
    console.error(`[Supabase] ${error.message}`, error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Wraps a Supabase Auth call with unified error handling.
 *
 * Usage:
 *   const { data, error } = await authQuery(supabase.auth.signInWithPassword({ email, password }))
 */
export async function authQuery<T extends AuthResponse | AuthOtpResponse>(
  promise: PromiseLike<T>,
): Promise<QueryResult<T['data']>> {
  const { data, error } = await promise

  if (error) {
    console.error(`[Supabase Auth] ${error.message}`, error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
