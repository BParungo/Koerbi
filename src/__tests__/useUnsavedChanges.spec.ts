import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

let routeLeaveGuard: (() => boolean | undefined) | null = null

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: (fn: () => boolean | undefined) => {
    routeLeaveGuard = fn
  },
}))

function createTestComponent(isDirty: Ref<boolean>) {
  return defineComponent({
    setup() {
      useUnsavedChanges(isDirty)
      return {}
    },
    template: '<div />',
  })
}

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    routeLeaveGuard = null
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registriert beforeunload sofort wenn isDirty beim Mount true ist', async () => {
    const isDirty = ref(true)
    mount(createTestComponent(isDirty))
    await Promise.resolve()

    expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('registriert beforeunload wenn isDirty true wird', async () => {
    const isDirty = ref(false)
    mount(createTestComponent(isDirty))

    isDirty.value = true
    await Promise.resolve()

    expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('entfernt beforeunload wenn isDirty false wird', async () => {
    const isDirty = ref(true)
    mount(createTestComponent(isDirty))
    await Promise.resolve()
    vi.clearAllMocks()

    isDirty.value = false
    await Promise.resolve()

    expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('entfernt beforeunload beim Unmount', async () => {
    const isDirty = ref(true)
    const wrapper = mount(createTestComponent(isDirty))
    await Promise.resolve()
    vi.clearAllMocks()

    wrapper.unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('registriert keinen Listener wenn isDirty false bleibt', async () => {
    const isDirty = ref(false)
    mount(createTestComponent(isDirty))
    await Promise.resolve()

    expect(window.addEventListener).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('blockiert Router-Navigation wenn isDirty true ist', () => {
    window.confirm = vi.fn().mockReturnValue(false)
    const isDirty = ref(true)
    mount(createTestComponent(isDirty))

    const result = routeLeaveGuard?.()
    expect(result).toBe(false)
    expect(window.confirm).toHaveBeenCalled()
  })

  it('erlaubt Router-Navigation wenn isDirty false ist', () => {
    const isDirty = ref(false)
    mount(createTestComponent(isDirty))

    const result = routeLeaveGuard?.()
    expect(result).toBeUndefined()
  })
})
