<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useSnackbar } from '@/composables/useSnackbar'

const { current, dismiss, runAction } = useSnackbar()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="current"
      :key="current.id"
      role="status"
      aria-live="polite"
      class="fixed inset-x-0 bottom-[calc(4rem+max(env(safe-area-inset-bottom),0.5rem))] z-40 flex justify-center px-4 md:bottom-6"
    >
      <div
        class="flex w-full max-w-md items-center gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg"
      >
        <span class="min-w-0 flex-1 truncate">{{ current.message }}</span>
        <Button
          v-if="current.action"
          variant="ghost"
          size="sm"
          class="h-7 shrink-0 px-2 font-semibold text-background hover:bg-background/20 hover:text-background"
          @click="runAction"
        >
          {{ current.action.label }}
        </Button>
        <button
          type="button"
          class="shrink-0 text-background/70 hover:text-background"
          aria-label="Schließen"
          @click="dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  </Transition>
</template>
