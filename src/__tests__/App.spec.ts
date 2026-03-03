import { describe, it, expect, vi } from 'vitest'

// Mock supabase before any imports that use it
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}))

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App', () => {
  it('shows loading spinner while auth is initializing', () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: { RouterView: true },
      },
    })
    // Auth store starts with loading=true, so spinner should be visible
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })
})
