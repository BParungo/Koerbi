import type { User } from '@supabase/supabase-js'
import type { Tables } from './database'

export type Family = Tables<'families'>
export type FamilyMember = Tables<'family_members'>

export interface AuthState {
  user: User | null
  member: FamilyMember | null
  family: Family | null
  loading: boolean
}
