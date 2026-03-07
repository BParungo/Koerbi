import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { User } from '@supabase/supabase-js'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }),
  },
}))

import { useAuthStore } from '@/stores/auth.store'

describe('auth.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with loading true and no user', () => {
    const store = useAuthStore()
    expect(store.loading).toBe(true)
    expect(store.user).toBeNull()
    expect(store.member).toBeNull()
    expect(store.family).toBeNull()
  })

  it('isLoggedIn is false when no user', () => {
    const store = useAuthStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('isLoggedIn is true when user is set', () => {
    const store = useAuthStore()
    store.user = { id: '123', email: 'test@test.de' } as unknown as User
    expect(store.isLoggedIn).toBe(true)
  })

  it('isInFamily is false when no family', () => {
    const store = useAuthStore()
    expect(store.isInFamily).toBe(false)
  })

  it('isInFamily is true when family is set', () => {
    const store = useAuthStore()
    store.family = { id: '1', name: 'Test Family', invite_code: 'abc', created_at: null, created_by: null }
    expect(store.isInFamily).toBe(true)
  })

  it('isAdmin is false by default', () => {
    const store = useAuthStore()
    expect(store.isAdmin).toBe(false)
  })

  it('isAdmin is true when member role is admin', () => {
    const store = useAuthStore()
    store.member = { id: '1', name: 'Dad', role: 'admin', family_id: '1', user_id: '1', avatar: null, joined_at: null }
    expect(store.isAdmin).toBe(true)
  })

  it('displayName falls back to email then Unknown', () => {
    const store = useAuthStore()
    expect(store.displayName).toBe('Unknown')

    store.user = { id: '1', email: 'test@test.de' } as unknown as User
    expect(store.displayName).toBe('test@test.de')

    store.member = { id: '1', name: 'Mom', role: 'member', family_id: '1', user_id: '1', avatar: null, joined_at: null }
    expect(store.displayName).toBe('Mom')
  })

  it('$reset clears user, member, and family', () => {
    const store = useAuthStore()
    store.user = { id: '1', email: 'test@test.de' } as unknown as User
    store.member = { id: '1', name: 'Mom', role: 'member', family_id: '1', user_id: '1', avatar: null, joined_at: null }
    store.family = { id: '1', name: 'Test', invite_code: 'abc', created_at: null, created_by: null }

    store.$reset()

    expect(store.user).toBeNull()
    expect(store.member).toBeNull()
    expect(store.family).toBeNull()
  })
})
