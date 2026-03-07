<script setup lang="ts">
import { PackageSearch } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: ''
  }
)
</script>

<template>
  <div class="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
    <div
      class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground"
    >
      <slot name="icon">
        <PackageSearch class="h-6 w-6" />
      </slot>
    </div>

    <h2 class="text-base font-semibold">{{ title }}</h2>
    <p v-if="description" class="mt-1 text-sm text-muted-foreground">{{ description }}</p>

    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
