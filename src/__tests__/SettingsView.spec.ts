import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const signOutSpy = vi.fn()
const writeTextSpy = vi.fn().mockResolvedValue(undefined)
const familyMembersEqSpy = vi.fn(() => ({
  order: vi.fn(() => ({}))
}))
const profileUpdateSelectSingleSpy = vi.fn(() => ({
  data: { id: 'm-1' },
  error: null
}))
const profileUpdateSelectSpy = vi.fn(() => ({
  single: profileUpdateSelectSingleSpy
}))
const profileUpdateEqSpy = vi.fn(() => ({
  select: profileUpdateSelectSpy
}))
const profileUpdateSpy = vi.fn(() => ({
  eq: profileUpdateEqSpy
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    signOut: signOutSpy
  })
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'family_members') {
        return {
          select: vi.fn(() => ({
            eq: familyMembersEqSpy
          })),
          update: profileUpdateSpy
        }
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({}))
          }))
        }))
      }
    })
  }
}))

vi.mock('@/lib/supabase-query', () => ({
  query: vi.fn(async () => ({
    data: [
      {
        id: 'm-1',
        family_id: 'f-1',
        user_id: 'u-1',
        name: 'Alex',
        role: 'admin',
        avatar: null,
        joined_at: null
      },
      {
        id: 'm-2',
        family_id: 'f-1',
        user_id: 'u-2',
        name: 'Sam',
        role: 'member',
        avatar: null,
        joined_at: null
      }
    ],
    error: null
  }))
}))

import SettingsView from '@/views/SettingsView.vue'
import { useAuthStore } from '@/stores/auth.store'

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    signOutSpy.mockClear()
    writeTextSpy.mockClear()
    familyMembersEqSpy.mockClear()
    profileUpdateSpy.mockClear()
    profileUpdateEqSpy.mockClear()
    profileUpdateSelectSpy.mockClear()
    profileUpdateSelectSingleSpy.mockClear()

    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true
    })
  })

  it('renders profile, family and members including role badges', async () => {
    const store = useAuthStore()
    store.user = { id: 'u-1', email: 'alex@example.com' } as never
    store.member = {
      id: 'm-1',
      family_id: 'f-1',
      user_id: 'u-1',
      name: 'Alex',
      role: 'admin',
      avatar: null,
      joined_at: null
    }
    store.family = {
      id: 'f-1',
      name: 'Familie Test',
      invite_code: 'ABCD1234',
      created_at: null,
      created_by: null
    }

    const wrapper = mount(SettingsView)
    await flushPromises()

    expect(wrapper.text()).toContain('Profil')
    expect(wrapper.text()).toContain('Alex')
    expect(wrapper.text()).toContain('alex@example.com')
    expect(wrapper.text()).toContain('Familie Test')
    expect(wrapper.text()).toContain('Mitglieder (2)')
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('Mitglied')
  })

  it('copies invite code and calls sign out', async () => {
    const store = useAuthStore()
    store.user = { id: 'u-1', email: 'alex@example.com' } as never
    store.member = {
      id: 'm-1',
      family_id: 'f-1',
      user_id: 'u-1',
      name: 'Alex',
      role: 'admin',
      avatar: null,
      joined_at: null
    }
    store.family = {
      id: 'f-1',
      name: 'Familie Test',
      invite_code: 'ABCD1234',
      created_at: null,
      created_by: null
    }

    const wrapper = mount(SettingsView)
    await flushPromises()

    const copyButton = wrapper.find('button[aria-label="Einladungscode kopieren"]')
    await copyButton.trigger('click')

    expect(writeTextSpy).toHaveBeenCalledWith('ABCD1234')

    const signOutButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Abmelden'))

    expect(signOutButton).toBeTruthy()
    await signOutButton!.trigger('click')

    expect(signOutSpy).toHaveBeenCalledTimes(1)
  })

  it('saves edited display name and avatar preset', async () => {
    const store = useAuthStore()
    store.user = { id: 'u-1', email: 'alex@example.com' } as never
    store.member = {
      id: 'm-1',
      family_id: 'f-1',
      user_id: 'u-1',
      name: 'Alex',
      role: 'admin',
      avatar: null,
      joined_at: null
    }
    store.family = {
      id: 'f-1',
      name: 'Familie Test',
      invite_code: 'ABCD1234',
      created_at: null,
      created_by: null
    }

    const fetchFamilyDataSpy = vi.spyOn(store, 'fetchFamilyData').mockResolvedValue(undefined)

    const wrapper = mount(SettingsView)
    await flushPromises()

    await wrapper.find('#profile-display-name').setValue('Alex Neu')
    const avatarButton = wrapper
      .findAll('button')
      .find((button) => button.attributes('aria-label') === 'Avatar 🐻')

    expect(avatarButton).toBeTruthy()
    await avatarButton!.trigger('click')
    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Profil speichern'))

    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(profileUpdateSpy).toHaveBeenCalledWith({
      name: 'Alex Neu',
      avatar: 'emoji:🐻'
    })
    expect(profileUpdateEqSpy).toHaveBeenCalledWith('id', 'm-1')
    expect(fetchFamilyDataSpy).toHaveBeenCalledWith('u-1')
    expect(wrapper.text()).toContain('Profil gespeichert.')
  })
})
