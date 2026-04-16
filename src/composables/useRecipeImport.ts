import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAsyncState } from '@/composables/useAsyncState'

export interface ImportedRecipe {
  title: string
  servings: number
  duration: string
  category: string
  ingredients: { name: string; amount: string; unit: string }[]
  steps: string[]
}

export type ImportType = 'image' | 'pdf' | 'url' | 'text'

export function useRecipeImport() {
  const { error, loading } = useAsyncState()
  const result = ref<ImportedRecipe | null>(null)

  async function importRecipe(type: ImportType, data: string): Promise<ImportedRecipe | null> {
    error.value = null
    loading.value = true
    result.value = null

    const { data: response, error: fnError } = await supabase.functions.invoke('import-recipe', {
      body: { type, data },
    })

    loading.value = false

    if (fnError) {
      error.value = fnError.message ?? 'Import fehlgeschlagen'
      return null
    }

    if (response?.error) {
      error.value = response.error
      return null
    }

    result.value = response as ImportedRecipe
    return result.value
  }

  return { importRecipe, result, loading, error }
}
