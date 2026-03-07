import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ShoppingList } from '@/types'

export const useShoppingStore = defineStore('shopping', () => {
  const lists = ref<ShoppingList[]>([])
  const activeListId = ref<string | null>(null)
  const loading = ref(false)

  const activeList = computed(() =>
    lists.value.find((l) => l.id === activeListId.value) ?? null,
  )

  const pendingItems = computed(() =>
    (activeList.value?.items ?? []).filter((i) => !i.done),
  )

  const doneItems = computed(() =>
    (activeList.value?.items ?? []).filter((i) => i.done),
  )

  const progress = computed(() => {
    const total = activeList.value?.items.length ?? 0
    if (total === 0) return 0
    return Math.round((doneItems.value.length / total) * 100)
  })

  function setActiveList(list: ShoppingList) {
    const idx = lists.value.findIndex((l) => l.id === list.id)
    if (idx !== -1) {
      lists.value[idx] = list
    } else {
      lists.value.push(list)
    }
    activeListId.value = list.id
  }

  function $reset() {
    lists.value = []
    activeListId.value = null
    loading.value = false
  }

  return {
    lists,
    activeListId,
    activeList,
    loading,
    pendingItems,
    doneItems,
    progress,
    setActiveList,
    $reset,
  }
})
