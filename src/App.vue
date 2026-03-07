<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'

const auth = useAuthStore()
const route = useRoute()

auth.initAuth()

const showAppShell = computed(() => auth.isLoggedIn && route.name !== 'login')
const showBottomNav = computed(() => showAppShell.value && !!route.meta.requiresFamily)
</script>

<template>
  <LoadingSpinner v-if="auth.loading" fullscreen />

  <div v-else-if="showAppShell" class="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
    <AppHeader />
    <main class="flex-1 pb-20 md:pb-6">
      <RouterView />
    </main>
    <BottomNav v-if="showBottomNav" />
  </div>

  <RouterView v-else />
</template>
