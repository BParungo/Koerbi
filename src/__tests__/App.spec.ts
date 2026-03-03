import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

// Mock supabase before any imports that use it
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
  },
}))

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App', () => {
  it('shows RouterView after auth initializes with no session', async () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: { RouterView: true },
      },
    })
    await flushPromises()
    // After getSession resolves with null, loading=false → RouterView shown
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })
})
