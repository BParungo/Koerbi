import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import type { AuthState } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthState['user']>(null)
  const member = ref<AuthState['member']>(null)
  const family = ref<AuthState['family']>(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)
  const isInFamily = computed(() => !!family.value)
  const isAdmin = computed(() => member.value?.role === 'admin')
  const displayName = computed(() => member.value?.name ?? user.value?.email ?? 'Unknown')

  function $reset() {
    user.value = null
    member.value = null
    family.value = null
  }

  async function fetchFamilyData(userId: string) {
    const { data: memberData } = await query(
      supabase.from('family_members').select('*').eq('user_id', userId).maybeSingle(),
    )

    if (memberData) {
      member.value = memberData

      const { data: familyData } = await query(
        supabase.from('families').select('*').eq('id', memberData.family_id!).maybeSingle(),
      )

      if (familyData) {
        family.value = familyData
      }
    }
  }

  async function handleSession(session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) {
    try {
      user.value = session?.user ?? null

      if (session?.user) {
        await fetchFamilyData(session.user.id)
      } else {
        $reset()
      }
    } catch (err) {
      console.error('[Auth] Error during auth state change:', err)
    } finally {
      loading.value = false
    }
  }

  async function initAuth() {
    const { data } = await supabase.auth.getSession()
    await handleSession(data.session)

    // Listen for future changes (sign in, sign out, token refresh)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleSession(session)
    })
  }

  return { user, member, family, loading, isLoggedIn, isInFamily, isAdmin, displayName, $reset, initAuth, fetchFamilyData }
})
