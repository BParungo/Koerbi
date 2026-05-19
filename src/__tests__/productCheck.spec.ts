import { describe, it, expect } from 'vitest'
import { checkProduct } from '@/utils/productCheck'
import type { FamilyMember, MemberPreference, Product } from '@/types'

function member(id: string, name = 'Test'): FamilyMember {
  return {
    id,
    user_id: `user-${id}`,
    family_id: 'fam-1',
    name,
    avatar: null,
    role: 'member',
    joined_at: null,
  }
}

function pref(memberId: string, type: 'allergy' | 'diet', value: string): MemberPreference {
  return { id: `${memberId}-${type}-${value}`, member_id: memberId, type, value, created_at: null }
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    ean: '1234',
    name: 'Testprodukt',
    allergens: [],
    ingredientAnalysis: [],
    labels: [],
    ...overrides,
  }
}

describe('checkProduct', () => {
  it('returns ok when no preferences match', () => {
    const result = checkProduct(product(), [member('a')], [])
    expect(result[0]!.status).toBe('ok')
    expect(result[0]!.reasons).toEqual([])
  })

  it('flags danger when an allergen is present', () => {
    const result = checkProduct(
      product({ allergens: ['en:nuts'] }),
      [member('a', 'Lisa')],
      [pref('a', 'allergy', 'nuts')],
    )
    expect(result[0]!.status).toBe('danger')
    expect(result[0]!.reasons).toContain('enthält Nüsse')
  })

  it('flags danger when diet has forbidden tag (non-vegan for vegan)', () => {
    const result = checkProduct(
      product({ ingredientAnalysis: ['en:non-vegan'] }),
      [member('a')],
      [pref('a', 'diet', 'vegan')],
    )
    expect(result[0]!.status).toBe('danger')
  })

  it('flags warning when vegan status is unclear (no proof, no required tag)', () => {
    const result = checkProduct(product(), [member('a')], [pref('a', 'diet', 'vegan')])
    expect(result[0]!.status).toBe('warning')
    expect(result[0]!.reasons[0]).toMatch(/unklar/i)
  })

  it('returns ok when required vegan tag is present', () => {
    const result = checkProduct(
      product({ ingredientAnalysis: ['en:vegan'] }),
      [member('a')],
      [pref('a', 'diet', 'vegan')],
    )
    expect(result[0]!.status).toBe('ok')
  })

  it('returns ok when proof label is present', () => {
    const result = checkProduct(
      product({ labels: ['en:vegan'] }),
      [member('a')],
      [pref('a', 'diet', 'vegan')],
    )
    expect(result[0]!.status).toBe('ok')
  })

  it('handles multiple members independently', () => {
    const a = member('a', 'Lisa')
    const b = member('b', 'Papa')
    const result = checkProduct(
      product({ allergens: ['en:nuts'] }),
      [a, b],
      [pref('a', 'allergy', 'nuts')],
    )
    expect(result.find((r) => r.member.id === 'a')!.status).toBe('danger')
    expect(result.find((r) => r.member.id === 'b')!.status).toBe('ok')
  })

  it('worst status wins per member', () => {
    const result = checkProduct(
      product({ allergens: ['en:nuts'] }),
      [member('a')],
      [pref('a', 'diet', 'vegan'), pref('a', 'allergy', 'nuts')],
    )
    expect(result[0]!.status).toBe('danger')
  })

  it('ignores unknown preference values gracefully', () => {
    const result = checkProduct(
      product(),
      [member('a')],
      [pref('a', 'allergy', 'something-unknown')],
    )
    expect(result[0]!.status).toBe('ok')
  })
})
