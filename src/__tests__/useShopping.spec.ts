import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockUpdate = vi.fn()
const mockEq = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: mockUpdate,
      delete: vi.fn().mockReturnThis(),
      eq: mockEq,
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

import { useShopping } from '@/composables/useShopping'
import { useShoppingStore } from '@/stores/shopping.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Family, FamilyMember, ShoppingItem, ShoppingList } from '@/types'

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: crypto.randomUUID(),
    list_id: 'list-1',
    family_id: 'family-1',
    name: 'Item',
    amount: null,
    unit: null,
    category: null,
    done: false,
    done_by: null,
    done_at: null,
    assigned_to: null,
    from_recipe_id: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeList(items: ShoppingItem[] = []): ShoppingList {
  return {
    id: 'list-1',
    family_id: 'family-1',
    name: 'Einkaufsliste',
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    items,
  }
}

function setupAuth() {
  const auth = useAuthStore()
  auth.user = { id: 'user-1', email: 'test@test.com' } as any
  auth.family = { id: 'family-1', name: 'Test' } as Family
  auth.member = { id: 'member-1' } as FamilyMember
}

describe('useShopping — reorderItems', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: null, error: null })
  })

  it('setzt sort_order optimistisch im Store', async () => {
    setupAuth()
    const store = useShoppingStore()
    const itemA = makeItem({ id: 'a', sort_order: 0 })
    const itemB = makeItem({ id: 'b', sort_order: 1 })
    const itemC = makeItem({ id: 'c', sort_order: 2 })
    store.setActiveList(makeList([itemA, itemB, itemC]))

    const { reorderItems } = useShopping()
    await reorderItems('list-1', ['c', 'a', 'b'])

    const list = store.lists.find((l) => l.id === 'list-1')!
    expect(list.items.find((i) => i.id === 'c')!.sort_order).toBe(0)
    expect(list.items.find((i) => i.id === 'a')!.sort_order).toBe(1)
    expect(list.items.find((i) => i.id === 'b')!.sort_order).toBe(2)
  })

  it('ruft Supabase update für jedes Item auf', async () => {
    setupAuth()
    const store = useShoppingStore()
    const itemA = makeItem({ id: 'a' })
    const itemB = makeItem({ id: 'b' })
    store.setActiveList(makeList([itemA, itemB]))

    const { reorderItems } = useShopping()
    await reorderItems('list-1', ['b', 'a'])

    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 0 })
    expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 1 })
  })

  it('tut nichts wenn Liste nicht existiert', async () => {
    setupAuth()
    setActivePinia(createPinia())

    const { reorderItems } = useShopping()
    await reorderItems('nonexistent', ['a', 'b'])

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
