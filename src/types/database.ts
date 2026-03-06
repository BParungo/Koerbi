export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      families: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          avatar: string | null
          family_id: string | null
          id: string
          joined_at: string | null
          name: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          family_id?: string | null
          id?: string
          joined_at?: string | null
          name: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          family_id?: string | null
          id?: string
          joined_at?: string | null
          name?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'family_members_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          }
        ]
      }
      ingredients: {
        Row: {
          amount: string | null
          id: string
          name: string
          recipe_id: string | null
          sort_order: number | null
          unit: string | null
        }
        Insert: {
          amount?: string | null
          id?: string
          name: string
          recipe_id?: string | null
          sort_order?: number | null
          unit?: string | null
        }
        Update: {
          amount?: string | null
          id?: string
          name?: string
          recipe_id?: string | null
          sort_order?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ingredients_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
      recipes: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          duration: string | null
          emoji: string | null
          family_id: string | null
          id: string
          image_url: string | null
          name: string
          servings: number | null
          steps: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: string | null
          emoji?: string | null
          family_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          servings?: number | null
          steps?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: string | null
          emoji?: string | null
          family_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          servings?: number | null
          steps?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          }
        ]
      }
      shopping_items: {
        Row: {
          amount: string | null
          assigned_to: string | null
          category: string | null
          created_at: string | null
          done: boolean | null
          done_at: string | null
          done_by: string | null
          family_id: string | null
          from_recipe_id: string | null
          id: string
          list_id: string | null
          name: string
          sort_order: number | null
          unit: string | null
        }
        Insert: {
          amount?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          done?: boolean | null
          done_at?: string | null
          done_by?: string | null
          family_id?: string | null
          from_recipe_id?: string | null
          id?: string
          list_id?: string | null
          name: string
          sort_order?: number | null
          unit?: string | null
        }
        Update: {
          amount?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          done?: boolean | null
          done_at?: string | null
          done_by?: string | null
          family_id?: string | null
          from_recipe_id?: string | null
          id?: string
          list_id?: string | null
          name?: string
          sort_order?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'shopping_items_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shopping_items_from_recipe_id_fkey'
            columns: ['from_recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shopping_items_list_id_fkey'
            columns: ['list_id']
            isOneToOne: false
            referencedRelation: 'shopping_lists'
            referencedColumns: ['id']
          }
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          created_by: string | null
          family_id: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          family_id?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          family_id?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'shopping_lists_family_id_fkey'
            columns: ['family_id']
            isOneToOne: false
            referencedRelation: 'families'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      family_id_for_recipe: { Args: { recipe_uuid: string }; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      my_family_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {}
  }
} as const
