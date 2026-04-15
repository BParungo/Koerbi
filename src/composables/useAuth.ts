import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { authQuery } from '@/lib/supabase-query'
import { useAuthStore } from '@/stores/auth.store'
import { useAsyncState } from '@/composables/useAsyncState'

export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()
  const { error, loading } = useAsyncState()

  async function signIn(email: string, password: string) {
    error.value = null
    loading.value = true
    const result = await authQuery(supabase.auth.signInWithPassword({ email, password }))
    loading.value = false
    error.value = result.error
    return !result.error
  }

  async function signUp(email: string, password: string) {
    error.value = null
    loading.value = true
    const result = await authQuery(supabase.auth.signUp({ email, password }))
    loading.value = false
    error.value = result.error
    return !result.error
  }

  async function signOut() {
    await supabase.auth.signOut()
    store.$reset()
    router.push({ name: 'login' })
  }

  return { signIn, signUp, signOut, error, loading }
}
