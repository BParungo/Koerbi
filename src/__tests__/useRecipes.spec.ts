import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: mockInsert.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      single: mockSingle,
    })),
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}))

import { useRecipes } from '@/composables/useRecipes'
import { useAuthStore } from '@/stores/auth.store'
import type { Family, FamilyMember } from '@/types'

function setupAuth() {
  const auth = useAuthStore()
  auth.user = { id: 'user-1', email: 'test@test.com' } as any
  auth.family = { id: 'family-1', name: 'Test' } as Family
  auth.member = { id: 'member-1' } as FamilyMember
}

describe('useRecipes — uploadRecipeImage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('uploads file and returns public URL', async () => {
    setupAuth()
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/family-1/recipe-1.jpg' } })

    const { uploadRecipeImage } = useRecipes() as any
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const url = await uploadRecipeImage(file, 'recipe-1')

    expect(mockUpload).toHaveBeenCalledWith('family-1/recipe-1.jpg', file, { upsert: true })
    expect(url).toBe('https://cdn.example.com/family-1/recipe-1.jpg')
  })

  it('returns null and sets error when upload fails', async () => {
    setupAuth()
    mockUpload.mockResolvedValue({ error: { message: 'Upload fehlgeschlagen' } })

    const { uploadRecipeImage, error } = useRecipes() as any
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const url = await uploadRecipeImage(file, 'recipe-1')

    expect(url).toBeNull()
    expect(error.value).toBe('Upload fehlgeschlagen')
  })

  it('returns null when no family is set', async () => {
    setActivePinia(createPinia())
    // auth.family bleibt null

    const { uploadRecipeImage } = useRecipes() as any
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const url = await uploadRecipeImage(file, 'recipe-1')

    expect(url).toBeNull()
    expect(mockUpload).not.toHaveBeenCalled()
  })
})
