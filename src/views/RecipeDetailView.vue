<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipes } from '@/composables/useRecipes'
import { useRecipesStore } from '@/stores/recipes.store'
import { useAuthStore } from '@/stores/auth.store'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import RecipeDetail from '@/components/recipe/RecipeDetail.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft } from 'lucide-vue-next'
import type { Recipe } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useRecipesStore()
const auth = useAuthStore()
const { fetchRecipe, deleteRecipe } = useRecipes()

const recipe = ref<Recipe | null>(null)
const loading = ref(true)
const showDeleteDialog = ref(false)
const showListDialog = ref(false)
const deleting = ref(false)
const shoppingLists = ref<{ id: string; name: string | null }[]>([])

onMounted(async () => {
  const id = route.params.id as string

  // Try from store first
  const fromStore = store.recipes.find((r) => r.id === id)
  if (fromStore) {
    recipe.value = fromStore
    loading.value = false
    return
  }

  recipe.value = await fetchRecipe(id)
  loading.value = false
})

function handleEdit() {
  router.push({ name: 'recipe-edit', params: { id: recipe.value!.id } })
}

async function handleDelete() {
  if (!recipe.value) return
  deleting.value = true
  const success = await deleteRecipe(recipe.value.id)
  deleting.value = false
  showDeleteDialog.value = false
  if (success) {
    router.push({ name: 'recipes' })
  }
}

async function handleAddToList() {
  if (!auth.family) return

  const { data } = await query(
    supabase
      .from('shopping_lists')
      .select('id, name')
      .eq('family_id', auth.family.id)
      .order('created_at', { ascending: false }),
  )
  shoppingLists.value = data ?? []
  showListDialog.value = true
}

async function addToList(listId: string) {
  if (!recipe.value || !auth.family) return

  await supabase.from('shopping_items').insert(
    recipe.value.ingredients.map((ing, i) => ({
      list_id: listId,
      family_id: auth.family!.id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      from_recipe_id: recipe.value!.id,
      sort_order: i,
    })),
  )

  showListDialog.value = false
}
</script>

<template>
  <div class="mx-auto max-w-lg p-4">
    <!-- Back button -->
    <Button variant="ghost" size="icon" class="mb-4" @click="router.push({ name: 'recipes' })">
      <ArrowLeft class="h-5 w-5" />
    </Button>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="!recipe" class="py-12 text-center">
      <p class="text-muted-foreground">Rezept nicht gefunden</p>
    </div>

    <RecipeDetail
      v-else
      :recipe="recipe"
      @edit="handleEdit"
      @delete="showDeleteDialog = true"
      @add-to-list="handleAddToList"
    />

    <!-- Delete Confirmation -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rezept l&#246;schen?</DialogTitle>
          <DialogDescription>
            &#8222;{{ recipe?.name }}&#8220; wird unwiderruflich gel&#246;scht.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">Abbrechen</Button>
          <Button variant="destructive" :disabled="deleting" @click="handleDelete">
            {{ deleting ? 'Wird gel\u00F6scht...' : 'L\u00F6schen' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Shopping List Selection -->
    <Dialog v-model:open="showListDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einkaufsliste w&#228;hlen</DialogTitle>
          <DialogDescription>
            Zutaten von &#8222;{{ recipe?.name }}&#8220; hinzuf&#252;gen zu:
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-2">
          <Button
            v-for="list in shoppingLists"
            :key="list.id"
            variant="outline"
            class="w-full justify-start"
            @click="addToList(list.id)"
          >
            {{ list.name ?? 'Einkaufsliste' }}
          </Button>
          <p v-if="!shoppingLists.length" class="text-sm text-muted-foreground">
            Keine Einkaufslisten vorhanden. Erstelle zuerst eine unter Einkaufen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
