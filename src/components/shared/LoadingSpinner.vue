<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    fullscreen?: boolean
    size?: 'sm' | 'md' | 'lg'
    label?: string
  }>(),
  {
    fullscreen: false,
    size: 'md',
    label: 'Laden'
  }
)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-5 w-5'
  if (props.size === 'lg') return 'h-10 w-10'
  return 'h-8 w-8'
})
</script>

<template>
  <div :class="cn('flex items-center justify-center', fullscreen ? 'min-h-screen' : 'py-8')">
    <LoaderCircle :class="cn('animate-spin text-primary', sizeClass)" />
    <span class="sr-only">{{ label }}</span>
  </div>
</template>
