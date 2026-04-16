import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
    functions: {
      invoke: mockInvoke,
    },
  },
}))

import { useRecipeImport } from '@/composables/useRecipeImport'

const mockRecipe = {
  title: 'Spaghetti Bolognese',
  servings: 4,
  duration: '45 Minuten',
  category: 'Pasta',
  ingredients: [{ name: 'Hackfleisch', amount: '500', unit: 'g' }],
  steps: ['Zwiebeln anbraten', 'Hackfleisch dazugeben'],
}

describe('useRecipeImport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('setzt result bei erfolgreichem URL-Import', async () => {
    mockInvoke.mockResolvedValue({ data: mockRecipe, error: null })

    const { importRecipe, result, error } = useRecipeImport()
    const returned = await importRecipe('url', 'https://example.com/rezept')

    expect(mockInvoke).toHaveBeenCalledWith('import-recipe', {
      body: { type: 'url', data: 'https://example.com/rezept' },
    })
    expect(returned).toEqual(mockRecipe)
    expect(result.value).toEqual(mockRecipe)
    expect(error.value).toBeNull()
  })

  it('setzt result bei erfolgreichem Bild-Import', async () => {
    mockInvoke.mockResolvedValue({ data: mockRecipe, error: null })

    const { importRecipe, result } = useRecipeImport()
    const returned = await importRecipe('image', 'data:image/jpeg;base64,abc123')

    expect(mockInvoke).toHaveBeenCalledWith('import-recipe', {
      body: { type: 'image', data: 'data:image/jpeg;base64,abc123' },
    })
    expect(returned).toEqual(mockRecipe)
    expect(result.value).toEqual(mockRecipe)
  })

  it('setzt error bei Edge-Function-Fehler', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Function error' } })

    const { importRecipe, result, error } = useRecipeImport()
    const returned = await importRecipe('url', 'https://example.com/rezept')

    expect(returned).toBeNull()
    expect(result.value).toBeNull()
    expect(error.value).toBe('Function error')
  })

  it('setzt error wenn kein Rezept erkannt wurde', async () => {
    mockInvoke.mockResolvedValue({ data: { error: 'Kein Rezept erkannt' }, error: null })

    const { importRecipe, result, error } = useRecipeImport()
    const returned = await importRecipe('url', 'https://example.com/keine-rezeptseite')

    expect(returned).toBeNull()
    expect(result.value).toBeNull()
    expect(error.value).toBe('Kein Rezept erkannt')
  })

  it('setzt loading während Import läuft', async () => {
    let resolveInvoke!: (v: unknown) => void
    mockInvoke.mockReturnValue(new Promise((r) => (resolveInvoke = r)))

    const { importRecipe, loading } = useRecipeImport()
    const promise = importRecipe('url', 'https://example.com/rezept')

    expect(loading.value).toBe(true)

    resolveInvoke({ data: mockRecipe, error: null })
    await promise

    expect(loading.value).toBe(false)
  })
})
