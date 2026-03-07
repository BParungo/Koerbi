<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-vue-next'
import type { ShoppingItem, FamilyMember } from '@/types'

const props = defineProps<{
  item: ShoppingItem
  members: FamilyMember[]
  recipeName?: string
}>()

const emit = defineEmits<{
  toggle: [id: string]
  delete: [id: string]
  assign: [id: string, userId: string | null]
}>()

const assignedMember = computed(() =>
  props.members.find((m) => m.user_id === props.item.assigned_to)
)

const swipeOffset = ref(0)
const startX = ref<number | null>(null)
const swiping = ref(false)
const SWIPE_DELETE_THRESHOLD = 72

function onPointerDown(event: PointerEvent) {
  startX.value = event.clientX
  swiping.value = true
}

function onPointerMove(event: PointerEvent) {
  if (!swiping.value || startX.value === null) return
  const delta = event.clientX - startX.value
  // Only track left swipe and cap visual offset.
  swipeOffset.value = Math.max(-120, Math.min(0, delta))
}

function onPointerEnd() {
  if (!swiping.value) return
  const shouldDelete = swipeOffset.value <= -SWIPE_DELETE_THRESHOLD
  swipeOffset.value = 0
  swiping.value = false
  startX.value = null
  if (shouldDelete) {
    emit('delete', props.item.id)
  }
}

function onAssignChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('assign', props.item.id, value || null)
}
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
    :class="{ 'opacity-50': item.done }"
    :style="{ transform: `translateX(${swipeOffset}px)` }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
  >
    <!-- Checkbox -->
    <button
      class="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors"
      :class="
        item.done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
      "
      @click="emit('toggle', item.id)"
    >
      <svg
        v-if="item.done"
        class="h-3 w-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M2 6l3 3 5-5" />
      </svg>
    </button>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <p class="text-sm" :class="{ 'line-through': item.done }">
        {{ item.name }}
      </p>
      <p
        v-if="item.amount || item.unit || recipeName"
        class="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      >
        <span v-if="item.amount || item.unit">{{ item.amount }} {{ item.unit }}</span>
        <span v-if="recipeName" class="rounded bg-muted px-1">{{ recipeName }}</span>
      </p>
    </div>

    <!-- Assigned -->
    <Badge v-if="assignedMember" variant="outline" class="shrink-0 text-xs">
      {{ assignedMember.name }}
    </Badge>

    <select
      v-if="members.length"
      :value="item.assigned_to ?? ''"
      class="h-8 rounded-md border border-input bg-background px-2 text-xs"
      @change="onAssignChange"
    >
      <option value="">-</option>
      <option v-for="member in members" :key="member.id" :value="member.user_id">
        {{ member.name }}
      </option>
    </select>

    <!-- Delete -->
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      @click="emit('delete', item.id)"
    >
      <Trash2 class="h-4 w-4" />
    </Button>
  </div>
</template>
