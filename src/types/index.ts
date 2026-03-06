import type { User } from '@supabase/supabase-js'
import type { Tables } from './database'

export type Family = Tables<'families'>
export type FamilyMember = Tables<'family_members'>
export type Ingredient = Tables<'ingredients'>
export type Recipe = Tables<'recipes'> & { ingredients: Ingredient[] }

export interface CreateRecipeForm {
  name: string
  emoji: string
  duration: string
  servings: number
  category: string
  steps: string[]
  ingredients: { name: string; amount: string; unit: string }[]
}

export interface AuthState {
  user: User | null
  member: FamilyMember | null
  family: Family | null
  loading: boolean
}
