import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AddItemForm from '@/components/shopping/AddItemForm.vue'
import type { FamilyMember } from '@/types'

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

describe('AddItemForm', () => {
  it('emits category in submit payload', async () => {
    const wrapper = mount(AddItemForm, {
      props: {
        members: [makeMember()],
      },
    })

    await wrapper.find('input[list="shopping-item-name-suggestions"]').setValue('Tomaten')
    await wrapper.findAll('input[placeholder="Menge"]')[0]!.setValue('2')
    await wrapper.findAll('input[placeholder="Einheit"]')[0]!.setValue('kg')
    await wrapper.findAll('input[placeholder="Kategorie"]')[0]!.setValue('Gemuese')

    await wrapper.find('select').setValue('user-1')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')![0]![0]).toEqual({
      name: 'Tomaten',
      amount: '2',
      unit: 'kg',
      category: 'Gemuese',
      assigned_to: 'user-1',
    })
  })

  it('renders category and item name autocomplete suggestions', () => {
    const wrapper = mount(AddItemForm, {
      props: {
        members: [makeMember()],
        categorySuggestions: ['Obst', 'Gemuese', 'Obst'],
        itemNameSuggestions: ['Milch', 'Brot', 'Milch'],
      },
    })

    const categoryInput = wrapper.find('input[list="shopping-category-suggestions"]')
    const itemInput = wrapper.find('input[list="shopping-item-name-suggestions"]')

    expect(categoryInput.exists()).toBe(true)
    expect(itemInput.exists()).toBe(true)
    expect(wrapper.findAll('datalist#shopping-category-suggestions option')).toHaveLength(2)
    expect(wrapper.findAll('datalist#shopping-item-name-suggestions option')).toHaveLength(2)
  })
})
