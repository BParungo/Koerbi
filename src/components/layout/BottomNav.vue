<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { BookOpen, ShoppingCart } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

type NavItem = {
  routeName: 'recipes' | 'shopping'
  label: string
  icon: typeof BookOpen
  matchPrefix: string
}

const route = useRoute()

const items: NavItem[] = [
  { routeName: 'recipes', label: 'Rezepte', icon: BookOpen, matchPrefix: '/recipes' },
  { routeName: 'shopping', label: 'Einkauf', icon: ShoppingCart, matchPrefix: '/shopping' },
]

function isActive(item: NavItem) {
  return route.name === item.routeName || route.path.startsWith(item.matchPrefix)
}

const activeLabel = computed(() => items.find((item) => isActive(item))?.label ?? '')
</script>

<template>
  <nav
    aria-label="Hauptnavigation"
    class="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur supports-backdrop-filter:bg-background/90 md:hidden"
  >
    <div class="mx-auto grid h-16 w-full max-w-3xl grid-cols-2 px-2">
      <RouterLink
        v-for="item in items"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        class="flex items-center justify-center"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <div
          :class="
            cn(
              'flex w-full flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              isActive(item)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )
          "
        >
          <component :is="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </div>
      </RouterLink>
    </div>
    <span class="sr-only">Aktive Seite: {{ activeLabel }}</span>
  </nav>
</template>
