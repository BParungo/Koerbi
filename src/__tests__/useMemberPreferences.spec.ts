import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

interface QueryResult {
  data: unknown
  error: unknown
}

const responses: Record<string, QueryResult> = {}
const inserted: Array<{ table: string; payload: unknown }> = []
const deleted: Array<{ table: string; id: string }> = []

function setResponse(key: string, value: QueryResult) {
  responses[key] = value
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn((table: string) => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn(function (this: typeof builder, payload: unknown) {
          inserted.push({ table, payload })
          return this
        }),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn(function (this: typeof builder, column: string, value: string) {
          if (table === 'member_preferences' && column === 'id') {
            deleted.push({ table, id: value })
          }
          return this
        }),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() =>
          Promise.resolve(responses[`${table}:single`] ?? { data: null, error: null }),
        ),
        // Make the builder awaitable like a Supabase query
        // oxlint-disable-next-line no-thenable
        then: (resolve: (v: QueryResult) => void) => {
          resolve(responses[table] ?? { data: [], error: null })
        },
      }
      return builder
    }),
  },
}))

import { useMemberPreferences } from '@/composables/useMemberPreferences'
import { useAuthStore } from '@/stores/auth.store'
import type { Family, FamilyMember } from '@/types'

function setupAuth() {
  const auth = useAuthStore()
  auth.user = { id: 'user-1' } as never
  auth.family = { id: 'fam-1', name: 'Test' } as Family
  auth.member = { id: 'member-1' } as FamilyMember
}

describe('useMemberPreferences', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    Object.keys(responses).forEach((k) => delete responses[k])
    inserted.length = 0
    deleted.length = 0
  })

  it('fetchFamilyPreferences lädt Präferenzen aller Mitglieder', async () => {
    setupAuth()
    setResponse('family_members', { data: [{ id: 'member-1' }, { id: 'member-2' }], error: null })
    setResponse('member_preferences', {
      data: [
        { id: 'p1', member_id: 'member-1', type: 'allergy', value: 'nuts', created_at: null },
        { id: 'p2', member_id: 'member-2', type: 'diet', value: 'vegan', created_at: null },
      ],
      error: null,
    })

    const { preferences, fetchFamilyPreferences } = useMemberPreferences()
    await fetchFamilyPreferences()

    expect(preferences.value).toHaveLength(2)
    expect(preferences.value[0]!.value).toBe('nuts')
  })

  it('addPreference fügt neue Präferenz in den lokalen State ein', async () => {
    setupAuth()
    setResponse('member_preferences:single', {
      data: { id: 'p-new', member_id: 'member-1', type: 'allergy', value: 'gluten', created_at: null },
      error: null,
    })

    const { preferences, addPreference } = useMemberPreferences()
    await addPreference('allergy', 'gluten')

    expect(inserted).toHaveLength(1)
    expect(preferences.value).toHaveLength(1)
    expect(preferences.value[0]!.value).toBe('gluten')
  })

  it('removePreference entfernt die Präferenz lokal', async () => {
    setupAuth()
    const { preferences, removePreference } = useMemberPreferences()
    preferences.value = [
      { id: 'p1', member_id: 'member-1', type: 'allergy', value: 'nuts', created_at: null },
    ]

    await removePreference('p1')

    expect(deleted[0]!).toEqual({ table: 'member_preferences', id: 'p1' })
    expect(preferences.value).toHaveLength(0)
  })

  it('togglePreference fügt hinzu wenn nicht vorhanden', async () => {
    setupAuth()
    setResponse('member_preferences:single', {
      data: { id: 'p-new', member_id: 'member-1', type: 'diet', value: 'vegan', created_at: null },
      error: null,
    })

    const { preferences, togglePreference } = useMemberPreferences()
    await togglePreference('diet', 'vegan')

    expect(preferences.value).toHaveLength(1)
    expect(preferences.value[0]!.value).toBe('vegan')
  })

  it('togglePreference entfernt wenn vorhanden', async () => {
    setupAuth()
    const { preferences, togglePreference } = useMemberPreferences()
    preferences.value = [
      { id: 'p1', member_id: 'member-1', type: 'diet', value: 'vegan', created_at: null },
    ]

    await togglePreference('diet', 'vegan')

    expect(deleted[0]!.id).toBe('p1')
    expect(preferences.value).toHaveLength(0)
  })
})
