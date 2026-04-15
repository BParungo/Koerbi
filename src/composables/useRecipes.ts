import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRecipesStore } from '@/stores/recipes.store'
import { useAsyncState } from '@/composables/useAsyncState'
import type { Recipe, CreateRecipeForm } from '@/types'

export function useRecipes() {
  const auth = useAuthStore()
  const store = useRecipesStore()
  const { error, loading } = useAsyncState()

  async function fetchRecipes() {
    if (!auth.family) return
    store.loading = true

    const { data, error: err } = await query(
      supabase
        .from('recipes')
        .select('*, ingredients(*)')
        .eq('family_id', auth.family.id)
        .order('created_at', { ascending: false }),
    )

    if (err) {
      error.value = err
    } else {
      store.recipes = (data as Recipe[]) ?? []
    }
    store.loading = false
  }

  async function fetchRecipe(id: string): Promise<Recipe | null> {
    const { data, error: err } = await query(
      supabase
        .from('recipes')
        .select('*, ingredients(*)')
        .eq('id', id)
        .single(),
    )

    if (err || !data) {
      error.value = err
      return null
    }
    return data as Recipe
  }

  async function syncIngredients(recipeId: string, ingredients: CreateRecipeForm['ingredients']) {
    await supabase.from('ingredients').delete().eq('recipe_id', recipeId)

    const filtered = ingredients.filter((ing) => ing.name.trim())
    if (filtered.length === 0) return

    await supabase.from('ingredients').insert(
      filtered.map((ing, i) => ({
        recipe_id: recipeId,
        name: ing.name,
        amount: ing.amount || null,
        unit: ing.unit || null,
        sort_order: i,
      })),
    )
  }

  async function createRecipe(form: CreateRecipeForm): Promise<Recipe | null> {
    if (!auth.family || !auth.user) return null
    error.value = null
    loading.value = true

    const { data: recipe, error: recipeErr } = await query(
      supabase
        .from('recipes')
        .insert({
          family_id: auth.family.id,
          created_by: auth.user.id,
          name: form.name,
          emoji: form.emoji || '🍽️',
          duration: form.duration || null,
          servings: form.servings,
          category: form.category || null,
          steps: form.steps.filter((s) => s.trim()),
        })
        .select()
        .single(),
    )

    if (recipeErr || !recipe) {
      error.value = recipeErr ?? 'Rezept konnte nicht erstellt werden'
      loading.value = false
      return null
    }

    await syncIngredients(recipe.id, form.ingredients)
    await fetchRecipes()
    loading.value = false
    return recipe as Recipe
  }

  async function updateRecipe(id: string, form: CreateRecipeForm): Promise<boolean> {
    error.value = null
    loading.value = true

    const { error: updateErr } = await query(
      supabase
        .from('recipes')
        .update({
          name: form.name,
          emoji: form.emoji || '🍽️',
          duration: form.duration || null,
          servings: form.servings,
          category: form.category || null,
          steps: form.steps.filter((s) => s.trim()),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single(),
    )

    if (updateErr) {
      error.value = updateErr
      loading.value = false
      return false
    }

    await syncIngredients(id, form.ingredients)
    await fetchRecipes()
    loading.value = false
    return true
  }

  async function deleteRecipe(id: string): Promise<boolean> {
    error.value = null
    loading.value = true

    const { error: delErr } = await query(
      supabase.from('recipes').delete().eq('id', id).select().single(),
    )

    if (delErr) {
      error.value = delErr
      loading.value = false
      return false
    }

    store.recipes = store.recipes.filter((r) => r.id !== id)
    loading.value = false
    return true
  }

  async function addIngredientsToShoppingList(recipeId: string, listId: string) {
    const recipe = store.recipes.find((r) => r.id === recipeId)
    if (!recipe || !auth.family) return false

    const { error: insertErr } = await query(
      supabase.from('shopping_items').insert(
        recipe.ingredients.map((ing, i) => ({
          list_id: listId,
          family_id: auth.family!.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          from_recipe_id: recipeId,
          sort_order: i,
        })),
      ),
    )

    if (insertErr) {
      error.value = insertErr
      return false
    }
    return true
  }

  return {
    error,
    loading,
    fetchRecipes,
    fetchRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    addIngredientsToShoppingList,
  }
}
