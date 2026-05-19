import type { User } from '@supabase/supabase-js'
import type { Tables } from './database'

export type Family = Tables<'families'>
export type FamilyMember = Tables<'family_members'>
export type Ingredient = Tables<'ingredients'>
export type Recipe = Tables<'recipes'> & { ingredients: Ingredient[] }

export interface CreateRecipeForm {
  name: string
  duration: string
  servings: number
  category: string
  steps: string[]
  ingredients: { name: string; amount: string; unit: string }[]
  image?: File | null
}

export type ShoppingItem = Tables<'shopping_items'>
export type ShoppingList = Tables<'shopping_lists'> & { items: ShoppingItem[] }

export interface CreateShoppingItemForm {
  name: string
  amount?: string
  unit?: string
  category?: string
  assigned_to?: string | null
}

export interface AuthState {
  user: User | null
  member: FamilyMember | null
  family: Family | null
  loading: boolean
}

export type PreferenceType = 'allergy' | 'diet'

export interface MemberPreference {
  id: string
  member_id: string
  type: PreferenceType
  value: string
  created_at: string | null
}

export interface Product {
  ean: string
  name: string
  brand?: string
  imageUrl?: string
  allergens: string[]
  ingredientAnalysis: string[]
  labels: string[]
}

export type CheckStatus = 'ok' | 'warning' | 'danger'

export interface MemberCheckResult {
  member: FamilyMember
  status: CheckStatus
  reasons: string[]
}
