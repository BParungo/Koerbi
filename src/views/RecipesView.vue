<script setup lang="ts">
import { onMounted } from 'vue'
import { useRecipesStore } from '@/stores/recipes.store'
import { useRecipes } from '@/composables/useRecipes'
import RecipeCard from '@/components/recipe/RecipeCard.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, ChefHat } from 'lucide-vue-next'

const store = useRecipesStore()
const { fetchRecipes } = useRecipes()

onMounted(() => {
  if (!store.recipes.length) {
    fetchRecipes()
  }
})
</script>

<template>
  <div class="mx-auto max-w-lg space-y-4 p-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Rezepte</h1>
      <RouterLink :to="{ name: 'recipe-new' }">
        <Button size="sm">
          <Plus class="mr-1 h-4 w-4" />
          Neu
        </Button>
      </RouterLink>
    </div>

    <!-- Search -->
    <div class="relative">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="store.searchQuery" placeholder="Rezept suchen..." class="pl-9" />
    </div>

    <!-- Category Filter -->
    <div v-if="store.categories.length > 1" class="flex flex-wrap gap-2">
      <Badge
        v-for="cat in store.categories"
        :key="cat"
        :variant="store.activeCategory === cat ? 'default' : 'outline'"
        class="cursor-pointer"
        @click="store.activeCategory = cat"
      >
        {{ cat }}
      </Badge>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="store.loading" />

    <!-- Recipe List -->
    <div v-else-if="store.filteredRecipes.length" class="space-y-3">
      <RecipeCard v-for="recipe in store.filteredRecipes" :key="recipe.id" :recipe="recipe" />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else
      :title="
        store.searchQuery || store.activeCategory !== 'Alle'
          ? 'Keine Rezepte gefunden'
          : 'Noch keine Rezepte vorhanden'
      "
      :description="
        store.searchQuery || store.activeCategory !== 'Alle'
          ? 'Passe Suche oder Kategorie an.'
          : 'Lege dein erstes Rezept an, um loszulegen.'
      "
    >
      <template #icon>
        <ChefHat class="h-6 w-6" />
      </template>

      <template v-if="!store.searchQuery && store.activeCategory === 'Alle'" #action>
        <RouterLink :to="{ name: 'recipe-new' }">
          <Button variant="outline">
            <Plus class="mr-1 h-4 w-4" />
            Erstes Rezept erstellen
          </Button>
        </RouterLink>
      </template>
    </EmptyState>
  </div>
</template>
