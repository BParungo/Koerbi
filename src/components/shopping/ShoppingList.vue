<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-vue-next'
import ShoppingItem from './ShoppingItem.vue'
import type { ShoppingItem as ShoppingItemType, FamilyMember } from '@/types'

const props = defineProps<{
  pendingItems: ShoppingItemType[]
  doneItems: ShoppingItemType[]
  members: FamilyMember[]
  recipeNames?: Record<string, string>
}>()

const emit = defineEmits<{
  toggle: [id: string]
  delete: [id: string]
  assign: [id: string, userId: string | null]
  'clear-done': []
}>()

const groupedPendingItems = computed(() => {
  const groups = new Map<string, ShoppingItemType[]>()
  for (const item of props.pendingItems) {
    const cat = item.category || ''
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(item)
  }
  return groups
})

const hasCategories = computed(() => {
  const cats = new Set(props.pendingItems.map((i) => i.category).filter(Boolean))
  return cats.size > 0
})
</script>

<template>
  <div class="space-y-1">
    <!-- Pending Items grouped by category -->
    <template v-if="hasCategories">
      <template v-for="[category, items] in groupedPendingItems" :key="category">
        <p v-if="category" class="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {{ category }}
        </p>
        <ShoppingItem
          v-for="item in items"
          :key="item.id"
          :item="item"
          :members="members"
          :recipe-name="item.from_recipe_id ? recipeNames?.[item.from_recipe_id] : undefined"
          @toggle="emit('toggle', $event)"
          @delete="emit('delete', $event)"
          @assign="(id, userId) => emit('assign', id, userId)"
        />
      </template>
    </template>

    <!-- Pending Items flat (no categories) -->
    <template v-else>
      <ShoppingItem
        v-for="item in pendingItems"
        :key="item.id"
        :item="item"
        :members="members"
        :recipe-name="item.from_recipe_id ? recipeNames?.[item.from_recipe_id] : undefined"
        @toggle="emit('toggle', $event)"
        @delete="emit('delete', $event)"
        @assign="(id, userId) => emit('assign', id, userId)"
      />
    </template>

    <!-- Empty state -->
    <p v-if="!pendingItems.length && !doneItems.length" class="py-8 text-center text-muted-foreground">
      Keine Artikel auf der Liste
    </p>

    <!-- Done section -->
    <template v-if="doneItems.length">
      <Separator class="my-3" />
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-muted-foreground">
          Erledigt ({{ doneItems.length }})
        </p>
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground"
          @click="emit('clear-done')"
        >
          <Trash2 class="mr-1 h-3 w-3" />
          Alle entfernen
        </Button>
      </div>
      <ShoppingItem
        v-for="item in doneItems"
        :key="item.id"
        :item="item"
        :members="members"
        :recipe-name="item.from_recipe_id ? recipeNames?.[item.from_recipe_id] : undefined"
        @toggle="emit('toggle', $event)"
        @delete="emit('delete', $event)"
        @assign="(id, userId) => emit('assign', id, userId)"
      />
    </template>
  </div>
</template>
