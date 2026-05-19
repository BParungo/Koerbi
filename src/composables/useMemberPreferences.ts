import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import { useAuthStore } from '@/stores/auth.store'
import { useAsyncState } from '@/composables/useAsyncState'
import type { MemberPreference, PreferenceType } from '@/types'

export function useMemberPreferences() {
  const auth = useAuthStore()
  const { error, loading } = useAsyncState()
  const preferences = ref<MemberPreference[]>([])

  async function fetchFamilyPreferences() {
    if (!auth.family) return
    loading.value = true
    error.value = null

    const memberIds = await fetchFamilyMemberIds()
    if (!memberIds.length) {
      preferences.value = []
      loading.value = false
      return
    }

    const { data, error: err } = await query(
      supabase
        .from('member_preferences')
        .select('id, member_id, type, value, created_at')
        .in('member_id', memberIds),
    )

    if (err) {
      error.value = err
    } else if (data) {
      preferences.value = data as MemberPreference[]
    }
    loading.value = false
  }

  async function fetchFamilyMemberIds(): Promise<string[]> {
    if (!auth.family) return []
    const { data } = await query(
      supabase.from('family_members').select('id').eq('family_id', auth.family.id),
    )
    return (data ?? []).map((row: { id: string }) => row.id)
  }

  async function addPreference(type: PreferenceType, value: string) {
    if (!auth.member) return
    error.value = null

    const { data, error: err } = await query(
      supabase
        .from('member_preferences')
        .insert({ member_id: auth.member.id, type, value })
        .select('id, member_id, type, value, created_at')
        .single(),
    )

    if (err) {
      error.value = err
      return
    }
    if (data) {
      preferences.value = [...preferences.value, data as MemberPreference]
    }
  }

  async function removePreference(id: string) {
    error.value = null
    const { error: err } = await query(
      supabase.from('member_preferences').delete().eq('id', id),
    )
    if (err) {
      error.value = err
      return
    }
    preferences.value = preferences.value.filter((p) => p.id !== id)
  }

  async function togglePreference(type: PreferenceType, value: string) {
    if (!auth.member) return
    const existing = preferences.value.find(
      (p) => p.member_id === auth.member!.id && p.type === type && p.value === value,
    )
    if (existing) {
      await removePreference(existing.id)
    } else {
      await addPreference(type, value)
    }
  }

  return {
    preferences,
    loading,
    error,
    fetchFamilyPreferences,
    addPreference,
    removePreference,
    togglePreference,
  }
}
