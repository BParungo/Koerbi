<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const auth = useAuthStore()
auth.initAuth()
</script>

<template>
  <LoadingSpinner v-if="auth.loading" />
  <RouterView v-else />
</template>
