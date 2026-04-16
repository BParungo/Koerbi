import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShoppingItem from '@/components/shopping/ShoppingItem.vue'
import type { FamilyMember, ShoppingItem as ShoppingItemType } from '@/types'

function makeMember(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'member-1',
    family_id: 'family-1',
    user_id: 'user-1',
    name: 'Alex',
    role: 'member',
    avatar: null,
    joined_at: null,
    ...overrides,
  }
}

function makeItem(overrides: Partial<ShoppingItemType> = {}): ShoppingItemType {
  return {
    id: 'item-1',
    list_id: 'list-1',
    family_id: 'family-1',
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

function getSwipeTarget(wrapper: ReturnType<typeof mount>) {
  // The inner swipeable div (relative flex items-center)
  return wrapper.find('div.relative.flex.items-center')
}

async function swipe(wrapper: ReturnType<typeof mount>, deltaX: number, deltaY = 0) {
  const el = getSwipeTarget(wrapper)
  await el.trigger('pointerdown', { clientX: 200, clientY: 100, pointerId: 1 })
  await el.trigger('pointermove', { clientX: 200 + deltaX, clientY: 100 + deltaY, pointerId: 1 })
  await el.trigger('pointerup', { clientX: 200 + deltaX, clientY: 100 + deltaY, pointerId: 1 })
}

describe('ShoppingItem', () => {
  it('emits assign when assignment changes', async () => {
    const wrapper = mount(ShoppingItem, {
      props: { item: makeItem(), members: [makeMember()] },
    })

    await wrapper.find('select').setValue('user-1')

    expect(wrapper.emitted('assign')).toBeTruthy()
    expect(wrapper.emitted('assign')![0]).toEqual(['item-1', 'user-1'])
  })

  it('emits delete after left swipe beyond threshold', async () => {
    const wrapper = mount(ShoppingItem, {
      props: { item: makeItem(), members: [] },
    })

    await swipe(wrapper, -100)

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual(['item-1'])
  })

  it('does not emit delete when swipe is too short', async () => {
    const wrapper = mount(ShoppingItem, {
      props: { item: makeItem(), members: [] },
    })

    await swipe(wrapper, -30)

    expect(wrapper.emitted('delete')).toBeFalsy()
  })

  it('does not emit delete when swipe is vertical', async () => {
    const wrapper = mount(ShoppingItem, {
      props: { item: makeItem(), members: [] },
    })

    // Vertical scroll: deltaY dominates over deltaX
    await swipe(wrapper, -5, 80)

    expect(wrapper.emitted('delete')).toBeFalsy()
  })

  it('does not emit delete on right swipe', async () => {
    const wrapper = mount(ShoppingItem, {
      props: { item: makeItem(), members: [] },
    })

    await swipe(wrapper, 100)

    expect(wrapper.emitted('delete')).toBeFalsy()
  })

  it('does not render delete button', () => {
    const wrapper = mount(ShoppingItem, {
      props: { item: makeItem(), members: [] },
    })

    // No button with delete/trash functionality should exist
    const buttons = wrapper.findAll('button')
    expect(buttons.every((b) => !b.classes().includes('hover:text-destructive'))).toBe(true)
  })
})
