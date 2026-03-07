<script setup lang="ts">
defineProps<{
  progress: number
}>()
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
      <div
        class="h-full rounded-full bg-primary transition-all duration-300"
        :style="{ width: `${progress}%` }"
      />
    </div>
    <span class="text-sm font-medium text-muted-foreground">{{ progress }}%</span>
  </div>
</template>
