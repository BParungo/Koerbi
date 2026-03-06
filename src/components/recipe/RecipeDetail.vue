<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Clock, Users, Pencil, Trash2, ShoppingCart } from 'lucide-vue-next'
import { formatDate } from '@/utils/format'
import type { Recipe } from '@/types'

defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  addToList: []
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-4xl">{{ recipe.emoji ?? '🍽️' }}</span>
          <div>
            <h1 class="text-2xl font-bold">{{ recipe.name }}</h1>
            <div class="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <Badge v-if="recipe.category" variant="secondary">{{ recipe.category }}</Badge>
              <span v-if="recipe.duration" class="flex items-center gap-1">
                <Clock class="h-4 w-4" />
                {{ recipe.duration }}
              </span>
              <span v-if="recipe.servings" class="flex items-center gap-1">
                <Users class="h-4 w-4" />
                {{ recipe.servings }} Portionen
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" @click="emit('edit')">
        <Pencil class="mr-1 h-4 w-4" />
        Bearbeiten
      </Button>
      <Button variant="outline" size="sm" @click="emit('addToList')">
        <ShoppingCart class="mr-1 h-4 w-4" />
        Zur Einkaufsliste
      </Button>
      <Button variant="destructive" size="sm" @click="emit('delete')">
        <Trash2 class="mr-1 h-4 w-4" />
        Löschen
      </Button>
    </div>

    <Separator />

    <!-- Ingredients -->
    <div v-if="recipe.ingredients?.length">
      <h2 class="mb-3 text-lg font-semibold">Zutaten</h2>
      <ul class="space-y-2">
        <li
          v-for="ing in recipe.ingredients"
          :key="ing.id"
          class="flex items-baseline gap-2"
        >
          <span v-if="ing.amount || ing.unit" class="min-w-[80px] text-sm font-medium">
            {{ ing.amount }} {{ ing.unit }}
          </span>
          <span class="text-sm">{{ ing.name }}</span>
        </li>
      </ul>
    </div>

    <Separator v-if="recipe.ingredients?.length && recipe.steps?.length" />

    <!-- Steps -->
    <div v-if="recipe.steps?.length">
      <h2 class="mb-3 text-lg font-semibold">Zubereitung</h2>
      <ol class="space-y-4">
        <li
          v-for="(step, index) in recipe.steps"
          :key="index"
          class="flex gap-3"
        >
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {{ index + 1 }}
          </span>
          <p class="text-sm leading-relaxed">{{ step }}</p>
        </li>
      </ol>
    </div>

    <!-- Meta -->
    <div v-if="recipe.created_at" class="text-xs text-muted-foreground">
      Erstellt am {{ formatDate(recipe.created_at) }}
    </div>
  </div>
</template>
