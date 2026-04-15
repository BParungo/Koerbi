<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, UtensilsCrossed } from 'lucide-vue-next'
import type { Recipe } from '@/types'

defineProps<{
  recipe: Recipe
}>()
</script>

<template>
  <RouterLink :to="{ name: 'recipe-detail', params: { id: recipe.id } }">
    <Card class="transition-shadow hover:shadow-md">
      <CardContent class="flex items-center gap-3 p-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          <img v-if="recipe.image_url" :src="recipe.image_url" class="h-full w-full object-cover" :alt="recipe.name" />
          <UtensilsCrossed v-else class="h-6 w-6 text-muted-foreground" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">{{ recipe.name }}</p>
          <div class="mt-1 flex items-center gap-2">
            <Badge v-if="recipe.category" variant="secondary" class="text-xs">
              {{ recipe.category }}
            </Badge>
            <span v-if="recipe.duration" class="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock class="h-3 w-3" />
              {{ recipe.duration }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </RouterLink>
</template>
