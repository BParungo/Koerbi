<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { BookOpen, ShoppingCart, Settings } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarEmoji, getAvatarImageUrl } from '@/utils/avatar'

const auth = useAuthStore()
const route = useRoute()

const memberAvatar = computed(() => auth.member?.avatar ?? null)
const avatarEmoji = computed(() => getAvatarEmoji(memberAvatar.value))
const avatarUrl = computed(() => getAvatarImageUrl(memberAvatar.value) || undefined)
const initials = computed(() => auth.displayName.slice(0, 2).toUpperCase())

const pageTitles: Record<string, string> = {
  recipes: 'Rezepte',
  'recipe-new': 'Neues Rezept',
  'recipe-detail': 'Rezept',
  'recipe-edit': 'Rezept bearbeiten',
  shopping: 'Einkauf',
  settings: 'Einstellungen',
}

const pageTitle = computed(() => {
  const name = String(route.name ?? '')
  return pageTitles[name] ?? ''
})

type DesktopNavItem = {
  routeName: 'recipes' | 'shopping' | 'settings'
  label: string
  icon: typeof BookOpen
  matchPrefix: string
}

const navItems: DesktopNavItem[] = [
  { routeName: 'recipes', label: 'Rezepte', icon: BookOpen, matchPrefix: '/recipes' },
  { routeName: 'shopping', label: 'Einkauf', icon: ShoppingCart, matchPrefix: '/shopping' },
  { routeName: 'settings', label: 'Einstellungen', icon: Settings, matchPrefix: '/settings' }
]

const showDesktopNav = computed(() => !!route.meta.requiresFamily)

function isActive(item: DesktopNavItem) {
  return route.name === item.routeName || route.path.startsWith(item.matchPrefix)
}
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
  >
    <div class="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
      <!-- Logo + Seitentitel -->
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <img src="/koerbi.svg" alt="Koerbi" class="h-9 w-auto shrink-0" />
        <span v-if="pageTitle" class="truncate text-sm font-medium md:hidden">{{ pageTitle }}</span>
      </div>

      <!-- Desktop Nav -->
      <nav
        v-if="showDesktopNav"
        class="hidden items-center gap-1 md:flex"
        aria-label="Desktop Navigation"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          :class="
            cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive(item)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )
          "
        >
          <component :is="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- User Avatar → Settings -->
      <RouterLink :to="{ name: 'settings' }" class="shrink-0">
        <Avatar class="h-9 w-9 border">
          <AvatarImage v-if="avatarUrl" :src="avatarUrl" :alt="auth.displayName" />
          <AvatarFallback>{{ avatarEmoji || initials }}</AvatarFallback>
        </Avatar>
      </RouterLink>
    </div>
  </header>
</template>
