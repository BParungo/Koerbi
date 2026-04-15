import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useShoppingStore } from '@/stores/shopping.store'
import type { ShoppingItem } from '@/types'

export function useRealtimeSubscription(activeListId: Ref<string | null>) {
  const store = useShoppingStore()
  let subscription: ReturnType<typeof supabase.channel> | null = null

  function subscribe(listId: string) {
    unsubscribe()

    subscription = supabase
      .channel(`shopping_items:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${listId}`
        },
        (payload) => {
          if (!store.activeList || store.activeList.id !== listId) return

          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as ShoppingItem
            const exists = store.activeList.items.some((i) => i.id === newItem.id)
            if (!exists) store.activeList.items.push(newItem)
          }

          if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as ShoppingItem
            const idx = store.activeList.items.findIndex((i) => i.id === updatedItem.id)
            if (idx !== -1) store.activeList.items[idx] = updatedItem
          }

          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id
            store.activeList.items = store.activeList.items.filter((i) => i.id !== oldId)
          }
        }
      )
      .subscribe((status, err) => {
        if (err) console.error('[Realtime] Subscription error:', err)
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error, retrying in 5s...')
          setTimeout(() => subscribe(listId), 5000)
        }
      })
  }

  function unsubscribe() {
    if (subscription) {
      supabase.removeChannel(subscription)
      subscription = null
    }
  }

  watch(
    activeListId,
    (listId) => {
      if (listId) {
        subscribe(listId)
      } else {
        unsubscribe()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    unsubscribe()
  })
}
