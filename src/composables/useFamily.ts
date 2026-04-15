import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import { useAuthStore } from '@/stores/auth.store'
import { useAsyncState } from '@/composables/useAsyncState'
import { parseInviteCode } from '@/utils/invite'

export function useFamily() {
  const store = useAuthStore()
  const router = useRouter()
  const { error, loading } = useAsyncState()

  async function createFamily(familyName: string, displayName: string) {
    if (!store.user) return false
    error.value = null
    loading.value = true

    // Use RPC-style: insert family, then insert member, then fetch via store.
    // We can't use .select().single() on families insert because RLS SELECT
    // policy requires membership — which doesn't exist yet at insert time.
    const { data: families, error: familyError } = await supabase
      .from('families')
      .insert({ name: familyName })
      .select('id, invite_code')

    if (familyError || !families?.length) {
      console.error('[Supabase]', familyError?.message, familyError)
      error.value = familyError?.message ?? 'Familie konnte nicht erstellt werden'
      loading.value = false
      return false
    }

    const family = families[0]!

    const { error: memberError } = await supabase.from('family_members').insert({
      family_id: family.id,
      user_id: store.user.id,
      name: displayName,
      role: 'admin'
    })

    if (memberError) {
      console.error('[Supabase]', memberError.message, memberError)
      error.value = memberError.message
      loading.value = false
      return false
    }

    await store.fetchFamilyData(store.user.id)
    loading.value = false
    router.push({ name: 'recipes' })
    return true
  }

  async function joinFamily(inviteInput: string, displayName: string) {
    if (!store.user) return false
    error.value = null
    loading.value = true

    const code = parseInviteCode(inviteInput)

    const { data: family, error: familyError } = await query(
      supabase.from('families').select('*').eq('invite_code', code).single()
    )

    if (familyError || !family) {
      error.value = 'Ungültiger Einladungscode'
      loading.value = false
      return false
    }

    const { error: memberError } = await query(
      supabase.from('family_members').insert({
        family_id: family.id,
        user_id: store.user.id,
        name: displayName,
        role: 'member'
      })
    )

    if (memberError) {
      error.value = memberError
      loading.value = false
      return false
    }

    await store.fetchFamilyData(store.user.id)
    loading.value = false
    router.push({ name: 'recipes' })
    return true
  }

  return { createFamily, joinFamily, error, loading }
}
