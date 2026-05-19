import type { PreferenceType } from '@/types'

export interface PreferenceDef {
  type: PreferenceType
  value: string
  label: string
  /** Open Food Facts allergen tags that trigger a "danger" match for this preference */
  allergenTags?: string[]
  /** ingredients_analysis_tags that trigger "danger" if the product has them */
  forbiddenAnalysisTags?: string[]
  /** ingredients_analysis_tags that must be present for the product to be "ok" */
  requiredAnalysisTags?: string[]
  /** labels_tags that count as proof for requirements (e.g. "en:vegan") */
  proofLabels?: string[]
}

export const PREFERENCE_DEFS: PreferenceDef[] = [
  { type: 'allergy', value: 'nuts', label: 'Nüsse', allergenTags: ['en:nuts'] },
  { type: 'allergy', value: 'peanuts', label: 'Erdnüsse', allergenTags: ['en:peanuts'] },
  { type: 'allergy', value: 'lactose', label: 'Laktose', allergenTags: ['en:milk'] },
  { type: 'allergy', value: 'gluten', label: 'Gluten', allergenTags: ['en:gluten'] },
  { type: 'allergy', value: 'eggs', label: 'Eier', allergenTags: ['en:eggs'] },
  { type: 'allergy', value: 'soy', label: 'Soja', allergenTags: ['en:soybeans'] },
  { type: 'allergy', value: 'fish', label: 'Fisch', allergenTags: ['en:fish'] },
  { type: 'allergy', value: 'crustaceans', label: 'Krustentiere', allergenTags: ['en:crustaceans'] },
  { type: 'allergy', value: 'celery', label: 'Sellerie', allergenTags: ['en:celery'] },
  {
    type: 'diet',
    value: 'vegan',
    label: 'Vegan',
    forbiddenAnalysisTags: ['en:non-vegan'],
    requiredAnalysisTags: ['en:vegan'],
    proofLabels: ['en:vegan'],
  },
  {
    type: 'diet',
    value: 'vegetarian',
    label: 'Vegetarisch',
    forbiddenAnalysisTags: ['en:non-vegetarian'],
    requiredAnalysisTags: ['en:vegetarian'],
    proofLabels: ['en:vegetarian', 'en:vegan'],
  },
  { type: 'diet', value: 'halal', label: 'Halal', proofLabels: ['en:halal'] },
  { type: 'diet', value: 'kosher', label: 'Koscher', proofLabels: ['en:kosher'] },
  {
    type: 'diet',
    value: 'sugar-free',
    label: 'Zuckerfrei',
    forbiddenAnalysisTags: ['en:added-sugar'],
  },
]

export function getPreferenceDef(type: PreferenceType, value: string): PreferenceDef | undefined {
  return PREFERENCE_DEFS.find((p) => p.type === type && p.value === value)
}

export function getPreferenceLabel(type: PreferenceType, value: string): string {
  return getPreferenceDef(type, value)?.label ?? value
}
