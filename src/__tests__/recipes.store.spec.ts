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

import { useRecipesStore } from '@/stores/recipes.store'
import type { Recipe } from '@/types'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: crypto.randomUUID(),
    name: 'Test Recipe',
    family_id: '1',
    created_by: '1',
    emoji: null,
    duration: '30 min',
    servings: 4,
    category: 'Pasta',
    steps: ['Step 1'],
    image_url: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ingredients: [],
    ...overrides,
  }
}

describe('recipes.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty state', () => {
    const store = useRecipesStore()
    expect(store.recipes).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.searchQuery).toBe('')
    expect(store.activeCategory).toBe('Alle')
  })

  describe('categories', () => {
    it('returns only "Alle" when no recipes', () => {
      const store = useRecipesStore()
      expect(store.categories).toEqual(['Alle'])
    })

    it('extracts unique categories from recipes', () => {
      const store = useRecipesStore()
      store.recipes = [
        makeRecipe({ category: 'Pasta' }),
        makeRecipe({ category: 'Suppe' }),
        makeRecipe({ category: 'Pasta' }),
      ]
      expect(store.categories).toEqual(['Alle', 'Pasta', 'Suppe'])
    })

    it('excludes null categories', () => {
      const store = useRecipesStore()
      store.recipes = [
        makeRecipe({ category: 'Pasta' }),
        makeRecipe({ category: null }),
      ]
      expect(store.categories).toEqual(['Alle', 'Pasta'])
    })
  })

  describe('filteredRecipes', () => {
    it('returns all recipes when no filter active', () => {
      const store = useRecipesStore()
      store.recipes = [makeRecipe(), makeRecipe()]
      expect(store.filteredRecipes).toHaveLength(2)
    })

    it('filters by search query (case-insensitive)', () => {
      const store = useRecipesStore()
      store.recipes = [
        makeRecipe({ name: 'Spaghetti Bolognese' }),
        makeRecipe({ name: 'Tomatensuppe' }),
      ]
      store.searchQuery = 'spagh'
      expect(store.filteredRecipes).toHaveLength(1)
      expect(store.filteredRecipes[0]!.name).toBe('Spaghetti Bolognese')
    })

    it('filters by category', () => {
      const store = useRecipesStore()
      store.recipes = [
        makeRecipe({ category: 'Pasta' }),
        makeRecipe({ category: 'Suppe' }),
      ]
      store.activeCategory = 'Suppe'
      expect(store.filteredRecipes).toHaveLength(1)
      expect(store.filteredRecipes[0]!.category).toBe('Suppe')
    })

    it('combines search and category filter', () => {
      const store = useRecipesStore()
      store.recipes = [
        makeRecipe({ name: 'Spaghetti Bolognese', category: 'Pasta' }),
        makeRecipe({ name: 'Penne Arrabiata', category: 'Pasta' }),
        makeRecipe({ name: 'Tomatensuppe', category: 'Suppe' }),
      ]
      store.activeCategory = 'Pasta'
      store.searchQuery = 'penne'
      expect(store.filteredRecipes).toHaveLength(1)
      expect(store.filteredRecipes[0]!.name).toBe('Penne Arrabiata')
    })

    it('shows all categories when "Alle" is selected', () => {
      const store = useRecipesStore()
      store.recipes = [
        makeRecipe({ category: 'Pasta' }),
        makeRecipe({ category: 'Suppe' }),
      ]
      store.activeCategory = 'Alle'
      expect(store.filteredRecipes).toHaveLength(2)
    })
  })

  describe('$reset', () => {
    it('resets all state to defaults', () => {
      const store = useRecipesStore()
      store.recipes = [makeRecipe()]
      store.loading = true
      store.searchQuery = 'test'
      store.activeCategory = 'Pasta'

      store.$reset()

      expect(store.recipes).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.searchQuery).toBe('')
      expect(store.activeCategory).toBe('Alle')
    })
  })
})
