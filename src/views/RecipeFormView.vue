<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipes } from '@/composables/useRecipes'
import RecipeForm from '@/components/recipe/RecipeForm.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { Recipe, CreateRecipeForm } from '@/types'

const route = useRoute()
const router = useRouter()
const { fetchRecipe, createRecipe, updateRecipe, error, loading } = useRecipes()

const recipe = ref<Recipe | null>(null)
const fetching = ref(false)
const isEdit = computed(() => !!route.params.id)

onMounted(async () => {
  if (route.params.id) {
    fetching.value = true
    recipe.value = await fetchRecipe(route.params.id as string)
    fetching.value = false
  }
})

async function handleSubmit(form: CreateRecipeForm) {
  if (isEdit.value && route.params.id) {
    const success = await updateRecipe(route.params.id as string, form)
    if (success) {
      router.push({ name: 'recipe-detail', params: { id: route.params.id } })
    }
  } else {
    const created = await createRecipe(form)
    if (created) {
      router.push({ name: 'recipe-detail', params: { id: created.id } })
    }
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="mx-auto max-w-lg p-4">
    <div class="mb-6 flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="handleCancel">
        <ArrowLeft class="h-5 w-5" />
      </Button>
      <h1 class="text-2xl font-bold">
        {{ isEdit ? 'Rezept bearbeiten' : 'Neues Rezept' }}
      </h1>
    </div>

    <LoadingSpinner v-if="fetching" />
    <RecipeForm
      v-else
      :recipe="recipe ?? undefined"
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
