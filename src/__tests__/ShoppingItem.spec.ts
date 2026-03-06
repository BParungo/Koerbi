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

describe('ShoppingItem', () => {
  it('emits assign when assignment changes', async () => {
    const wrapper = mount(ShoppingItem, {
      props: {
        item: makeItem(),
        members: [makeMember()],
      },
    })

    await wrapper.find('select').setValue('user-1')

    expect(wrapper.emitted('assign')).toBeTruthy()
    expect(wrapper.emitted('assign')![0]).toEqual(['item-1', 'user-1'])
  })

  it('emits delete after left swipe threshold is reached', async () => {
    const wrapper = mount(ShoppingItem, {
      props: {
        item: makeItem(),
        members: [makeMember()],
      },
    })

    const row = wrapper.find('div.flex.items-center.gap-3.rounded-lg')
    await row.trigger('pointerdown', { clientX: 200 })
    await row.trigger('pointermove', { clientX: 100 })
    await row.trigger('pointerup', { clientX: 100 })

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual(['item-1'])
  })
})
