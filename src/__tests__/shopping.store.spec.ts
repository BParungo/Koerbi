import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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

import { useShoppingStore } from '@/stores/shopping.store'
import type { ShoppingItem, ShoppingList } from '@/types'

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: crypto.randomUUID(),
    list_id: '1',
    family_id: '1',
    name: 'Milch',
    amount: '1',
    unit: 'L',
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
    id: '1',
    family_id: '1',
    name: 'Einkaufsliste',
    created_by: '1',
    created_at: '2026-01-01T00:00:00Z',
    items,
  }
}

function setList(store: ReturnType<typeof useShoppingStore>, items: ShoppingItem[] = []) {
  store.setActiveList(makeList(items))
}

describe('shopping.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with null activeList and empty lists', () => {
    const store = useShoppingStore()
    expect(store.activeList).toBeNull()
    expect(store.lists).toEqual([])
    expect(store.loading).toBe(false)
  })

  describe('setActiveList', () => {
    it('adds list and sets it as active', () => {
      const store = useShoppingStore()
      const list = makeList([makeItem()])
      store.setActiveList(list)

      expect(store.lists).toHaveLength(1)
      expect(store.activeListId).toBe('1')
      expect(store.activeList).not.toBeNull()
      expect(store.activeList!.items).toHaveLength(1)
    })

    it('updates existing list instead of duplicating', () => {
      const store = useShoppingStore()
      store.setActiveList(makeList([makeItem()]))
      store.setActiveList(makeList([makeItem(), makeItem()]))

      expect(store.lists).toHaveLength(1)
      expect(store.activeList!.items).toHaveLength(2)
    })
  })

  describe('pendingItems', () => {
    it('returns empty when no list', () => {
      const store = useShoppingStore()
      expect(store.pendingItems).toEqual([])
    })

    it('returns only unchecked items', () => {
      const store = useShoppingStore()
      setList(store, [
        makeItem({ name: 'Milch', done: false }),
        makeItem({ name: 'Brot', done: true }),
        makeItem({ name: 'Eier', done: false }),
      ])
      expect(store.pendingItems).toHaveLength(2)
      expect(store.pendingItems.map((i) => i.name)).toEqual(['Milch', 'Eier'])
    })
  })

  describe('doneItems', () => {
    it('returns only checked items', () => {
      const store = useShoppingStore()
      setList(store, [
        makeItem({ name: 'Milch', done: false }),
        makeItem({ name: 'Brot', done: true }),
      ])
      expect(store.doneItems).toHaveLength(1)
      expect(store.doneItems[0]!.name).toBe('Brot')
    })
  })

  describe('progress', () => {
    it('returns 0 when no items', () => {
      const store = useShoppingStore()
      setList(store, [])
      expect(store.progress).toBe(0)
    })

    it('returns 0 when no list', () => {
      const store = useShoppingStore()
      expect(store.progress).toBe(0)
    })

    it('returns 100 when all done', () => {
      const store = useShoppingStore()
      setList(store, [
        makeItem({ done: true }),
        makeItem({ done: true }),
      ])
      expect(store.progress).toBe(100)
    })

    it('returns 50 when half done', () => {
      const store = useShoppingStore()
      setList(store, [
        makeItem({ done: true }),
        makeItem({ done: false }),
      ])
      expect(store.progress).toBe(50)
    })

    it('rounds to nearest integer', () => {
      const store = useShoppingStore()
      setList(store, [
        makeItem({ done: true }),
        makeItem({ done: false }),
        makeItem({ done: false }),
      ])
      expect(store.progress).toBe(33)
    })
  })

  describe('$reset', () => {
    it('resets all state', () => {
      const store = useShoppingStore()
      setList(store, [makeItem()])
      store.loading = true

      store.$reset()

      expect(store.activeList).toBeNull()
      expect(store.lists).toEqual([])
      expect(store.activeListId).toBeNull()
      expect(store.loading).toBe(false)
    })
  })
})
